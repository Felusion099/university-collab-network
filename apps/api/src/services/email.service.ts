import { logger } from "../utils/logger.js";

export interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
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

function createEmailService(): EmailService {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (apiKey && fromAddress) {
    return new ResendEmailService(apiKey, fromAddress);
  }

  return new MockEmailService();
}

export const emailService = createEmailService();
