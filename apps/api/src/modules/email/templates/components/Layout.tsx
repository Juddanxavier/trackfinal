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
  Font,
  Hr,
} from '@react-email/components';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@gtexpress.com';

interface EmailLayoutProps {
  preview?: string;
  title: string;
  subtitle: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
  cta?: { text: string; url: string };
  footerNote?: React.ReactNode;
}

export function EmailLayout({
  preview,
  title,
  subtitle: subtitleText,
  accentColor = '#6366f1',
  children,
  cta,
  footerNote,
}: EmailLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily={
            ['system-ui', '-apple-system', 'sans-serif'] as any
          }
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2',
            format: 'woff2',
          }}
        />
      </Head>
      <Preview>{preview || title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>GT Express</Text>
          </Section>

          <div style={card}>
            <div style={{ ...accentBar, backgroundColor: accentColor }} />

            <h1 style={h1}>{title}</h1>

            <p style={subtitle}>{subtitleText}</p>

            <Section style={bodySection}>{children}</Section>

            {cta && (
              <Section style={ctaSection}>
                <Button
                  style={{ ...ctaButton, backgroundColor: accentColor }}
                  href={cta.url}
                >
                  {cta.text}
                </Button>
              </Section>
            )}

            {footerNote && <Text style={footerNoteStyle}>{footerNote}</Text>}
          </div>

          <Section style={footerSection}>
            <Hr style={footerHr} />
            <Text style={footerText}>
              Need help?{' '}
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>
                {SUPPORT_EMAIL}
              </Link>
            </Text>
            <Text style={copyright}>
              &copy; {year} GT Express. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px 16px',
};

const logoSection = {
  padding: '0 0 20px',
};

const logoText = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#64748b',
  letterSpacing: '-0.2px',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  padding: '0 0 8px',
};

const accentBar = {
  height: '4px',
};

const h1 = {
  margin: '28px 0 0',
  padding: '0 32px',
  fontSize: '22px',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '-0.4px',
  textAlign: 'center' as const,
  lineHeight: '1.3',
};

const subtitle = {
  margin: '6px 0 0',
  padding: '0 32px',
  fontSize: '14px',
  color: '#64748b',
  fontWeight: 400,
  lineHeight: '1.5',
  textAlign: 'center' as const,
};

const bodySection = {
  padding: '24px 32px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  padding: '20px 32px 0',
};

const ctaButton = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '13px 32px',
  borderRadius: '10px',
  display: 'inline-block',
};

const footerNoteStyle = {
  margin: '16px 32px 0',
  padding: '0 0 24px',
  fontSize: '12px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  lineHeight: '1.5',
};

const footerSection = {
  padding: '20px 0 0',
  textAlign: 'center' as const,
};

const footerHr = {
  borderColor: '#e2e8f0',
  margin: '0 0 16px',
};

const footerText = {
  margin: 0,
  fontSize: '12px',
  color: '#94a3b8',
};

const footerLink = {
  color: '#6366f1',
  textDecoration: 'none',
};

const copyright = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: '#cbd5e1',
};
