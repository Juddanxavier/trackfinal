import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface VerifyEmailProps {
  token: string;
  email?: string;
}

export function VerifyEmail({ token }: VerifyEmailProps) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  const expiresDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <EmailLayout
      preview="Verify your email address"
      title="Verify Your Email"
      subtitle="Please confirm your email address to activate your account and get started."
      cta={{ text: 'Verify Email', url }}
      footerNote={
        <>
          Or copy this link:{' '}
          <Link href={url} style={{ color: '#9ca3af' }}>
            {url}
          </Link>
        </>
      }
    >
      <div style={stepsCard}>
        <table style={stepTable}>
          <tbody>
            <tr>
              <td style={stepIconCell}>
                <div style={stepIconActive}>
                  <span style={stepIconText}>1</span>
                </div>
              </td>
              <td style={stepContentCell}>
                <Text style={stepTitleActive}>Verify your email</Text>
                <Text style={stepDescActive}>
                  Click the button to confirm your address
                </Text>
              </td>
            </tr>
            <tr>
              <td style={stepLineCell}>
                <div style={stepLine} />
              </td>
              <td style={stepContentCell}>
                <Text style={stepTitle}>Set up your profile</Text>
                <Text style={stepDesc}>Add your name and preferences</Text>
              </td>
            </tr>
            <tr>
              <td style={stepIconCell}>
                <div style={stepIcon}>
                  <span style={stepIconText}>3</span>
                </div>
              </td>
              <td style={stepContentCell}>
                <Text style={stepTitle}>Access dashboard</Text>
                <Text style={stepDesc}>
                  Start managing shipments and quotes
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Hr style={divider} />

      <div style={infoBox}>
        <Text style={infoLabel}>Why verify?</Text>
        <Text style={infoText}>
          Email verification helps keep your account secure and ensures you
          receive important notifications about your shipments and account
          activity.
        </Text>
      </div>

      <div style={expiryBox}>
        <Text style={expiryText}>
          This link expires{' '}
          {expiresDate.toLocaleTimeString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </div>
    </EmailLayout>
  );
}

const stepsCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  marginBottom: '20px',
};

const stepTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const stepIconCell = {
  width: '40px',
  padding: '14px 4px 14px 16px',
  verticalAlign: 'middle' as const,
  borderBottom: 'none',
};

const stepIconActive = {
  width: '26px',
  height: '26px',
  backgroundColor: '#2563eb',
  borderRadius: '7px',
  textAlign: 'center' as const,
};

const stepIcon = {
  width: '26px',
  height: '26px',
  backgroundColor: '#f3f4f6',
  borderRadius: '7px',
  textAlign: 'center' as const,
};

const stepIconText = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: '26px',
};

const stepContentCell = {
  padding: '14px 16px',
  verticalAlign: 'middle' as const,
};

const stepTitleActive = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#2563eb',
};

const stepDescActive = {
  margin: '2px 0 0',
  fontSize: '12px',
  color: '#6b7280',
};

const stepLineCell = {
  width: '40px',
  padding: '0 4px 0 16px',
  verticalAlign: 'middle' as const,
  textAlign: 'center' as const,
};

const stepLine = {
  width: '2px',
  height: '24px',
  backgroundColor: '#e5e7eb',
  margin: '0 auto',
};

const stepTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#9ca3af',
};

const stepDesc = {
  margin: '2px 0 0',
  fontSize: '12px',
  color: '#d1d5db',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '14px 16px',
  border: '1px solid #bfdbfe',
};

const infoLabel = {
  margin: '0 0 4px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#1e40af',
  fontWeight: 600,
  letterSpacing: '0.3px',
};

const infoText = {
  margin: 0,
  fontSize: '13px',
  color: '#1e3a5f',
  lineHeight: '1.5',
};

const expiryBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '10px 14px',
  marginTop: '12px',
  border: '1px solid #fef3c7',
};

const expiryText = {
  margin: 0,
  fontSize: '12px',
  color: '#92400e',
  textAlign: 'center' as const,
  fontWeight: 500,
};
