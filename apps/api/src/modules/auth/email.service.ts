import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@gtexpress.com';

const c = {
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#EEF2FF',

  success: '#10B981',
  successLight: '#D1FAE5',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  bg: '#F8FAFC',
  surface: '#FFFFFF',

  text: '#1E293B',
  textMuted: '#64748B',

  border: '#E2E8F0',
};

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Notification</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: ${c.bg}; color: ${c.text}; line-height: 1.6; }
    @media (max-width: 480px) {
      .container { padding: 16px !important; }
      .body { padding: 24px 20px !important; }
      .footer { padding: 24px 20px !important; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${c.bg};">
    <tr><td class="container" style="padding: 48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
        <tr><td style="background: ${c.surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid ${c.border};">
          ${content}
        </td></tr>
        <tr><td class="footer" style="text-align: center; padding: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: ${c.textMuted};">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${c.primary}; text-decoration: none;">${SUPPORT_EMAIL}</a></p>
          <p style="margin: 0; font-size: 12px; color: ${c.textMuted};">&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function header(title: string, subtitle: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="background: linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%); padding: 40px 40px; text-align: center;">
      <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 700; color: #fff;">${title}</h1>
      <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.9);">${subtitle}</p>
    </td></tr>
  </table>`;
}

function body(content: string): string {
  return `<table class="body" width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 40px;">
    <tr><td>${content}</td></tr>
  </table>`;
}

function cta(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="padding: 8px 40px 32px;">
    <tr><td style="text-align: center;">
      <a href="${url}" style="display: inline-block; padding: 14px 32px; background: ${c.primary}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">${text}</a>
    </td></tr>
  </table>`;
}

function alert(text: string, type: 'warning' | 'info' | 'danger'): string {
  const styles = {
    warning: { bg: c.warningLight, border: c.warning, color: '#92400e' },
    info: { bg: c.primaryLight, border: c.primary, color: '#1e40af' },
    danger: { bg: c.dangerLight, border: c.danger, color: '#991b1b' },
  };
  const s = styles[type];
  return `<div style="background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px; color: ${s.color}; font-weight: 500;">${text}</p>
  </div>`;
}

function bullets(items: string[]): string {
  return `<ul style="margin: 0 0 24px; padding: 0 0 0 24px; font-size: 14px; line-height: 1.8;">
    ${items.map((item) => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
  </ul>`;
}

function infoBox(title: string, value: string): string {
  return `<div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; text-align: center;">
    <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: ${c.textMuted}; letter-spacing: 0.5px;">${title}</p>
    <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${c.text};">${value}</p>
  </div>`;
}

function divider(): string {
  return `<div style="height: 1px; background: ${c.border}; margin: 24px 0;"></div>`;
}

function footerLink(url: string): string {
  return `<p style="margin: 0; font-size: 13px; color: ${c.textMuted}; text-align: center;">
    Or copy this link: <a href="${url}" style="color: ${c.primary}; word-break: break-all;">${url}</a>
  </p>`;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST?.trim() || 'localhost'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = process.env.SMTP_PASS?.trim()
    const isLocal = smtpHost === '127.0.0.1' || smtpHost === 'localhost'

    const transportConfig: any = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      tls: {
        rejectUnauthorized: !isLocal,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    }

    // Only add auth if credentials provided (or for local dev without auth)
    if (smtpUser && smtpPass) {
      transportConfig.auth = { user: smtpUser, pass: smtpPass }
    } else if (!isLocal) {
      transportConfig.requireTLS = true
    }

    this.transporter = nodemailer.createTransport(transportConfig)
    this.fromAddress = process.env.SMTP_FROM || 'noreply@track.com'
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const smtpHost = process.env.SMTP_HOST?.trim()
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = process.env.SMTP_PASS?.trim()
    const isLocal = smtpHost === '127.0.0.1' || smtpHost === 'localhost'

    // Allow no auth for local development (Mailhog, etc.)
    if (!smtpHost) {
      this.logger.warn(`[EMAIL] SMTP_HOST not set. Skipping email to: ${options.to}`);
      return;
    }

    // For local SMTP (Mailhog), skip auth check
    if (isLocal && !smtpUser && !smtpPass) {
      this.logger.log(`[SMTP] Using local SMTP (Mailhog) for: ${options.to}`);
    } else if (!smtpUser || !smtpPass) {
      this.logger.warn(`[EMAIL] SMTP credentials missing. Skipping email to: ${options.to}`);
      return;
    }
    this.logger.log(
      '[SMTP] Sending email to',
      options.to,
      'via',
      process.env.SMTP_HOST + ':' + process.env.SMTP_PORT,
    );
    try {
      const mailOptions: any = {
        from: `"${process.env.SMTP_FROM_NAME || 'GT Express'}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };
      if (options.attachments?.length) {
        mailOptions.attachments = options.attachments;
      }

      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SMTP timeout after 10s')), 10000),
        ),
      ]);
      this.logger.log(
        'Email sent:',
        options.subject,
        'to',
        options.to,
        '| MessageId:',
        info.messageId,
      );
    } catch (error) {
      this.logger.error('Email send failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${APP_URL}/verify-email?token=${token}`;
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 24);
    const expiry = expiresDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await this.sendEmail({
      to: email,
      subject: 'Verify your email',
      html: wrapper(
        header(
          'Verify Your Email',
          'Thanks for signing up! Please verify your email to activate your account.',
        ) +
          body(
            alert(
              "This verification link expires in 24 hours. If you didn't create an account, ignore this email.",
              'info',
            ) +
              divider() +
              `<h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: ${c.text};">What happens next:</h3>` +
              bullets([
                'Click the button to verify your email address',
                'Set up your profile and preferences',
                'Access your personalized dashboard',
                'Start tracking shipments and managing quotes',
              ]) +
              `<div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: ${c.textMuted};">Link expires</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${c.text};">${expiry}</p>
          </div>`,
          ) +
          cta('Verify Email', url) +
          body(footerLink(url)),
      ),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${APP_URL}/reset-password?token=${token}`;
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 1);
    const expiry = expiresDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: wrapper(
        header(
          'Reset Your Password',
          'We received a request to reset your password. Create a new password to continue.',
        ) +
          body(
            alert(
              "If you didn't request a reset, ignore this email. Your password stays unchanged.",
              'warning',
            ) +
              divider() +
              `<h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: ${c.text};">To reset your password:</h3>` +
              bullets([
                'Click the button below to open the reset page',
                'Enter a new password (minimum 8 characters)',
                'Click "Update Password" to save',
                "You'll be logged in automatically after",
              ]) +
              `<div style="text-align: center; margin-bottom: 20px; padding: 16px; background: ${c.dangerLight}; border-radius: 8px;">
            <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: #991b1b;">This link expires</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #991b1b;">${expiry}</p>
          </div>` +
              alert('This link can only be used once for security.', 'danger'),
          ) +
          cta('Reset Password', url) +
          body(footerLink(url)),
      ),
    });
  }

