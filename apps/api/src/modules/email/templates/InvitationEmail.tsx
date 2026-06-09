import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface InvitationEmailProps {
  token: string;
  email: string;
  inviterName: string;
  organisationName: string;
}

export function InvitationEmail({
  token,
  email,
  inviterName,
  organisationName,
}: InvitationEmailProps) {
  const url = `${APP_URL}/register?token=${token}&email=${encodeURIComponent(email)}`;
  const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const features = [
    'Personalized dashboard',
    'Shipment tracking and management',
    'Quote requests and orders',
    'Real-time notifications',
  ];

  return (
    <EmailLayout
      preview={`You're invited to join ${organisationName}`}
      title="You're Invited"
      subtitle={
        <>
          <span style={{ color: '#f472b6' }}>{inviterName}</span> invited you to
          join <strong>{organisationName}</strong>
        </>
      }
      accentColor="#6366f1"
      cta={{ text: 'Accept Invitation', url }}
      footerNote={
        <>
          Or copy this link:{' '}
          <Link href={url} style={{ color: '#94a3b8' }}>
            {url}
          </Link>
        </>
      }
    >
      <div style={orgBox}>
        <Text style={orgLabel}>Organisation</Text>
        <Text style={orgName}>{organisationName}</Text>
      </div>

      <Hr style={hr} />

      <Text style={sectionTitle}>What you'll get</Text>

      {features.map((item) => (
        <div key={item} style={featureItem}>
          <span style={featureDot} />
          <span style={featureLabel}>{item}</span>
        </div>
      ))}

      <div style={expiryBox}>
        <Text style={expiryText}>
          This invitation expires on{' '}
          {expiresDate.toLocaleDateString('en-US', { dateStyle: 'long' })}
        </Text>
      </div>
    </EmailLayout>
  );
}

const orgBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '14px',
  textAlign: 'center' as const,
  marginBottom: '20px',
  border: '1px solid #e2e8f0',
};

const orgLabel = {
  margin: '0 0 2px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: '0.5px',
};

const orgName = {
  margin: 0,
  fontSize: '14px',
  color: '#1e293b',
  fontWeight: 600,
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

const featureItem = {
  padding: '6px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const featureDot = {
  width: '6px',
  height: '6px',
  backgroundColor: '#6366f1',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const featureLabel = {
  fontSize: '13px',
  color: '#475569',
};

const expiryBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: '6px',
  padding: '10px 14px',
  marginTop: '20px',
};

const expiryText = {
  margin: 0,
  fontSize: '13px',
  color: '#92400e',
};
