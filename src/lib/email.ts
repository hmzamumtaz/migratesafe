import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = "MigrateSafe <onboarding@resend.dev>";

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Welcome to MigrateSafe",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0E1116; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .logo-box { width: 36px; height: 36px; background: #1F5FAD; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .logo-icon { color: white; font-size: 18px; font-weight: bold; }
    .logo-text { color: #E6E9EF; font-size: 18px; font-weight: 700; }
    h1 { color: #E6E9EF; font-size: 24px; font-weight: 700; margin: 0 0 12px; }
    p { color: #9AA4B2; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #171B22; border: 1px solid #2A2F3A; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .card h2 { color: #E6E9EF; font-size: 16px; font-weight: 600; margin: 0 0 12px; }
    .step { display: flex; gap: 12px; margin-bottom: 12px; }
    .step-num { width: 28px; height: 28px; background: #1F5FAD; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .step-text { color: #9AA4B2; font-size: 14px; line-height: 28px; }
    .btn { display: inline-block; background: #1F5FAD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #2A2F3A; }
    .footer p { color: #6B7280; font-size: 12px; }
    .safe-badge { display: inline-block; background: rgba(30, 122, 70, 0.15); color: #34D27B; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-box"><span class="logo-icon">🛡</span></div>
        <span class="logo-text">MigrateSafe</span>
      </div>
      <h1>Welcome to MigrateSafe, ${name}</h1>
      <p>A senior DBA reviewing every migration, before it hits production. You're now protected against breaking changes, table locks, and data loss.</p>
    </div>

    <div class="card">
      <h2>Get started in 3 steps</h2>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">Connect your GitHub or GitLab repository</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">Connect a read-only database connection</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">Open a PR with a migration — get your first verdict</div>
      </div>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding" class="btn">Set up MigrateSafe →</a>
    </div>

    <div class="card" style="text-align: center;">
      <span class="safe-badge">🔒 Read-only access</span>
      <p style="margin-top: 8px; margin-bottom: 0;">We only read your schema structure — never your data rows.</p>
    </div>

    <div class="footer">
      <p>MigrateSafe — AI-Powered Migration Safety Reviews</p>
      <p>You're receiving this because you signed up at migratesafe.com</p>
    </div>
  </div>
</body>
</html>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

export async function sendOTPEmail(email: string, name: string, code: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your MigrateSafe verification code: ${code}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0E1116; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .logo-box { width: 36px; height: 36px; background: #1F5FAD; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .logo-icon { color: white; font-size: 18px; }
    .logo-text { color: #E6E9EF; font-size: 18px; font-weight: 700; }
    h1 { color: #E6E9EF; font-size: 24px; font-weight: 700; margin: 0 0 12px; }
    p { color: #9AA4B2; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .code-box { background: #171B22; border: 1px solid #2A2F3A; border-radius: 12px; padding: 32px; margin: 24px 0; text-align: center; }
    .code { color: #E6E9EF; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace; }
    .note { background: #171B22; border: 1px solid #2A2F3A; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .note p { margin: 0; color: #6B7280; font-size: 13px; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #2A2F3A; }
    .footer p { color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-box"><span class="logo-icon">🛡</span></div>
        <span class="logo-text">MigrateSafe</span>
      </div>
      <h1>Verify your email</h1>
      <p>Hi ${name}, use the code below to verify your email address.</p>
    </div>

    <div class="code-box">
      <div class="code">${code}</div>
    </div>

    <div class="note">
      <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p>MigrateSafe — AI-Powered Migration Safety Reviews</p>
    </div>
  </div>
</body>
</html>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

export async function sendVerdictEmail(
  email: string,
  name: string,
  prTitle: string,
  verdict: string,
  summary: string,
  repoName: string,
  checkId: string
) {
  const verdictColors: Record<string, { bg: string; text: string; emoji: string }> = {
    safe: { bg: "rgba(30, 122, 70, 0.15)", text: "#34D27B", emoji: "✅" },
    caution: { bg: "rgba(199, 119, 0, 0.15)", text: "#F59E0B", emoji: "⚠️" },
    dangerous: { bg: "rgba(179, 38, 30, 0.15)", text: "#F87171", emoji: "🚨" },
  };
  const v = verdictColors[verdict] || verdictColors.safe;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[MigrateSafe] ${verdict.toUpperCase()}: ${prTitle}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0E1116; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .logo-box { width: 36px; height: 36px; background: #1F5FAD; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .logo-icon { color: white; font-size: 18px; }
    .logo-text { color: #E6E9EF; font-size: 18px; font-weight: 700; }
    .verdict-badge { display: inline-block; background: ${v.bg}; color: ${v.text}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
    h1 { color: #E6E9EF; font-size: 18px; font-weight: 600; margin: 0 0 8px; }
    p { color: #9AA4B2; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #171B22; border: 1px solid #2A2F3A; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .meta { color: #6B7280; font-size: 13px; margin-bottom: 12px; }
    .btn { display: inline-block; background: #1F5FAD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #2A2F3A; }
    .footer p { color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-box"><span class="logo-icon">🛡</span></div>
        <span class="logo-text">MigrateSafe</span>
      </div>
      <div class="verdict-badge">${v.emoji} ${verdict.toUpperCase()}</div>
      <h1>${prTitle}</h1>
      <div class="meta">${repoName} · ${name}</div>
    </div>

    <div class="card">
      <p style="margin-bottom: 0;">${summary}</p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/checks/${checkId}" class="btn">View full report →</a>
    </div>

    <div class="footer">
      <p>MigrateSafe — AI-Powered Migration Safety Reviews</p>
    </div>
  </div>
</body>
</html>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verdict email:", error);
    return false;
  }
}