async sendInvitationEmail(
    email: string,
    token: string,
    inviterName: string,
    organisationName: string,
  ): Promise<void> {
    const url = `${APP_URL}/register?token=${token}&email=${encodeURIComponent(email)}`;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 7);
    const expiry = expiresDate.toLocaleDateString('en-US', {
      dateStyle: 'long',
    });

    await this.sendEmail({
      to: email,
      subject: `You're invited to join ${organisationName}! 🚀`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're Invited!</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F1F5F9; color: #1E293B; line-height: 1.6; }
    @media (max-width: 480px) { .container { padding: 16px !important } }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Header with abstract modern design -->
          <tr>
            <td style="background: #0F172A; padding: 48px 32px; text-align: center; position: relative; overflow: hidden;">
              <!-- Floating abstract shapes -->
              <div style="position: absolute; top: -20px; left: -20px; width: 100px; height: 100px; background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%); border-radius: 50%; opacity: 0.3; filter: blur(40px);"></div>
              <div style="position: absolute; bottom: -30px; right: -20px; width: 120px; height: 120px; background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); border-radius: 50%; opacity: 0.3; filter: blur(50px);"></div>
              <div style="position: absolute; top: 30%; right: 10%; width: 60px; height: 60px; background: linear-gradient(135deg, #F472B6 0%, #FBBF24 100%); border-radius: 50%; opacity: 0.2; filter: blur(30px);"></div>
              <!-- Grid pattern overlay -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5;"></div>
              <!-- Content -->
              <div style="position: relative; z-index: 1;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%); border-radius: 24px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(99, 102, 241, 0.4); transform: rotate(-3deg);">
                  <svg width="40" height="40" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
                <h1 style="margin: 0 0 16px; font-size: 34px; font-weight: 700; color: #FFFFFF; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">You're Invited!</h1>
                <p style="margin: 0; font-size: 17px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                  <span style="font-weight: 600; color: #F472B6;">${inviterName}</span> invited you to join<br/>
                  <span style="font-weight: 700; color: #FFFFFF; font-size: 19px;">${organisationName}</span>
                </p>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Info Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background: #F8FAFC; border-radius: 12px; text-align: center; border: 1px solid #E2E8F0;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Organisation</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1E293B;">${organisationName}</p>
                  </td>
                </tr>
              </table>
              <!-- Features -->
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1E293B;">What you'll get:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-flex; width: 24px; height: 24px; background: #EEF2FF; border-radius: 50%; margin-right: 12px; vertical-align: middle;">
                      <svg width="14" height="14" fill="#6366F1" viewBox="0 0 20 20" style="margin: 5px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Personalized dashboard</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-flex; width: 24px; height: 24px; background: #EEF2FF; border-radius: 50%; margin-right: 12px; vertical-align: middle;">
                      <svg width="14" height="14" fill="#6366F1" viewBox="0 0 20 20" style="margin: 5px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Shipment tracking & management</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-flex; width: 24px; height: 24px; background: #EEF2FF; border-radius: 50%; margin-right: 12px; vertical-align: middle;">
                      <svg width="14" height="14" fill="#6366F1" viewBox="0 0 20 20" style="margin: 5px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Quote requests & orders</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-flex; width: 24px; height: 24px; background: #EEF2FF; border-radius: 50%; margin-right: 12px; vertical-align: middle;">
                      <svg width="14" height="14" fill="#6366F1" viewBox="0 0 20 20" style="margin: 5px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Real-time notifications</span>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400E;">
                  <strong>⏰ This invitation expires on ${expiry}</strong>
                </p>
              </div>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);">Accept Invitation →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748B;">Having trouble? Copy and paste this link into your browser:</p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #6366F1; word-break: break-all;">${url}</p>
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">© ${new Date().getFullYear()} ${organisationName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    const expiresIn = '5 minutes';

    await this.sendEmail({
      to: email,
      subject: 'Your verification code',
      html: wrapper(
        header(
          'Two-Factor Authentication',
          'Enter this code to complete your sign-in or enable 2FA',
        ) +
          body(
            alert(
              'This code expires in 5 minutes. Never share this code with anyone.',
              'warning',
            ) +
              divider() +
              infoBox('Verification Code', code) +
              `<p style="margin: 24px 0 0; font-size: 14px; color: ${c.textMuted}; text-align: center;">
                If you didn\'t request this code, ignore this email and ensure your account is secure.
              </p>`,
          ),
      ),
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    organisationName: string,
  ): Promise<void> {
    const url = `${APP_URL}/dashboard`;

    await this.sendEmail({
      to: email,
      subject: `Welcome to ${organisationName}, ${name}! 🎉`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome!</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F1F5F9; color: #1E293B; line-height: 1.6; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: #0F172A; padding: 48px 32px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; left: -20px; width: 100px; height: 100px; background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); border-radius: 50%; opacity: 0.3; filter: blur(40px);"></div>
              <div style="position: absolute; bottom: -30px; right: -20px; width: 120px; height: 120px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 50%; opacity: 0.3; filter: blur(50px);"></div>
              <div style="position: absolute; top: 30%; right: 10%; width: 60px; height: 60px; background: linear-gradient(135deg, #FBBF24 0%, #F472B6 100%); border-radius: 50%; opacity: 0.2; filter: blur(30px);"></div>
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5;"></div>
              <div style="position: relative; z-index: 1;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); border-radius: 24px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(16, 185, 129, 0.4); transform: rotate(3deg);">
                  <svg width="40" height="40" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h1 style="margin: 0 0 16px; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Welcome, ${name}!</h1>
                <p style="margin: 0; font-size: 17px; color: rgba(255,255,255,0.8); line-height: 1.6;">Your account is ready. You're now part of <span style="font-weight: 700; color: #10B981;">${organisationName}</span></p>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="background: #D1FAE5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #A7F3D0;">
                <p style="margin: 0; font-size: 15px; color: #065F46; font-weight: 600;">✓ Your account is active and ready to use</p>
              </div>
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1E293B;">Here's what you can do next:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                    <span style="display: inline-flex; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; margin-right: 12px; vertical-align: middle; text-align: center;">
                      <svg width="16" height="16" fill="#6366F1" viewBox="0 0 20 20" style="margin-top: 6px;"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Complete your profile</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                    <span style="display: inline-flex; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; margin-right: 12px; vertical-align: middle; text-align: center;">
                      <svg width="16" height="16" fill="#6366F1" viewBox="0 0 20 20" style="margin-top: 6px;"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Explore your dashboard</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                    <span style="display: inline-flex; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; margin-right: 12px; vertical-align: middle; text-align: center;">
                      <svg width="16" height="16" fill="#6366F1" viewBox="0 0 20 20" style="margin-top: 6px;"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Invite team members</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-flex; width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; margin-right: 12px; vertical-align: middle; text-align: center;">
                      <svg width="16" height="16" fill="#6366F1" viewBox="0 0 20 20" style="margin-top: 6px;"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>
                    </span>
                    <span style="font-size: 14px; color: #475569;">Start tracking shipments</span>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">Go to Dashboard →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748B;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #6366F1;">${SUPPORT_EMAIL}</a></p>
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">© ${new Date().getFullYear()} ${organisationName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }

  async sendQuoteStatusEmail(
    email: string,
    quoteId: string,
    originCountry: string,
    destinationCountry: string,
    status: 'quoted' | 'accepted' | 'rejected',
    price?: string,
    remarks?: string,
  ): Promise<void> {
    const shortId = quoteId.slice(0, 8).toUpperCase();
    const priceDisplay = price ? `₹${parseFloat(price).toLocaleString('en-IN')}` : null;
    
    let headerGradient = '';
    let statusEmoji = '';
    let statusLabel = '';
    let headerText = '';
    let headerSubtext = '';
    
    if (status === 'quoted') {
      headerGradient = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
      statusEmoji = '💰';
      statusLabel = 'Price Quoted';
      headerText = 'Quote Price Updated';
      headerSubtext = 'Your quote has been reviewed and is ready';
    } else if (status === 'accepted') {
      headerGradient = 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)';
      statusEmoji = '✅';
      statusLabel = 'Accepted';
      headerText = 'Quote Accepted!';
      headerSubtext = 'Great news! Your quote has been accepted';
    } else {
      headerGradient = 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)';
      statusEmoji = '📋';
      statusLabel = 'Update';
      headerText = 'Quote Update';
      headerSubtext = 'Regarding your quote request';
    }

    const remarksHtml = remarks ? `
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #92400E;">💬 Remarks from our team</p>
        <p style="margin: 0; font-size: 14px; color: #78350F;">${remarks}</p>
      </div>
    ` : '';

    const priceHtml = priceDisplay ? `
      <div style="background: ${status === 'accepted' ? '#D1FAE5' : status === 'rejected' ? '#FEE2E2' : '#EEF2FF'}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid ${status === 'accepted' ? '#A7F3D0' : status === 'rejected' ? '#FECACA' : '#C7D2FE'};">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">${status === 'accepted' ? 'Agreed Price' : status === 'rejected' ? 'Quote Amount' : 'Your Quoted Price'}</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${status === 'accepted' ? '#065F46' : status === 'rejected' ? '#991B1B' : '#4338CA'};">${priceDisplay}</p>
      </div>
    ` : '';

    await this.sendEmail({
      to: email,
      subject: `${statusEmoji} ${headerText}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${headerText}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F1F5F9; color: #1E293B; line-height: 1.6; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: #0F172A; padding: 48px 32px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; left: -20px; width: 100px; height: 100px; background: ${headerGradient}; border-radius: 50%; opacity: 0.3; filter: blur(40px);"></div>
              <div style="position: absolute; bottom: -30px; right: -20px; width: 120px; height: 120px; background: ${headerGradient}; border-radius: 50%; opacity: 0.3; filter: blur(50px);"></div>
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5;"></div>
              <div style="position: relative; z-index: 1;">
                <div style="width: 80px; height: 80px; background: ${headerGradient}; border-radius: 24px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(0,0,0,0.3); font-size: 36px;">${statusEmoji}</div>
                <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">${headerText}</h1>
                <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8);">${headerSubtext}</p>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${priceHtml}
              ${remarksHtml}
              <!-- Quote Details -->
              <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Quote ID</p>
                      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1E293B;">${shortId}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Origin</p>
                      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1E293B;">${originCountry}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Destination</p>
                      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1E293B;">${destinationCountry}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                      <span style="display: inline-block; padding: 4px 12px; background: ${status === 'accepted' ? '#D1FAE5' : status === 'rejected' ? '#FEE2E2' : '#EEF2FF'}; border-radius: 20px; font-size: 13px; font-weight: 600; color: ${status === 'accepted' ? '#065F46' : status === 'rejected' ? '#991B1B' : '#4338CA'};">${statusLabel}</span>
                    </td>
                  </tr>
                </table>
              </div>
              <!-- Message -->
              <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${status === 'quoted' ? 'Thank you for your interest in our logistics services. Our team is ready to assist you with any questions about this quote. This price is valid for a limited time.' : status === 'accepted' ? 'Our logistics team will contact you shortly to coordinate shipment details and scheduling. Please ensure your contact details are up to date.' : 'We encourage you to submit a new quote request with updated details. Our team may reach out with alternative solutions that might better suit your needs.'}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">© ${new Date().getFullYear()} Track Logistics. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }
}
