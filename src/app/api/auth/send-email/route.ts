import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

function verifyHookSignature(authHeader: string | null, secret: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const secretBase64 = secret.replace(/^v1,whsec_/, "");
  const secretBytes = Buffer.from(secretBase64, "base64");
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(`${header}.${payload}`)
    .digest("base64url");
  try {
    // Compare decoded bytes to avoid base64url padding mismatches
    const sigBytes = Buffer.from(signature, "base64url");
    const expBytes = Buffer.from(expected, "base64url");
    if (sigBytes.length !== expBytes.length) return false;
    return crypto.timingSafeEqual(sigBytes, expBytes);
  } catch {
    return false;
  }
}

const SENDER_EMAIL = "info@cddegroot.nl";
const SENDER_NAME = "TradeCore";

function buildConfirmUrl(siteUrl: string, tokenHash: string, type: string, redirectTo?: string): string {
  const base = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
  if (redirectTo) return `${base}&next=${encodeURIComponent(redirectTo)}`;
  return base;
}

function getEmailContent(type: string, confirmUrl: string): { subject: string; html: string } {
  const header = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#fff;">
      <div style="margin-bottom:32px;">
        <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;">
          <span style="color:#111;">Trade</span><span style="color:#F97316;">CORE</span>
        </span>
      </div>
  `;
  const footer = `
      <p style="margin-top:32px;font-size:12px;color:#999;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  const btn = `<a href="${confirmUrl}" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">`;
  const link = `<p style="margin-top:20px;font-size:13px;color:#999;">Or copy this link: <a href="${confirmUrl}" style="color:#F97316;">${confirmUrl}</a></p>`;

  if (type === "signup") {
    return {
      subject: "Verify your TradeCore account",
      html: `${header}<h2 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#111;">Verify your email</h2><p style="color:#555;margin-bottom:24px;">Click the button below to activate your TradeCore account.</p>${btn}Verify email</a>${link}${footer}`,
    };
  }
  if (type === "recovery") {
    return {
      subject: "Reset your TradeCore password",
      html: `${header}<h2 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#111;">Reset your password</h2><p style="color:#555;margin-bottom:24px;">Click the button below to choose a new password.</p>${btn}Reset password</a>${link}${footer}`,
    };
  }
  return {
    subject: "Action required — TradeCore",
    html: `${header}<h2 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#111;">Action required</h2><p style="color:#555;margin-bottom:24px;">Click the button below to continue.</p>${btn}Continue</a>${footer}`,
  };
}

export async function POST(request: NextRequest) {
  // Only block requests with NO authorization header at all
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
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
  const { token_hash, redirect_to, email_action_type, site_url } = email_data;

  const finalRedirect = email_action_type === "recovery" ? "/auth/update-password" : redirect_to;
  // Use configured site URL — never rely on site_url from payload (may point to Supabase directly)
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tradinghub-lovat.vercel.app";
  const confirmUrl = buildConfirmUrl(appUrl, token_hash, email_action_type, finalRedirect);
  const { subject, html } = getEmailContent(email_action_type, confirmUrl);

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: user.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("[send-email] SMTP error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({});
}
