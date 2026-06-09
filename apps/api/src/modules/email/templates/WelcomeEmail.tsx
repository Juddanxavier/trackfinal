import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface WelcomeEmailProps {
  name: string;
  organisationName: string;
}

export function WelcomeEmail({ name, organisationName }: WelcomeEmailProps) {
  const url = `${APP_URL}/dashboard`;
  const items = [
    'Complete your profile',
    'Explore your dashboard',
    'Invite team members',
    'Start tracking shipments',
  ];

  return (
    <EmailLayout
      preview={`Welcome to ${organisationName}, ${name}!`}
      title={`Welcome, ${name}`}
      subtitle={
        <>
          Your account is ready. You're now part of{' '}
          <strong>{organisationName}</strong>
        </>
      }
      accentColor="#10b981"
      cta={{ text: 'Go to Dashboard', url }}
    >
      <div style={activeBadge}>
        <Text style={activeText}>Your account is active and ready to use</Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>Here's what you can do next</Text>

      {items.map((item) => (
        <div key={item} style={checkItem}>
          <span style={checkIcon} />
          <span style={checkLabel}>{item}</span>
        </div>
      ))}
    </EmailLayout>
  );
}

const activeBadge = {
  backgroundColor: '#d1fae5',
  borderRadius: '6px',
  padding: '14px',
  textAlign: 'center' as const,
  marginBottom: '20px',
  border: '1px solid #a7f3d0',
};

const activeText = {
  margin: 0,
  fontSize: '13px',
  color: '#065f46',
  fontWeight: 500,
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

const checkItem = {
  padding: '6px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const checkIcon = {
  width: '6px',
  height: '6px',
  backgroundColor: '#10b981',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const checkLabel = {
  fontSize: '13px',
  color: '#475569',
};
