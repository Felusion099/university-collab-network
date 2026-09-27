import { logger } from "../utils/logger.js";
import nodemailer from "nodemailer";

export interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendOtpEmail(to: string, code: string): Promise<void>;
}

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:5173";
}

function buildVerifyLink(token: string): string {
  return `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

function buildResetLink(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Development/testing implementation — logs the email instead of sending it.
 * This is the default whenever EMAIL_PROVIDER_API_KEY isn't configured, so
 * the auth flows are fully exercisable (including in tests) without a real
 * provider account.
 */
export class MockEmailService implements EmailService {
  async sendOtpEmail(to: string, code: string): Promise<void> {
    logger.info(
      { to, code },
      "[MockEmailService] OTP code (not actually sent)",
    );
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    logger.info(
      { to, link: buildVerifyLink(token) },
      "[MockEmailService] verification email (not actually sent)",
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    logger.info(
      { to, link: buildResetLink(token) },
      "[MockEmailService] password reset email (not actually sent)",
    );
  }
}

/**
 * Resend implementation. Talks to Resend's plain HTTP API directly (via the
 * platform's native fetch) rather than the `resend` npm SDK — see
 * DECISIONS.md D-011 for why: the SDK could not be installed in the
 * implementing session's sandbox (no registry access), and the HTTP API
 * itself is small and stable enough that a thin wrapper avoids the
 * dependency entirely. A future session with registry access may swap this
 * for the official SDK; the EmailService interface means nothing else needs
 * to change if it does.
 */
export class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.send(
      to,
      "Verify your email",
      this.emailHtml(buildVerifyLink(token), "Verify email"),
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.send(
      to,
      "Reset your password",
      this.emailHtml(buildResetLink(token), "Reset password"),
    );
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const html = `<p>Your verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p><p>It expires in 10 minutes. If you didn't request it, ignore this email.</p>`;
    await this.send(to, "Your verification code", html);
  }

  private emailHtml(link: string, action: string): string {
    return `<p>Click the link below to ${action.toLowerCase()}:</p><p><a href="${link}">${link}</a></p>`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: this.fromAddress, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Resend API error (${response.status}): ${body}`);
    }
  }
}


/**
 * Gmail SMTP — free, NO domain verification needed, delivers to ANY
 * recipient (500/day). Requires an App Password (Google Account →
 * Security → 2-Step Verification → App passwords) — set
 * SMTP_USER + SMTP_PASS in the env.
 */
export class GmailSmtpService implements EmailService {
  private transporter: import("nodemailer").Transporter | null = null;

  constructor(
    private readonly user: string,
    private readonly pass: string,
  ) {}

  private getTransport() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: { user: this.user, pass: this.pass },
        // Fail fast — some hosts (Render's free tier) drop outbound SMTP;
        // without these the send hangs and the request never returns
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }
    return this.transporter!;
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    await this.getTransport().sendMail({
      from: `UniCollab Campus <${this.user}>`,
      to,
      subject: "Your UniCollab verification code",
      html: `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><h2 style="margin:0 0 12px">Your verification code</h2><p style="color:#555;margin:0 0 18px">Enter this code to continue — it expires in 10 minutes.</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#4f46e5;margin:0">${code}</p><p style="color:#999;font-size:12px;margin-top:18px">If you didn't request it, ignore this email.</p></div>`,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.getTransport().sendMail({
      from: `UniCollab Campus <${this.user}>`,
      to,
      subject: "Verify your email — UniCollab Campus",
      html: `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><p>Click the link to verify your email:</p><p><a href="${buildVerifyLink(token)}">${buildVerifyLink(token)}</a></p></div>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.getTransport().sendMail({
      from: `UniCollab Campus <${this.user}>`,
      to,
      subject: "Reset your password — UniCollab Campus",
      html: `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><p>Click the link to reset your password:</p><p><a href="${buildResetLink(token)}">${buildResetLink(token)}</a></p></div>`,
    });
  }
}

/**
 * Brevo (ex-Sendinblue) — HTTPS API, free 300 emails/day, delivers to ANY
 * recipient. Immune to hosts that drop outbound SMTP (Render's free tier)
 * because it calls api.brevo.com over HTTPS. Set BREVO_API_KEY in the env.
 */
export class BrevoEmailService implements EmailService {
  private static readonly API_URL = "https://api.brevo.com/v3/smtp/email";

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fromName: string,
  ) {}

  private async send(subject: string, html: string, to: string): Promise<void> {
    const res = await fetch(BrevoEmailService.API_URL, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.from },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo send failed (${res.status}): ${body.slice(0, 200)}`);
    }
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    await this.send(
      "Your UniCollab verification code",
      `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><h2 style="margin:0 0 12px">Your verification code</h2><p style="color:#555;margin:0 0 18px">Enter this code to continue — it expires in 10 minutes.</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#4f46e5;margin:0">${code}</p><p style="color:#999;font-size:12px;margin-top:18px">If you didn't request it, ignore this email.</p></div>`,
      to,
    );
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.send(
      "Verify your email — UniCollab Campus",
      `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><p>Click the link to verify your email:</p><p><a href="${buildVerifyLink(token)}">${buildVerifyLink(token)}</a></p></div>`,
      to,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.send(
      "Reset your password — UniCollab Campus",
      `<div style="font-family:Inter,system-ui,sans-serif;padding:24px"><p>Click the link to reset your password:</p><p><a href="${buildResetLink(token)}">${buildResetLink(token)}</a></p></div>`,
      to,
    );
  }
}

function createEmailService(): EmailService {
  // Priority 1: Brevo (HTTPS API — immune to hosts that drop outbound SMTP,
  // delivers to ANYONE, free 300/day). Priority 2: Gmail SMTP (free, no
  // domain verification — works locally but some hosts block it).
  // Priority 3: Resend (needs a verified domain for non-owner recipients).
  // Fallback: MockEmailService (logs only — dev).
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    return new BrevoEmailService(
      brevoKey,
      process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || "noreply@unicollab.app",
      process.env.EMAIL_FROM_NAME || "UniCollab Campus",
    );
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    return new GmailSmtpService(smtpUser, smtpPass);
  }

  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (apiKey && fromAddress) {
    return new ResendEmailService(apiKey, fromAddress);
  }

  return new MockEmailService();
}

export const emailService = createEmailService();
