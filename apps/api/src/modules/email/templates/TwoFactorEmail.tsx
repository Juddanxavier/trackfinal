import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

interface TwoFactorEmailProps {
  code: string;
}

export function TwoFactorEmail({ code }: TwoFactorEmailProps) {
  return (
    <EmailLayout
      preview="Your verification code"
      title="Two-Factor Authentication"
      subtitle="Enter this code to complete your sign-in or enable two-factor authentication"
    >
      <div style={warning}>
        <Text style={warningText}>
          This code expires in 5 minutes. Never share this code with anyone.
        </Text>
      </div>

      <Hr style={hr} />

      <div style={codeBox}>
        <Text style={codeLabel}>Verification Code</Text>
        <Text style={codeValue}>{code}</Text>
      </div>

      <Text style={note}>
        If you didn't request this code, ignore this email and ensure your
        account is secure.
      </Text>
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

const codeBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
};

const codeLabel = {
  margin: '0 0 8px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: '0.5px',
};

const codeValue = {
  margin: 0,
  fontSize: '32px',
  color: '#4338ca',
  letterSpacing: '8px',
  fontWeight: 700,
  fontFamily: 'SF Mono, Monaco, monospace',
};

const note = {
  margin: '20px 0 0',
  fontSize: '13px',
  color: '#94a3b8',
  textAlign: 'center' as const,
};
