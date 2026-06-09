import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { render } from '../email/templates/render';
import { VerifyEmail } from '../email/templates/VerifyEmail';
import { PasswordReset } from '../email/templates/PasswordReset';
import { InvitationEmail } from '../email/templates/InvitationEmail';
import { TwoFactorEmail } from '../email/templates/TwoFactorEmail';
import { WelcomeEmail } from '../email/templates/WelcomeEmail';
import { QuoteStatusEmail } from '../email/templates/QuoteStatusEmail';

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
    const smtpHost = process.env.SMTP_HOST?.trim() || 'localhost';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const isLocal = smtpHost === '127.0.0.1' || smtpHost === 'localhost';

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
    };

    if (smtpUser && smtpPass) {
      transportConfig.auth = { user: smtpUser, pass: smtpPass };
    } else if (!isLocal) {
      transportConfig.requireTLS = true;
    }

    this.transporter = nodemailer.createTransport(transportConfig);
    this.fromAddress = process.env.SMTP_FROM || 'noreply@track.com';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const isLocal = smtpHost === '127.0.0.1' || smtpHost === 'localhost';

    if (!smtpHost) {
      this.logger.warn(
        `[EMAIL] SMTP_HOST not set. Skipping email to: ${options.to}`,
      );
      return;
    }

    if (isLocal && !smtpUser && !smtpPass) {
      this.logger.log(`[SMTP] Using local SMTP (Mailhog) for: ${options.to}`);
    } else if (!smtpUser || !smtpPass) {
      this.logger.warn(
        `[EMAIL] SMTP credentials missing. Skipping email to: ${options.to}`,
      );
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
    await this.sendEmail({
      to: email,
      subject: 'Verify your email',
      html: await render(<VerifyEmail token={token} />),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: await render(<PasswordReset token={token} />),
    });
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    inviterName: string,
    organisationName: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `You're invited to join ${organisationName}!`,
      html: await render(
        <InvitationEmail
          token={token}
          email={email}
          inviterName={inviterName}
          organisationName={organisationName}
        />,
      ),
    });
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your verification code',
      html: await render(<TwoFactorEmail code={code} />),
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    organisationName: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Welcome to ${organisationName}, ${name}!`,
      html: await render(
        <WelcomeEmail name={name} organisationName={organisationName} />,
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
    await this.sendEmail({
      to: email,
      subject: `💰 Quote Price Updated`,
      html: await render(
        <QuoteStatusEmail
          quoteId={quoteId}
          originCountry={originCountry}
          destinationCountry={destinationCountry}
          status={status}
          price={price}
          remarks={remarks}
        />,
      ),
    });
  }
}
