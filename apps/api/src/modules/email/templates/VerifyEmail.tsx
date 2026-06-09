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
  const steps = [
    'Click the button to verify your email address',
    'Set up your profile and preferences',
    'Access your personalized dashboard',
    'Start tracking shipments and managing quotes',
  ];

  return (
    <EmailLayout
      preview="Verify your email address"
      title="Verify Your Email"
      subtitle="Thanks for signing up. Please verify your email to activate your account."
      cta={{ text: 'Verify Email', url }}
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
          This verification link expires in 24 hours. If you didn't create an
          account, ignore this email.
        </Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>What happens next</Text>

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
    </EmailLayout>
  );
}

const warning = {
  backgroundColor: '#eef2ff',
  borderLeft: '4px solid #6366f1',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '20px',
};

const warningText = {
  margin: 0,
  fontSize: '13px',
  color: '#1e40af',
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
  backgroundColor: '#eef2ff',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  color: '#6366f1',
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
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: '6px',
  padding: '10px 14px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

const expiryLabel = {
  margin: '0 0 2px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#92400e',
  letterSpacing: '0.5px',
};

const expiryDate = {
  margin: 0,
  fontSize: '13px',
  color: '#92400e',
  fontWeight: 500,
};
