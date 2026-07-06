import { NextRequest } from "next/server";

// Fetches a user-provided iCal (.ics) feed server-side (avoids browser CORS) and
// returns the upcoming events. Works with Google Calendar's "secret iCal address"
// and Apple iCloud "public calendar" links (swap webcal:// for https://).

export const runtime = "nodejs";

type ParsedEvent = { summary: string; start: Date; end: Date; allDay: boolean };

function unfold(raw: string): string[] {
  // ICS folds long lines with a leading space/tab on the continuation line.
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseDate(value: string): { date: Date; allDay: boolean } | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) return { date: new Date(Number(y), Number(mo) - 1, Number(d)), allDay: true };
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay: false };
}

function parseICS(text: string): ParsedEvent[] {
  const lines = unfold(text);
  const events: ParsedEvent[] = [];
  let cur: Partial<ParsedEvent> & { allDay?: boolean } | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      cur = {};
    } else if (line.startsWith("END:VEVENT")) {
      if (cur && cur.start) {
        events.push({
          summary: cur.summary || "(untitled)",
          start: cur.start,
          end: cur.end || cur.start,
          allDay: !!cur.allDay,
        });
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const rawKey = line.slice(0, idx);
      const val = line.slice(idx + 1);
      const name = rawKey.split(";")[0].toUpperCase();
      if (name === "SUMMARY") {
        cur.summary = val.replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/gi, " ").trim();
      } else if (name === "DTSTART") {
        const p = parseDate(val);
        if (p) { cur.start = p.date; cur.allDay = p.allDay; }
      } else if (name === "DTEND") {
        const p = parseDate(val);
        if (p) cur.end = p.date;
      }
    }
  }
  return events;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") ?? "";
  const url = raw.replace(/^webcal:\/\//i, "https://");

  if (!/^https?:\/\//i.test(url)) {
    return Response.json({ error: "Please provide a valid http(s) calendar URL." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Tradecore/1.0", Accept: "text/calendar,*/*" },
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json({ error: `Calendar responded with ${res.status}.` }, { status: 502 });
    }
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) {
      return Response.json({ error: "That URL does not look like an iCal feed." }, { status: 422 });
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const upcoming = parseICS(text)
      .filter((e) => e.end >= now && e.start <= horizon)
      .sort((a, b) => +a.start - +b.start)
      .slice(0, 25)
      .map((e) => ({ summary: e.summary, start: e.start.toISOString(), allDay: e.allDay }));

    return Response.json({ events: upcoming });
  } catch {
    return Response.json({ error: "Could not load that calendar." }, { status: 502 });
  }
}
