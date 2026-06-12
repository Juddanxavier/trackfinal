import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

interface TwoFactorEmailProps {
  code: string;
}

export function TwoFactorEmail({ code }: TwoFactorEmailProps) {
  return (
    <EmailLayout
      preview="Your two-factor authentication code"
      title="Two-Factor Code"
      subtitle="Enter this code to complete your sign-in or verify a sensitive action on your account."
    >
      <div style={codeCard}>
        <Text style={codeLabel}>Verification Code</Text>
        <div style={codeRow}>
          {code.split('').map((digit, i) => (
            <span key={i} style={codeDigit}>
              {digit}
            </span>
          ))}
        </div>
        <Text style={codeExpiry}>Expires in 5 minutes</Text>
      </div>

      <Hr style={divider} />

      <div style={alertCard}>
        <div style={alertDot} />
        <Text style={alertText}>
          If you didn't request this code, someone may be trying to access your
          account. Please secure your account immediately.
        </Text>
      </div>

      <div style={tipCard}>
        <table style={tipTable}>
          <tbody>
            <tr>
              <td style={tipIconCell}>
                <span style={tipIcon}>!</span>
              </td>
              <td style={tipContentCell}>
                <Text style={tipTitle}>Security Tips</Text>
                <Text style={tipDesc}>
                  Never share this code with anyone. GT Express will never ask
                  for your verification code via phone or email.
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </EmailLayout>
  );
}

const codeCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '28px 24px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
  marginBottom: '20px',
};

const codeLabel = {
  margin: '0 0 16px',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.6px',
  fontWeight: 500,
};

const codeRow = {
  marginBottom: '16px',
};

const codeDigit = {
  display: 'inline-block',
  width: '40px',
  height: '48px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '24px',
  fontWeight: 700,
  color: '#2563eb',
  textAlign: 'center' as const,
  lineHeight: '48px',
  margin: '0 3px',
};

const codeExpiry = {
  margin: 0,
  fontSize: '12px',
  color: '#9ca3af',
  fontStyle: 'italic',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const alertCard = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #fecaca',
  marginBottom: '12px',
};

const alertDot = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  backgroundColor: '#dc2626',
  borderRadius: '50%',
  verticalAlign: 'middle' as const,
  marginRight: '8px',
};

const alertText = {
  display: 'inline',
  margin: 0,
  fontSize: '12px',
  color: '#991b1b',
  lineHeight: '1.5',
  verticalAlign: 'middle' as const,
};

const tipCard = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #fef3c7',
};

const tipTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tipIconCell = {
  width: '24px',
  padding: '0',
  verticalAlign: 'top' as const,
};

const tipIcon = {
  display: 'inline-block',
  width: '20px',
  height: '20px',
  backgroundColor: '#f59e0b',
  borderRadius: '50%',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  textAlign: 'center' as const,
  lineHeight: '20px',
};

const tipContentCell = {
  padding: '0 0 0 10px',
  verticalAlign: 'top' as const,
};

const tipTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#92400e',
};

const tipDesc = {
  margin: '4px 0 0',
  fontSize: '12px',
  color: '#a16207',
  lineHeight: '1.4',
};
