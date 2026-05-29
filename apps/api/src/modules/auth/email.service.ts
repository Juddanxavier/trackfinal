import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@gtexpress.com';

function modernEmail(options: {
  headerBg?: string;
  headerIcon?: string;
  title: string;
  subtitle: string;
  body: string;
  cta?: { text: string; url: string };
  footerNote?: string;
  lightHeader?: boolean;
}): string {
  const hBg = options.headerBg || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
  const hIcon = options.headerIcon || '🔔';
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${options.title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; color: #334155; line-height: 1.5; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC;">
    <tr><td align="center" style="padding: 32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background: ${hBg}; padding: 32px 28px; text-align: center;">
          <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 20px;">${hIcon}</div>
          <h1 style="margin: 0 0 6px; font-size: 18px; font-weight: 500; color: #FFFFFF; letter-spacing: -0.3px;">${options.title}</h1>
          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 400;">${options.subtitle}</p>
        </td></tr>
        <tr><td style="padding: 28px;">
          ${options.body}
          ${options.cta ? `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-top: 8px;">
              <a href="${options.cta.url}" style="display: inline-block; background: ${hBg}; color: #FFFFFF; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 28px; border-radius: 8px;">${options.cta.text}</a>
            </td></tr>
          </table>
          ` : ''}
          ${options.footerNote ? `
          <p style="margin: 20px 0 0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.4;">${options.footerNote}</p>
          ` : ''}
        </td></tr>
        <tr><td style="background: #F8FAFC; padding: 20px 28px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94A3B8;"><a href="mailto:${SUPPORT_EMAIL}" style="color: #6366F1; text-decoration: none;">${SUPPORT_EMAIL}</a></p>
          <p style="margin: 0; font-size: 11px; color: #CBD5E1;">&copy; ${year}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

    const bodyContent = `
      <div style="background: #EEF2FF; border-left: 4px solid #6366F1; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">This verification link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
      <div style="height: 1px; background: #E2E8F0; margin: 20px 0;"></div>
      <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">What happens next:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        ${['Click the button to verify your email address', 'Set up your profile and preferences', 'Access your personalized dashboard', 'Start tracking shipments and managing quotes'].map(item => `
        <tr><td style="padding: 6px 0;">
          <span style="display: inline-flex; width: 18px; height: 18px; background: #EEF2FF; border-radius: 50%; margin-right: 10px; vertical-align: middle;">
            <svg width="10" height="10" fill="#6366F1" viewBox="0 0 20 20" style="margin: 4px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
          </span>
          <span style="font-size: 13px; color: #475569;">${item}</span>
        </td></tr>
        `).join('')}
      </table>
      <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 10px 14px; text-align: center;">
        <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; color: #92400E; letter-spacing: 0.5px;">Expires</p>
        <p style="margin: 0; font-size: 13px; color: #92400E;">${expiresDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your email',
      html: modernEmail({
        headerIcon: '✉️',
        title: 'Verify Your Email',
        subtitle: 'Thanks for signing up! Please verify your email to activate your account.',
        body: bodyContent,
        cta: { text: 'Verify Email', url },
        footerNote: `Or copy this link: <a href="${url}" style="color: #6366F1; word-break: break-all;">${url}</a>`,
      }),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${APP_URL}/reset-password?token=${token}`;
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 1);

    const bodyContent = `
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">If you didn't request a reset, ignore this email. Your password stays unchanged.</p>
      </div>
      <div style="height: 1px; background: #E2E8F0; margin: 20px 0;"></div>
      <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">To reset your password:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        ${['Click the button below to open the reset page', 'Enter a new password (minimum 8 characters)', 'Click "Update Password" to save', "You'll be logged in automatically after"].map(item => `
        <tr><td style="padding: 6px 0;">
          <span style="display: inline-flex; width: 18px; height: 18px; background: #FEF3C7; border-radius: 50%; margin-right: 10px; vertical-align: middle;">
            <svg width="10" height="10" fill="#F59E0B" viewBox="0 0 20 20" style="margin: 4px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
          </span>
          <span style="font-size: 13px; color: #475569;">${item}</span>
        </td></tr>
        `).join('')}
      </table>
      <div style="background: #FEE2E2; border: 1px solid #FECACA; border-radius: 6px; padding: 12px; text-align: center;">
        <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; color: #991b1b; letter-spacing: 0.5px;">Expires</p>
        <p style="margin: 0; font-size: 13px; color: #991b1b;">${expiresDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      <div style="background: #FEE2E2; border-left: 4px solid #EF4444; border-radius: 6px; padding: 10px 14px; margin-top: 12px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">This link can only be used once for security.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: modernEmail({
        headerIcon: '🔑',
        title: 'Reset Your Password',
        subtitle: 'We received a request to reset your password. Create a new password to continue.',
        body: bodyContent,
        cta: { text: 'Reset Password', url },
        footerNote: `Or copy this link: <a href="${url}" style="color: #6366F1; word-break: break-all;">${url}</a>`,
      }),
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

    await this.sendEmail({
      to: email,
      subject: `You're invited to join ${organisationName}!`,
      html: modernEmail({
        headerBg: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
        headerIcon: '🎉',
        title: "You're Invited!",
        subtitle: `<span style="color: #F472B6;">${inviterName}</span> invited you to join<br/><span style="font-size: 16px;">${organisationName}</span>`,
        body: `
          <div style="background: #F8FAFC; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 20px; border: 1px solid #E2E8F0;">
            <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Organisation</p>
            <p style="margin: 0; font-size: 14px; color: #1E293B;">${organisationName}</p>
          </div>
          <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">What you'll get:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            ${['Personalized dashboard', 'Shipment tracking & management', 'Quote requests & orders', 'Real-time notifications'].map(item => `
            <tr><td style="padding: 6px 0;">
              <span style="display: inline-flex; width: 18px; height: 18px; background: #EEF2FF; border-radius: 50%; margin-right: 10px; vertical-align: middle;">
                <svg width="10" height="10" fill="#6366F1" viewBox="0 0 20 20" style="margin: 4px;"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
              </span>
              <span style="font-size: 13px; color: #475569;">${item}</span>
            </td></tr>
            `).join('')}
          </table>
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 10px 14px;">
            <p style="margin: 0; font-size: 13px; color: #92400E;">⏰ This invitation expires on ${expiresDate.toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
          </div>
        `,
        cta: { text: 'Accept Invitation', url },
        footerNote: `Or copy this link: <a href="${url}" style="color: #6366F1; word-break: break-all;">${url}</a>`,
      }),
    });
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your verification code',
      html: modernEmail({
        headerIcon: '🔐',
        title: 'Two-Factor Authentication',
        subtitle: 'Enter this code to complete your sign-in or enable 2FA',
        body: `
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">This code expires in 5 minutes. Never share this code with anyone.</p>
          </div>
          <div style="height: 1px; background: #E2E8F0; margin: 20px 0;"></div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Verification Code</p>
            <p style="margin: 0; font-size: 28px; color: #4338CA; letter-spacing: 6px;">${code}</p>
          </div>
          <p style="margin: 20px 0 0; font-size: 13px; color: #94A3B8; text-align: center;">If you didn't request this code, ignore this email and ensure your account is secure.</p>
        `,
      }),
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
      subject: `Welcome to ${organisationName}, ${name}!`,
      html: modernEmail({
        headerBg: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
        headerIcon: '👋',
        title: `Welcome, ${name}!`,
        subtitle: `Your account is ready. You're now part of <span style="color: #10B981;">${organisationName}</span>`,
        body: `
          <div style="background: #D1FAE5; border-radius: 6px; padding: 14px; text-align: center; margin-bottom: 20px; border: 1px solid #A7F3D0;">
            <p style="margin: 0; font-size: 13px; color: #065F46;">✓ Your account is active and ready to use</p>
          </div>
          <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">Here's what you can do next:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            ${[
              { icon: '<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>', label: 'Complete your profile' },
              { icon: '<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>', label: 'Explore your dashboard' },
              { icon: '<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>', label: 'Invite team members' },
              { icon: '<path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>', label: 'Start tracking shipments' },
            ].map(item => `
            <tr><td style="padding: 6px 0;">
              <span style="display: inline-flex; width: 18px; height: 18px; background: #EEF2FF; border-radius: 4px; margin-right: 10px; vertical-align: middle; text-align: center;">
                <svg width="10" height="10" fill="#6366F1" viewBox="0 0 20 20" style="margin: 4px;">${item.icon}</svg>
              </span>
              <span style="font-size: 13px; color: #475569;">${item.label}</span>
            </td></tr>
            `).join('')}
          </table>
        `,
        cta: { text: 'Go to Dashboard', url },
      }),
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
    
    let headerBg = '';
    let headerIcon = '';
    let statusLabel = '';
    let headerText = '';
    let headerSubtext = '';
    
    if (status === 'quoted') {
      headerBg = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
      headerIcon = '💰';
      statusLabel = 'Price Quoted';
      headerText = 'Quote Price Updated';
      headerSubtext = 'Your quote has been reviewed and is ready';
    } else if (status === 'accepted') {
      headerBg = 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)';
      headerIcon = '✅';
      statusLabel = 'Accepted';
      headerText = 'Quote Accepted!';
      headerSubtext = 'Great news! Your quote has been accepted';
    } else {
      headerBg = 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)';
      headerIcon = '📋';
      statusLabel = 'Update';
      headerText = 'Quote Update';
      headerSubtext = 'Regarding your quote request';
    }

    const remarksHtml = remarks ? `
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: #92400E; letter-spacing: 0.5px;">Remarks</p>
        <p style="margin: 0; font-size: 13px; color: #78350F;">${remarks}</p>
      </div>
    ` : '';

    const priceHtml = priceDisplay ? `
      <div style="background: ${status === 'accepted' ? '#D1FAE5' : status === 'rejected' ? '#FEE2E2' : '#EEF2FF'}; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid ${status === 'accepted' ? '#A7F3D0' : status === 'rejected' ? '#FECACA' : '#C7D2FE'};">
        <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">${status === 'accepted' ? 'Agreed Price' : status === 'rejected' ? 'Quote Amount' : 'Your Quoted Price'}</p>
        <p style="margin: 0; font-size: 24px; color: ${status === 'accepted' ? '#065F46' : status === 'rejected' ? '#991B1B' : '#4338CA'};">${priceDisplay}</p>
      </div>
    ` : '';

    const bodyContent = `
      ${priceHtml}
      ${remarksHtml}
      <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #E2E8F0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            { label: 'Quote ID', value: shortId },
            { label: 'Origin', value: originCountry },
            { label: 'Destination', value: destinationCountry },
          ].map(row => `
          <tr><td style="padding: 6px 0; border-bottom: 1px solid #E2E8F0;">
            <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">${row.label}</p>
            <p style="margin: 0; font-size: 14px; color: #1E293B;">${row.value}</p>
          </td></tr>
          `).join('')}
          <tr><td style="padding: 6px 0;">
            <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Status</p>
            <span style="display: inline-block; padding: 2px 10px; background: ${status === 'accepted' ? '#D1FAE5' : status === 'rejected' ? '#FEE2E2' : '#EEF2FF'}; border-radius: 12px; font-size: 12px; color: ${status === 'accepted' ? '#065F46' : status === 'rejected' ? '#991B1B' : '#4338CA'};">${statusLabel}</span>
          </td></tr>
        </table>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
        ${status === 'quoted' ? 'Thank you for your interest in our logistics services. Our team is ready to assist you with any questions about this quote. This price is valid for a limited time.' : status === 'accepted' ? 'Our logistics team will contact you shortly to coordinate shipment details and scheduling. Please ensure your contact details are up to date.' : 'We encourage you to submit a new quote request with updated details. Our team may reach out with alternative solutions that might better suit your needs.'}
      </p>
    `;

    await this.sendEmail({
      to: email,
      subject: `${headerIcon} ${headerText}`,
      html: modernEmail({
        headerBg,
        headerIcon,
        title: headerText,
        subtitle: headerSubtext,
        body: bodyContent,
      }),
    });
  }
}
