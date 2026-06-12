import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

interface StatusConfig {
  label: string;
  icon: string;
  bg: string;
  border: string;
  iconBg: string;
}

function getConfig(status: string): StatusConfig {
  switch (status) {
    case 'quoted':
      return {
        label: 'Price Quoted',
        icon: '\u20B9',
        bg: '#eff6ff',
        border: '#bfdbfe',
        iconBg: '#2563eb',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        icon: '\u2713',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        iconBg: '#16a34a',
      };
    case 'rejected':
      return {
        label: 'Declined',
        icon: '\u2717',
        bg: '#fef2f2',
        border: '#fecaca',
        iconBg: '#dc2626',
      };
    default:
      return {
        label: status,
        icon: '\u2022',
        bg: '#f3f4f6',
        border: '#e5e7eb',
        iconBg: '#6b7280',
      };
  }
}

interface QuoteStatusEmailProps {
  quoteId: string;
  originCountry: string;
  destinationCountry: string;
  status: 'quoted' | 'accepted' | 'rejected';
  price?: string;
  remarks?: string;
}

export function QuoteStatusEmail({
  quoteId,
  originCountry,
  destinationCountry,
  status,
  price,
  remarks,
}: QuoteStatusEmailProps) {
  const shortId = quoteId.slice(0, 8).toUpperCase();
  const cfg = getConfig(status);
  const priceDisplay = price
    ? `\u20B9${parseFloat(price).toLocaleString('en-IN')}`
    : null;

  const headerText =
    status === 'quoted'
      ? 'Quote Ready'
      : status === 'accepted'
        ? 'Quote Accepted'
        : 'Quote Update';

  const subtitleText =
    status === 'quoted'
      ? 'Your quote request has been reviewed and a price is ready.'
      : status === 'accepted'
        ? 'Your quote has been accepted. We\u2019ll be in touch shortly.'
        : 'There\u2019s an update regarding your quote request.';

  return (
    <EmailLayout
      preview={`${cfg.label} - ${shortId}`}
      title={headerText}
      subtitle={subtitleText}
    >
      <div style={{ ...statusCard, backgroundColor: cfg.bg, borderColor: cfg.border }}>
        <div style={statusIconWrap}>
          <span style={{ ...statusIcon, backgroundColor: cfg.iconBg }}>
            {cfg.icon}
          </span>
        </div>
        <Text style={statusLabel}>{cfg.label}</Text>
      </div>

      {priceDisplay && (
        <div style={priceCard}>
          <Text style={priceLabel}>Quoted Price</Text>
          <Text style={priceValue}>{priceDisplay}</Text>
          <Text style={priceNote}>
            Valid for 14 days from the date of this quote
          </Text>
        </div>
      )}

      {remarks && (
        <div style={remarksCard}>
          <Text style={remarksTitle}>Remarks</Text>
          <Text style={remarksText}>{remarks}</Text>
        </div>
      )}

      <Hr style={divider} />

      <Text style={sectionTitle}>Quote Details</Text>

      <div style={detailsCard}>
        <table style={detailTable}>
          <tbody>
            {[
              { label: 'Quote ID', value: shortId },
              { label: 'Origin', value: originCountry },
              { label: 'Destination', value: destinationCountry },
            ].map((row) => (
              <tr key={row.label}>
                <td style={detailLabelCell}>{row.label}</td>
                <td style={detailValueCell}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status === 'accepted' && (
        <div style={nextStepsCard}>
          <Text style={nextStepsTitle}>What happens next</Text>
          <Text style={nextStepsText}>
            Our logistics team will contact you within 24 hours to coordinate
            shipment details, scheduling, and documentation requirements.
          </Text>
        </div>
      )}

      {status === 'rejected' && (
        <div style={appealCard}>
          <Text style={appealText}>
            You can submit a new quote request with updated details at any time.
          </Text>
        </div>
      )}
    </EmailLayout>
  );
}

const statusCard = {
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
  border: '1px solid',
  marginBottom: '16px',
};

const statusIconWrap = {
  marginBottom: '10px',
};

const statusIcon = {
  display: 'inline-block',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  textAlign: 'center' as const,
  lineHeight: '36px',
};

const statusLabel = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 700,
  color: '#111827',
};

const priceCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
  marginBottom: '12px',
};

const priceLabel = {
  margin: '0 0 6px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.4px',
};

const priceValue = {
  margin: '0 0 6px',
  fontSize: '28px',
  fontWeight: 700,
  color: '#111827',
  letterSpacing: '-0.5px',
};

const priceNote = {
  margin: 0,
  fontSize: '11px',
  color: '#9ca3af',
  fontStyle: 'italic',
};

const remarksCard = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '14px 16px',
  border: '1px solid #fef3c7',
  marginBottom: '12px',
};

const remarksTitle = {
  margin: '0 0 4px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#92400e',
  fontWeight: 600,
  letterSpacing: '0.3px',
};

const remarksText = {
  margin: 0,
  fontSize: '13px',
  color: '#78350f',
  lineHeight: '1.5',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const sectionTitle = {
  margin: '0 0 10px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const detailsCard = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
};

const detailTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const detailLabelCell = {
  padding: '10px 16px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.3px',
  borderBottom: '1px solid #f3f4f6',
  width: '40%',
};

const detailValueCell = {
  padding: '10px 16px',
  fontSize: '13px',
  color: '#111827',
  fontWeight: 500,
  borderBottom: '1px solid #f3f4f6',
};

const nextStepsCard = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '14px 16px',
  border: '1px solid #bbf7d0',
  marginTop: '16px',
};

const nextStepsTitle = {
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#166534',
};

const nextStepsText = {
  margin: 0,
  fontSize: '12px',
  color: '#15803d',
  lineHeight: '1.5',
};

const appealCard = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '14px 16px',
  border: '1px solid #e5e7eb',
  marginTop: '16px',
  textAlign: 'center' as const,
};

const appealText = {
  margin: 0,
  fontSize: '13px',
  color: '#6b7280',
};
