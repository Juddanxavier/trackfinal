import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface PasswordResetProps {
  token: string;
  email?: string;
}

export function PasswordReset({ token }: PasswordResetProps) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  const expiresDate = new Date(Date.now() + 60 * 60 * 1000);

  return (
    <EmailLayout
      preview="Reset your password"
      title="Reset Your Password"
      subtitle="We received a request to reset your password. Use the button below to create a new one."
      cta={{ text: 'Reset Password', url }}
      footerNote={
        <>
          Or copy this link:{' '}
          <Link href={url} style={{ color: '#9ca3af' }}>
            {url}
          </Link>
        </>
      }
    >
      <div style={alertBox}>
        <div style={alertIconWrap}>
          <span style={alertIcon}>!</span>
        </div>
        <Text style={alertText}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </div>

      <Hr style={divider} />

      <div style={stepsCard}>
        <table style={stepTable}>
          <tbody>
            <tr>
              <td style={stepNumCell}>
                <span style={stepNum}>1</span>
              </td>
              <td style={stepContentCell}>
                <Text style={stepTitle}>Click the reset button</Text>
                <Text style={stepDesc}>
                  Opens the password reset page in your browser
                </Text>
              </td>
            </tr>
            <tr>
              <td
                style={{ ...stepNumCell, borderBottom: 'none' }}
              >
                <span style={stepNum}>2</span>
              </td>
              <td
                style={{ ...stepContentCell, borderBottom: 'none' }}
              >
                <Text style={stepTitle}>Enter a new password</Text>
                <Text style={stepDesc}>
                  Must be at least 8 characters with a mix of letters and
                  numbers
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={expiryBox}>
        <Text style={expiryLabel}>Link expires</Text>
        <Text style={expiryTime}>
          {expiresDate.toLocaleTimeString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </div>

      <div style={securityBox}>
        <Text style={securityText}>
          This link can only be used once for security purposes.
        </Text>
      </div>
    </EmailLayout>
  );
}

const alertBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid #fecaca',
};

const alertIconWrap = {
  width: '28px',
  height: '28px',
  backgroundColor: '#dc2626',
  borderRadius: '50%',
  textAlign: 'center' as const,
  display: 'inline-block',
  verticalAlign: 'middle' as const,
  marginRight: '12px',
};

const alertIcon = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: '28px',
};

const alertText = {
  display: 'inline',
  margin: 0,
  fontSize: '13px',
  color: '#991b1b',
  lineHeight: '1.5',
  verticalAlign: 'middle' as const,
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const stepsCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  marginBottom: '16px',
};

const stepTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const stepNumCell = {
  width: '44px',
  padding: '14px 4px 14px 16px',
  verticalAlign: 'middle' as const,
  borderBottom: '1px solid #f3f4f6',
};

const stepNum = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#dc2626',
  textAlign: 'center' as const,
  lineHeight: '24px',
};

const stepContentCell = {
  padding: '14px 16px',
  verticalAlign: 'middle' as const,
  borderBottom: '1px solid #f3f4f6',
};

const stepTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#111827',
};

const stepDesc = {
  margin: '2px 0 0',
  fontSize: '12px',
  color: '#9ca3af',
};

const expiryBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center' as const,
  border: '1px solid #fecaca',
};

const expiryLabel = {
  margin: '0 0 2px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#991b1b',
  letterSpacing: '0.4px',
};

const expiryTime = {
  margin: 0,
  fontSize: '14px',
  color: '#7f1d1d',
  fontWeight: 600,
};

const securityBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '10px 14px',
  marginTop: '12px',
  border: '1px solid #e5e7eb',
};

const securityText = {
  margin: 0,
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center' as const,
  fontStyle: 'italic',
};
