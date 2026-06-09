import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

interface StatusConfig {
  accentColor: string;
  statusLabel: string;
  headerText: string;
  headerSubtext: string;
  priceBoxBg: string;
  priceBoxBorder: string;
  priceBoxColor: string;
  priceBoxLabel: string;
  badge: { bg: string; color: string };
  description: string;
}

function getStatusConfig(
  status: 'quoted' | 'accepted' | 'rejected',
): StatusConfig {
  switch (status) {
    case 'quoted':
      return {
        accentColor: '#6366f1',
        statusLabel: 'Price Quoted',
        headerText: 'Quote Price Updated',
        headerSubtext: 'Your quote has been reviewed and is ready',
        priceBoxBg: '#eef2ff',
        priceBoxBorder: '#c7d2fe',
        priceBoxColor: '#4338ca',
        priceBoxLabel: 'Your Quoted Price',
        badge: { bg: '#eef2ff', color: '#4338ca' },
        description:
          'Thank you for your interest in our logistics services. Our team is ready to assist you with any questions about this quote. This price is valid for a limited time.',
      };
    case 'accepted':
      return {
        accentColor: '#10b981',
        statusLabel: 'Accepted',
        headerText: 'Quote Accepted',
        headerSubtext: 'Great news. Your quote has been accepted',
        priceBoxBg: '#d1fae5',
        priceBoxBorder: '#a7f3d0',
        priceBoxColor: '#065f46',
        priceBoxLabel: 'Agreed Price',
        badge: { bg: '#d1fae5', color: '#065f46' },
        description:
          'Our logistics team will contact you shortly to coordinate shipment details and scheduling. Please ensure your contact details are up to date.',
      };
    case 'rejected':
      return {
        accentColor: '#ef4444',
        statusLabel: 'Update',
        headerText: 'Quote Update',
        headerSubtext: 'Regarding your quote request',
        priceBoxBg: '#fee2e2',
        priceBoxBorder: '#fecaca',
        priceBoxColor: '#991b1b',
        priceBoxLabel: 'Quote Amount',
        badge: { bg: '#fee2e2', color: '#991b1b' },
        description:
          'We encourage you to submit a new quote request with updated details. Our team may reach out with alternative solutions that might better suit your needs.',
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
  const priceDisplay = price
    ? `₹${parseFloat(price).toLocaleString('en-IN')}`
    : null;
  const cfg = getStatusConfig(status);
  const details = [
    { label: 'Quote ID', value: shortId },
    { label: 'Origin', value: originCountry },
    { label: 'Destination', value: destinationCountry },
  ];

  return (
    <EmailLayout
      preview={cfg.headerText}
      title={cfg.headerText}
      subtitle={cfg.headerSubtext}
      accentColor={cfg.accentColor}
    >
      {priceDisplay && (
        <div
          style={{
            ...priceBox,
            backgroundColor: cfg.priceBoxBg,
            borderColor: cfg.priceBoxBorder,
          }}
        >
          <Text style={priceLabel}>{cfg.priceBoxLabel}</Text>
          <Text style={{ ...priceValue, color: cfg.priceBoxColor }}>
            {priceDisplay}
          </Text>
        </div>
      )}

      {remarks && (
        <div style={remarksBox}>
          <Text style={remarksLabel}>Remarks</Text>
          <Text style={remarksText}>{remarks}</Text>
        </div>
      )}

      <div style={detailsCard}>
        {details.map((row) => (
          <div key={row.label} style={detailRow}>
            <Text style={detailLabel}>{row.label}</Text>
            <Text style={detailValue}>{row.value}</Text>
          </div>
        ))}
        <div style={detailRow}>
          <Text style={detailLabel}>Status</Text>
          <span
            style={{
              ...statusBadge,
              backgroundColor: cfg.badge.bg,
              color: cfg.badge.color,
            }}
          >
            {cfg.statusLabel}
          </span>
        </div>
      </div>

      <Text style={description}>{cfg.description}</Text>
    </EmailLayout>
  );
}

const priceBox = {
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '20px',
  border: '1px solid',
};

const priceLabel = {
  margin: '0 0 4px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: '0.5px',
};

const priceValue = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 700,
};

const remarksBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '6px',
  padding: '10px 14px',
  marginBottom: '20px',
};

const remarksLabel = {
  margin: '0 0 4px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#92400e',
  letterSpacing: '0.5px',
};

const remarksText = {
  margin: 0,
  fontSize: '13px',
  color: '#78350f',
};

const detailsCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid #e2e8f0',
};

const detailRow = {
  padding: '6px 0',
  borderBottom: '1px solid #e2e8f0',
};

const detailLabel = {
  margin: '0 0 2px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: '0.5px',
};

const detailValue = {
  margin: 0,
  fontSize: '14px',
  color: '#1e293b',
};

const statusBadge = {
  display: 'inline-block' as const,
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
};

const description = {
  margin: 0,
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.5',
};
