import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const APP_NAME = process.env.APP_NAME || 'GT Express';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@gtexpress.com';

const c = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  success: '#059669',
  successLight: '#d1fae5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${APP_NAME}</title>
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
        <tr><td style="text-align: center; padding-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%); color: #fff; padding: 12px 28px; border-radius: 8px; font-size: 20px; font-weight: 700;">${APP_NAME}</span>
        </td></tr>
        <tr><td style="background: ${c.surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid ${c.border};">
          ${content}
        </td></tr>
        <tr><td class="footer" style="text-align: center; padding: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: ${c.textMuted};">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${c.primary}; text-decoration: none;">${SUPPORT_EMAIL}</a></p>
          <p style="margin: 0; font-size: 12px; color: ${c.textMuted};">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
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

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    this.fromAddress =
      process.env.SMTP_FROM || process.env.SMTP_USER || APP_NAME;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Email:', options.subject, 'to', options.to);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `${this.fromAddress} <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log('Email sent:', options.subject, 'to', options.to);
    } catch (error) {
      console.error('Email send failed:', error);
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
      subject: `Verify your email - ${APP_NAME}`,
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
      subject: `Reset Your Password - ${APP_NAME}`,
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
      subject: `You're invited to join ${organisationName}`,
      html: wrapper(
        header(
          "You're Invited!",
          `${inviterName} invited you to join ${organisationName} on ${APP_NAME}.`,
        ) +
          body(
            `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td width="33%" style="padding-right: 10px;">
                <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 14px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Organisation</p>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${organisationName}</p>
                </div>
              </td>
              <td width="33%" style="padding-right: 10px;">
                <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 14px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Invited By</p>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${inviterName}</p>
                </div>
              </td>
              <td width="34%">
                <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 14px; text-align: center;">
                  <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Expires</p>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${expiry}</p>
                </div>
              </td>
            </tr>
          </table>` +
              divider() +
              `<h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: ${c.text};">What you\'ll get access to:</h3>` +
              bullets([
                'Your personalized dashboard',
                'Shipment tracking and management',
                'Quote requests and order history',
                'Team collaboration tools',
                'Real-time notifications',
              ]) +
              alert(
                'This invitation expires in 7 days. Accept now to secure your account.',
                'info',
              ),
          ) +
          cta('Accept Invitation', url) +
          body(footerLink(url)),
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
      subject: `Welcome to ${APP_NAME}`,
      html: wrapper(
        header(
          `Welcome, ${name}!`,
          "Your account has been created. You're now part of the team!",
        ) +
          body(
            `<h3 style="margin: 0 0 20px; font-size: 15px; font-weight: 600; color: ${c.text}; text-align: center;">Here's what you can do next:</h3>` +
              bullets([
                'Complete your profile and add a photo',
                'Explore your dashboard and customize it',
                'Invite team members to collaborate',
                'Start tracking shipments and managing quotes',
                'Set up notifications for real-time updates',
              ]) +
              divider() +
              `<div style="background: ${c.successLight}; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: ${c.success}; font-weight: 500;">Your account is ready to use!</p>
          </div>`,
          ) +
          cta('Go to Dashboard', url) +
          body(`<p style="margin: 0; font-size: 13px; color: ${c.textMuted}; text-align: center;">
          Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${c.primary};">${SUPPORT_EMAIL}</a>
        </p>`),
      ),
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
    let title = '';
    let subtitle = '';
    let statusColor = '';
    let statusBg = '';
    let contentHtml = '';
    const priceDisplay = price
      ? `₹${parseFloat(price).toLocaleString('en-IN')}`
      : null;
    const remarksHtml = remarks
      ? `<div style="background: ${c.warningLight}; border-left: 4px solid ${c.warning}; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: ${c.warning}; letter-spacing: 0.5px;">Remarks from our team</p>
        <p style="margin: 0; font-size: 14px; color: ${c.text};">${remarks}</p>
      </div>`
      : '';

    if (status === 'quoted') {
      title = 'Quote Price Updated';
      subtitle = 'Your quote has been reviewed and priced';
      statusColor = c.primary;
      statusBg = c.primaryLight;
      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.textMuted};">Dear Customer,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: ${c.text};">Thank you for your interest in our logistics services. We have reviewed your quote request from <strong>${originCountry}</strong> to <strong>${destinationCountry}</strong>.</p>
        ${
          priceDisplay
            ? `<div style="background: ${c.successLight}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: ${c.textMuted}; letter-spacing: 0.5px;">Your Quoted Price</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${c.success};">${priceDisplay}</p>
        </div>`
            : ''
        }
        ${remarksHtml}
        <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right: 10px;">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Quote ID</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${quoteId.slice(0, 8).toUpperCase()}</p>
              </td>
              <td width="50%">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Origin</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${originCountry}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding-right: 10px; padding-top: 12px;">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Destination</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${destinationCountry}</p>
              </td>
              <td width="50%" style="padding-top: 12px;">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Status</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${statusColor};">Price Quoted</p>
              </td>
            </tr>
          </table>
        </div>
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.text};"><strong style="color: ${c.success};">We will be in touch with you soon!</strong> Our team is ready to assist you with any questions about this quote.</p>
        <p style="margin: 0; font-size: 14px; color: ${c.textMuted};">This price is valid for a limited time. Please contact us if you need any clarification.</p>`;
    } else if (status === 'accepted') {
      title = 'Quote Accepted!';
      subtitle = 'Great news! Your quote has been accepted';
      statusColor = c.success;
      statusBg = c.successLight;
      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.textMuted};">Dear Customer,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: ${c.text};">Excellent news! We are pleased to inform you that your quote has been <strong style="color: ${c.success};">accepted</strong>.</p>
        ${
          priceDisplay
            ? `<div style="background: ${c.successLight}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: ${c.textMuted}; letter-spacing: 0.5px;">Agreed Price</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${c.success};">${priceDisplay}</p>
        </div>`
            : ''
        }
        ${remarksHtml}
        <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right: 10px;">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Quote ID</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${quoteId.slice(0, 8).toUpperCase()}</p>
              </td>
              <td width="50%">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Route</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${originCountry} → ${destinationCountry}</p>
              </td>
            </tr>
          </table>
        </div>
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.text};"><strong style="color: ${c.success};">We will be in touch with you soon!</strong> Our logistics team will contact you shortly to coordinate shipment details and scheduling.</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.textMuted};">Please ensure your contact details are up to date so we can reach you easily.</p>`;
    } else if (status === 'rejected') {
      title = 'Quote Update';
      subtitle = 'Unfortunately, your quote could not be accepted';
      statusColor = c.danger;
      statusBg = c.dangerLight;
      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.textMuted};">Dear Customer,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: ${c.text};">Thank you for considering our services. After careful review, we regret to inform you that your quote request has <strong style="color: ${c.danger};">not been accepted</strong> at this time.</p>
        ${remarksHtml}
        <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right: 10px;">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Quote ID</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${quoteId.slice(0, 8).toUpperCase()}</p>
              </td>
              <td width="50%">
                <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: ${c.textMuted};">Route</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${c.text};">${originCountry} → ${destinationCountry}</p>
              </td>
            </tr>
          </table>
        </div>
        <p style="margin: 0 0 16px; font-size: 14px; color: ${c.text};">This could be due to various factors such as routing constraints, capacity limitations, or regulatory requirements.</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: ${c.textMuted};"><strong style="color: ${c.text};">We will be in touch with you soon!</strong> Our team may reach out with alternative solutions that might better suit your needs.</p>
        <p style="margin: 0; font-size: 14px; color: ${c.textMuted};">You are welcome to submit a new quote request at any time with updated details.</p>`;
    }

    await this.sendEmail({
      to: email,
      subject: `${title} - ${APP_NAME}`,
      html: wrapper(header(title, subtitle) + body(contentHtml)),
    });
  }
}
