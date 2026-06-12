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

  return (
    <EmailLayout
      preview={`You're invited to join ${organisationName}`}
      title="You're Invited!"
      subtitle={
        <>
          <strong>{inviterName}</strong> has invited you to join their
          organization on GT Express.
        </>
      }
      cta={{ text: 'Accept Invitation', url }}
      footerNote={
        <>
          Or copy this link:{' '}
          <Link href={url} style={{ color: '#9ca3af' }}>
            {url}
          </Link>
        </>
      }
    >
      <div style={orgCard}>
        <div style={orgIcon}>
          <span style={orgIconText}>{organisationName.charAt(0)}</span>
        </div>
        <div style={orgInfo}>
          <Text style={orgLabel}>Organization</Text>
          <Text style={orgName}>{organisationName}</Text>
        </div>
      </div>

      <div style={detailsCard}>
        <table style={detailTable}>
          <tbody>
            <tr>
              <td style={detailIconCell}>
                <div style={detailIcon}>
                  <span style={detailIconText}>1</span>
                </div>
              </td>
              <td style={detailContentCell}>
                <Text style={detailTitle}>Click the button above</Text>
                <Text style={detailDesc}>
                  It will redirect you to create your account
                </Text>
              </td>
            </tr>
            <tr>
              <td style={detailIconCell}>
                <div style={detailIcon}>
                  <span style={detailIconText}>2</span>
                </div>
              </td>
              <td style={detailContentCell}>
                <Text style={detailTitle}>Set up your profile</Text>
                <Text style={detailDesc}>
                  Add your details and preferences
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ ...detailIconCell, borderBottom: 'none' }}>
                <div style={detailIcon}>
                  <span style={detailIconText}>3</span>
                </div>
              </td>
              <td style={{ ...detailContentCell, borderBottom: 'none' }}>
                <Text style={detailTitle}>Get started</Text>
                <Text style={detailDesc}>
                  Access shipments, quotes, and more
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={expiryBadge}>
        <Text style={expiryText}>
          Invitation expires{' '}
          {expiresDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </div>
    </EmailLayout>
  );
}

const orgCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0',
};

const orgIcon = {
  display: 'inline-block',
  width: '40px',
  height: '40px',
  backgroundColor: '#2563eb',
  borderRadius: '10px',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const,
  marginRight: '12px',
};

const orgIconText = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: '40px',
};

const orgInfo = {
  display: 'inline-block',
  verticalAlign: 'middle' as const,
};

const orgLabel = {
  margin: 0,
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.4px',
};

const orgName = {
  margin: '2px 0 0',
  fontSize: '15px',
  fontWeight: 600,
  color: '#111827',
};

const detailsCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  marginBottom: '16px',
};

const detailTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const detailIconCell = {
  width: '40px',
  padding: '12px 4px 12px 16px',
  verticalAlign: 'top' as const,
  borderBottom: '1px solid #f3f4f6',
};

const detailIcon = {
  width: '24px',
  height: '24px',
  backgroundColor: '#eff6ff',
  borderRadius: '6px',
  textAlign: 'center' as const,
};

const detailIconText = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#2563eb',
  lineHeight: '24px',
};

const detailContentCell = {
  padding: '12px 16px 12px 0',
  verticalAlign: 'top' as const,
  borderBottom: '1px solid #f3f4f6',
};

const detailTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#111827',
};

const detailDesc = {
  margin: '2px 0 0',
  fontSize: '12px',
  color: '#9ca3af',
};

const expiryBadge = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '10px 14px',
  border: '1px solid #fef3c7',
};

const expiryText = {
  margin: 0,
  fontSize: '12px',
  color: '#92400e',
  textAlign: 'center' as const,
  fontWeight: 500,
};
