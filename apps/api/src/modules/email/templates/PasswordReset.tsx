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
  const steps = [
    'Click the button below to open the reset page',
    'Enter a new password (minimum 8 characters)',
    'Click "Update Password" to save',
    "You'll be logged in automatically after",
  ];

  return (
    <EmailLayout
      preview="Reset your password"
      title="Reset Your Password"
      subtitle="We received a request to reset your password. Create a new password to continue."
      cta={{ text: 'Reset Password', url }}
      footerNote={
        <>
          Or copy this link:{' '}
          <Link href={url} style={{ color: '#94a3b8' }}>
            {url}
          </Link>
        </>
      }
    >
      <div style={warning}>
        <Text style={warningText}>
          If you didn't request a reset, ignore this email. Your password stays
          unchanged.
        </Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>To reset your password</Text>

      {steps.map((item, i) => (
        <div key={item} style={stepItem}>
          <span style={stepNumber}>{i + 1}</span>
          <span style={stepLabel}>{item}</span>
        </div>
      ))}

      <div style={expiryBox}>
        <Text style={expiryLabel}>Expires</Text>
        <Text style={expiryDate}>
          {expiresDate.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </Text>
      </div>

      <div style={singleUseBox}>
        <Text style={singleUseText}>
          This link can only be used once for security.
        </Text>
      </div>
    </EmailLayout>
  );
}

const warning = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '20px',
};

const warningText = {
  margin: 0,
  fontSize: '13px',
  color: '#92400e',
  lineHeight: '1.4',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: '14px',
  color: '#475569',
  fontWeight: 500,
};

const stepItem = {
  padding: '6px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const stepNumber = {
  width: '20px',
  height: '20px',
  backgroundColor: '#fef3c7',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  color: '#f59e0b',
  fontWeight: 600,
  flexShrink: 0,
  textAlign: 'center' as const,
  lineHeight: '20px',
};

const stepLabel = {
  fontSize: '13px',
  color: '#475569',
};

const expiryBox = {
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

const expiryLabel = {
  margin: '0 0 2px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#991b1b',
  letterSpacing: '0.5px',
};

const expiryDate = {
  margin: 0,
  fontSize: '13px',
  color: '#991b1b',
  fontWeight: 500,
};

const singleUseBox = {
  backgroundColor: '#fee2e2',
  borderLeft: '4px solid #ef4444',
  borderRadius: '6px',
  padding: '10px 14px',
  marginTop: '12px',
};

const singleUseText = {
  margin: 0,
  fontSize: '13px',
  color: '#991b1b',
};
