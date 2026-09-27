/**
 * The account emails, in the TradingMC identity.
 *
 * Built with tables and inline styles rather than the CSS the site uses.
 * Outlook renders through Word, which drops flexbox, grid, custom properties
 * and most of a stylesheet, so anything written like a web page arrives as a
 * stack of unstyled text. What survives everywhere is a table with inline
 * attributes, which is what this is.
 *
 * The identity is carried by type and colour, not by images: most clients
 * block remote images until the reader allows them, so a logo would leave a
 * grey box exactly where the brand should be. The wordmark is live text.
 */

const NAVY = "#0B1120";
const CARD = "#131B2E";
const BORDER = "#1C2740";
const TURQUOISE = "#14B8A6";
const TEXT = "#F8FAFC";
const SECONDARY = "#CBD5E1";
const MUTED = "#64748B";

/** Clash Display and Barlow do not load in mail, so this is the closest stack. */
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export interface Letter {
  subject: string;
  /** Shown in the inbox list next to the subject. */
  preheader: string;
  heading: string;
  body: string;
  action: string;
}

function render(letter: Letter, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${letter.subject}</title>
</head>
<body style="margin:0;padding:0;background:${NAVY};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${letter.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NAVY};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <tr>
            <td style="padding-bottom:28px;font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.5px;color:${TEXT};">
              Trading<span style="color:${TURQUOISE};">MC</span>
            </td>
          </tr>

          <tr>
            <td style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:36px 32px;">
              <h1 style="margin:0 0 12px;font-family:${FONT};font-size:23px;line-height:1.25;font-weight:600;letter-spacing:-0.4px;color:${TEXT};">
                ${letter.heading}
              </h1>
              <p style="margin:0 0 28px;font-family:${FONT};font-size:15px;line-height:1.6;color:${SECONDARY};">
                ${letter.body}
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${TURQUOISE};border-radius:8px;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#081721;text-decoration:none;">
                      ${letter.action}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
                Or paste this link into your browser:<br>
                <a href="${confirmUrl}" style="color:${TURQUOISE};text-decoration:none;word-break:break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
              This link expires in an hour and works once. If you did not ask for it, ignore this message and nothing changes.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Every email Supabase asks us to send, in the words that fit it. */
const LETTERS: Record<string, Letter> = {
  signup: {
    subject: "Confirm your TradingMC account",
    preheader: "One click and your workspace is ready.",
    heading: "Confirm your email",
    body: "Welcome to TradingMC. Confirm this address and your workspace is ready.",
    action: "Confirm email",
  },
  recovery: {
    subject: "Reset your TradingMC password",
    preheader: "Choose a new password for your account.",
    heading: "Reset your password",
    body: "Use the button below to choose a new password. Your current one keeps working until you do.",
    action: "Choose a new password",
  },
  invite: {
    subject: "You have been invited to TradingMC",
    preheader: "Accept the invitation and set up your account.",
    heading: "You are invited",
    body: "Someone invited you to TradingMC. Accept below and set up your account.",
    action: "Accept invitation",
  },
  magiclink: {
    subject: "Your TradingMC sign-in link",
    preheader: "Sign in without a password.",
    heading: "Sign in to TradingMC",
    body: "Use the button below to sign in. No password needed.",
    action: "Sign in",
  },
  email_change: {
    subject: "Confirm your new TradingMC address",
    preheader: "Confirm the address you want to use from now on.",
    heading: "Confirm your new address",
    body: "Confirm this address to start using it for your TradingMC account.",
    action: "Confirm address",
  },
};

export function getEmailContent(type: string, confirmUrl: string): { subject: string; html: string } {
  /* Supabase splits an address change into `email_change_current` and
     `email_change_new`; both say the same thing to the person reading them. */
  const key = type.startsWith("email_change") ? "email_change" : type;
  const letter: Letter = LETTERS[key] ?? {
    subject: "Confirm this action on TradingMC",
    preheader: "One step left.",
    heading: "One step left",
    body: "Use the button below to continue.",
    action: "Continue",
  };
  return { subject: letter.subject, html: render(letter, confirmUrl) };
}

