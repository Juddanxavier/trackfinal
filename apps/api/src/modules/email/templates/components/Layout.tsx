import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
} from '@react-email/components';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@gtexpress.com';

interface EmailLayoutProps {
  preview?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  cta?: { text: string; url: string };
  footerNote?: React.ReactNode;
}

export function EmailLayout({
  preview,
  title,
  subtitle,
  children,
  cta,
  footerNote,
}: EmailLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>{preview || title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerOuter}>
            <div style={accent} />
            <div style={logoRow}>
              <div style={logoMark}>
                <span style={logoMarkText}>GT</span>
              </div>
              <span style={logoWordmark}>GT Express</span>
            </div>
          </Section>

          <Section style={card}>
            <div style={cardInner}>
              <h1 style={h1}>{title}</h1>
              {subtitle && <p style={subtitleStyle}>{subtitle}</p>}

              <Section style={bodySection}>{children}</Section>

              {cta && (
                <Section style={ctaSection}>
                  <Button style={ctaButton} href={cta.url}>
                    {cta.text}
                  </Button>
                </Section>
              )}

              {footerNote && <Text style={footerNoteStyle}>{footerNote}</Text>}
            </div>
          </Section>

          <Section style={footer}>
            <Section style={footerDivider}>
              <table style={footerDividerTable}>
                <tbody>
                  <tr>
                    <td style={footerDividerCell} />
                  </tr>
                </tbody>
              </table>
            </Section>
            <Text style={footerSupport}>
              Need help?{' '}
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>
                {SUPPORT_EMAIL}
              </Link>
            </Text>
            <Text style={footerCopyright}>
              &copy; {year} GT Express. All rights reserved.
            </Text>
            <Text style={footerDisclaimer}>
              This is an automated message from GT Express. Please do not reply
              directly to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#eef1f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 16px',
};

const headerOuter = {
  marginBottom: '0',
};

const accent = {
  height: '6px',
  backgroundColor: '#2563eb',
  borderRadius: '3px 3px 0 0',
};

const logoRow = {
  backgroundColor: '#ffffff',
  padding: '28px 36px 0',
  textAlign: 'left' as const,
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
};

const logoMark = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const,
  marginRight: '10px',
};

const logoMarkText = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: '32px',
};

const logoWordmark = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#111827',
  letterSpacing: '-0.3px',
  verticalAlign: 'middle' as const,
  lineHeight: '32px',
};

const card = {
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
  borderBottom: '1px solid #e5e7eb',
  borderRadius: '0 0 12px 12px',
};

const cardInner = {
  padding: '28px 36px 32px',
};

const h1 = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 700,
  color: '#111827',
  letterSpacing: '-0.3px',
  lineHeight: '1.3',
};

const subtitleStyle = {
  margin: '10px 0 0',
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: 400,
  lineHeight: '1.6',
};

const bodySection = {
  padding: '0',
  marginTop: '20px',
};

const ctaSection = {
  textAlign: 'center' as const,
  padding: '24px 0 0',
};

const ctaButton = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '14px 36px',
  borderRadius: '8px',
  display: 'inline-block',
  backgroundColor: '#2563eb',
  letterSpacing: '0.2px',
};

const footerNoteStyle = {
  margin: '16px 0 0',
  padding: 0,
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  lineHeight: '1.5',
  wordBreak: 'break-all' as const,
};

const footer = {
  padding: '20px 0 0',
  textAlign: 'center' as const,
};

const footerDivider = {
  padding: '0 0 16px',
};

const footerDividerTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const footerDividerCell = {
  height: '1px',
  backgroundColor: '#e5e7eb',
};

const footerSupport = {
  margin: '0 0 4px',
  fontSize: '13px',
  color: '#9ca3af',
};

const footerLink = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
};

const footerCopyright = {
  margin: '0 0 4px',
  fontSize: '12px',
  color: '#d1d5db',
};

const footerDisclaimer = {
  margin: '0',
  fontSize: '11px',
  color: '#d1d5db',
  fontStyle: 'italic',
};
