import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

interface WelcomeEmailProps {
  name: string;
  organisationName: string;
}

export function WelcomeEmail({ name, organisationName }: WelcomeEmailProps) {
  const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${APP_URL}/dashboard`;

  return (
    <EmailLayout
      preview={`Welcome to ${organisationName}, ${name}!`}
      title={`Welcome, ${name}!`}
      subtitle={
        <>
          Your account has been activated. You're now part of{' '}
          <strong>{organisationName}</strong> on GT Express.
        </>
      }
      cta={{ text: 'Go to Dashboard', url }}
    >
      <div style={activeCard}>
        <div style={activeDot} />
        <div style={activeContent}>
          <Text style={activeTitle}>Account Active</Text>
          <Text style={activeDesc}>
            You can now access all features available to your organization.
          </Text>
        </div>
      </div>

      <Hr style={divider} />

      <Text style={sectionTitle}>Quick Start Guide</Text>

      <div style={guidesCard}>
        <table style={guideTable}>
          <tbody>
            {[
              { icon: 'P', title: 'Complete your profile', desc: 'Add your details so your team can recognize you' },
              { icon: 'B', title: 'Browse the dashboard', desc: 'Get an overview of shipments, quotes, and activity' },
              { icon: 'T', title: 'Track a shipment', desc: 'Use tracking numbers to monitor deliveries in real time' },
              { icon: 'Q', title: 'Request a quote', desc: 'Get pricing for your shipping needs instantly' },
            ].map((item) => (
              <tr key={item.title}>
                <td style={guideIconCell}>
                  <div style={guideIcon}>
                    <span style={guideIconText}>{item.icon}</span>
                  </div>
                </td>
                <td style={guideContentCell}>
                  <Text style={guideTitle}>{item.title}</Text>
                  <Text style={guideDesc}>{item.desc}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Hr style={divider} />

      <div style={supportBox}>
        <Text style={supportTitle}>Need help getting started?</Text>
        <Text style={supportText}>
          Our support team is here to help you every step of the way.
        </Text>
      </div>
    </EmailLayout>
  );
}

const activeCard = {
  backgroundColor: '#f0fdf4',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #bbf7d0',
  marginBottom: '20px',
};

const activeDot = {
  display: 'inline-block',
  width: '10px',
  height: '10px',
  backgroundColor: '#22c55e',
  borderRadius: '50%',
  verticalAlign: 'middle' as const,
  marginRight: '10px',
};

const activeContent = {
  display: 'inline-block',
  verticalAlign: 'middle' as const,
  width: 'calc(100% - 24px)',
};

const activeTitle = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  color: '#166534',
};

const activeDesc = {
  margin: '2px 0 0',
  fontSize: '12px',
  color: '#15803d',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const guidesCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
};

const guideTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const guideIconCell = {
  width: '40px',
  padding: '12px 4px 12px 16px',
  verticalAlign: 'middle' as const,
  borderBottom: '1px solid #f3f4f6',
};

const guideIcon = {
  width: '26px',
  height: '26px',
  backgroundColor: '#eff6ff',
  borderRadius: '6px',
  textAlign: 'center' as const,
};

const guideIconText = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#2563eb',
  lineHeight: '26px',
};

const guideContentCell = {
  padding: '12px 16px',
  verticalAlign: 'middle' as const,
  borderBottom: '1px solid #f3f4f6',
};

const guideTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#111827',
};

const guideDesc = {
  margin: '1px 0 0',
  fontSize: '12px',
  color: '#9ca3af',
};

const supportBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  border: '1px solid #e5e7eb',
};

const supportTitle = {
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const supportText = {
  margin: 0,
  fontSize: '12px',
  color: '#9ca3af',
};
