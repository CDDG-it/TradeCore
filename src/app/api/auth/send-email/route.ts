import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getEmailContent } from "@/lib/email/templates";

const SENDER_NAME = "TradingMC";

/**
 * Who the account emails come from, and over which relay.
 *
 * Resend once `RESEND_API_KEY` is set, and the old Gmail relay until then.
 *
 * The fallback is not indecision, it is the shape of a live migration: this
 * route sends the mail people need to create an account or get back into one,
 * so there must be no window where the code has moved and the credentials have
 * not. When the key lands in the environment the sender switches by itself,
 * and the Gmail branch can then be deleted.
 *
 * Resend's SMTP takes the literal username "resend" with the API key as the
 * password, so it needs one variable rather than a pair.
 */
function mailer() {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return {
      from: `"${SENDER_NAME}" <${process.env.MAIL_FROM ?? "no-reply@tradingmc.com"}>`,
      transport: {
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        auth: { user: "resend", pass: resendKey },
      },
    };
  }
  // Legacy: a personal Gmail account. Worse for trust and for deliverability,
  // and the variable names say Brevo for historical reasons only.
  return {
    from: `"${SENDER_NAME}" <${process.env.LEGACY_SMTP_FROM ?? "collinalmelo@gmail.com"}>`,
    transport: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_KEY },
    },
  };
}

function buildConfirmUrl(siteUrl: string, tokenHash: string, type: string, redirectTo?: string): string {
  const base = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
  if (redirectTo) return `${base}&next=${encodeURIComponent(redirectTo)}`;
  return base;
}

/**
 * Constant-time comparison of two secrets of any length.
 *
 * `timingSafeEqual` throws outright when the two buffers differ in length, so
 * comparing the raw strings turns a wrong-length guess into an unhandled
 * exception instead of a 401. Hashing first makes both sides a fixed 32 bytes,
 * which is what the function expects, and the digest of a wrong secret tells an
 * attacker nothing about the right one.
 */
function secretMatches(given: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  // Security: a shared secret, which Supabase sends with the hook call. This is
  // more reliable than Supabase's JWT signing, which doesn't always send
  // headers.
  //
  // A header is preferred over the query string: a URL is written to access
  // logs by every proxy it passes, so a secret in one leaks into logs nobody
  // meant to hold it. The query parameter is still accepted so an existing hook
  // keeps working, and can be retired once the hook is reconfigured to send
  // `x-hook-secret` instead.
  const endpointSecret = process.env.HOOK_ENDPOINT_SECRET;
  if (!endpointSecret) {
    console.error("[send-email] HOOK_ENDPOINT_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const incomingSecret = request.headers.get("x-hook-secret") ?? searchParams.get("secret");
  if (!incomingSecret || !secretMatches(incomingSecret, endpointSecret)) {
    console.error("[send-email] Invalid or missing endpoint secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    user: { email: string };
    email_data: {
      token_hash: string;
      redirect_to?: string;
      email_action_type: string;
      site_url: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { user, email_data } = body;
  const { token_hash, redirect_to, email_action_type } = email_data;

  const finalRedirect = email_action_type === "recovery" ? "/auth/update-password" : redirect_to;
  // Use configured site URL: never rely on site_url from payload (may point to Supabase directly)
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tradinghub-lovat.vercel.app";
  const confirmUrl = buildConfirmUrl(appUrl, token_hash, email_action_type, finalRedirect);
  const { subject, html } = getEmailContent(email_action_type, confirmUrl);

  const { from, transport } = mailer();
  const transporter = nodemailer.createTransport(transport);

  try {
    await transporter.sendMail({
      from,
      to: user.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("[send-email] SMTP error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({}, { headers: { "Cache-Control": "no-store" } });
}
