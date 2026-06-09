import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const STATUS_CONFIG: Record<
  string,
  { title: string; color: string; description: string }
> = {
  'shipment.created': {
    title: 'Shipment Created',
    color: '#6366f1',
    description: 'Your shipment has been created and is being processed.',
  },
  'shipment.in_transit': {
    title: 'Shipment In Transit',
    color: '#2563eb',
    description: 'Your shipment is now on the move.',
  },
  'shipment.out_for_delivery': {
    title: 'Out For Delivery',
    color: '#d97706',
    description: 'Your shipment is out for delivery today.',
  },
  'shipment.delivered': {
    title: 'Shipment Delivered',
    color: '#059669',
    description: 'Your shipment has been delivered successfully.',
  },
  'shipment.exception': {
    title: 'Delivery Exception',
    color: '#dc2626',
    description: "There's an issue with your shipment that needs attention.",
  },
  'shipment.pending': {
    title: 'Pending',
    color: '#ca8a04',
    description: 'Your shipment is pending further processing.',
  },
  'shipment.customs': {
    title: 'Customs Clearance',
    color: '#7c3aed',
    description: 'Your shipment is going through customs clearance.',
  },
};

interface ShipmentNotificationProps {
  titleKey: string;
  orgName?: string;
  whiteLabelCode?: string;
  destinationCountry?: string;
  trackingUrl?: string;
  location?: string;
  exceptionReason?: string;
  quoteId?: string;
  originCountry?: string;
  weight?: string;
  status?: string;
}

export function ShipmentNotification({
  titleKey,
  orgName,
  whiteLabelCode,
  destinationCountry,
  trackingUrl,
  location,
  exceptionReason,
  quoteId,
  originCountry,
  weight,
  status,
}: ShipmentNotificationProps) {
  const isQuote = titleKey.startsWith('quote.');
  const cfg = isQuote
    ? {
        title:
          titleKey === 'quote.assigned'
            ? 'Quote Assigned'
            : 'Quote Status Updated',
        color: '#6366f1',
        description: '',
      }
    : STATUS_CONFIG[titleKey] || {
        title: 'Update',
        color: '#6366f1',
        description: '',
      };

  return (
    <EmailLayout
      preview={`${cfg.title} - ${orgName}`}
      title={cfg.title}
      subtitle={orgName}
      accentColor={cfg.color}
    >
      {!isQuote && trackingUrl && (
        <div style={trackingBox}>
          <Text style={trackingCode}>{whiteLabelCode || '\u2014'}</Text>
          {trackingUrl && (
            <Link href={trackingUrl} style={trackingLink}>
              Track Shipment
            </Link>
          )}
        </div>
      )}

      {cfg.description && <Text style={description}>{cfg.description}</Text>}

      {!isQuote && (
        <>
          <Hr style={hr} />
          <div style={detailsGrid}>
            {whiteLabelCode && (
              <div style={detailItem}>
                <Text style={detailLabel}>Tracking</Text>
                <Text style={detailValue}>{whiteLabelCode}</Text>
              </div>
            )}
            {destinationCountry && (
              <div style={detailItem}>
                <Text style={detailLabel}>Destination</Text>
                <Text style={detailValue}>{destinationCountry}</Text>
              </div>
            )}
            {location && (
              <div style={detailItem}>
                <Text style={detailLabel}>Location</Text>
                <Text style={detailValue}>{location}</Text>
              </div>
            )}
            {exceptionReason && (
              <div style={detailItem}>
                <Text style={{ ...detailLabel, color: '#dc2626' }}>Reason</Text>
                <Text style={{ ...detailValue, color: '#dc2626' }}>
                  {exceptionReason}
                </Text>
              </div>
            )}
          </div>
        </>
      )}

      {isQuote && (
        <>
          <Hr style={hr} />
          <div style={detailsGrid}>
            {quoteId && (
              <div style={detailItem}>
                <Text style={detailLabel}>Quote ID</Text>
                <Text style={detailValue}>
                  {quoteId.slice(0, 8).toUpperCase()}
                </Text>
              </div>
            )}
            {originCountry && (
              <div style={detailItem}>
                <Text style={detailLabel}>Origin</Text>
                <Text style={detailValue}>{originCountry}</Text>
              </div>
            )}
            {destinationCountry && (
              <div style={detailItem}>
                <Text style={detailLabel}>Destination</Text>
                <Text style={detailValue}>{destinationCountry}</Text>
              </div>
            )}
            {weight && (
              <div style={detailItem}>
                <Text style={detailLabel}>Weight</Text>
                <Text style={detailValue}>{weight} kg</Text>
              </div>
            )}
            {status && (
              <div style={detailItem}>
                <Text style={detailLabel}>Status</Text>
                <span
                  style={{
                    ...pill,
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                  }}
                >
                  {status}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {exceptionReason && (
        <div style={supportBox}>
          <Text style={supportText}>
            Please contact support if you need assistance with this exception.
          </Text>
        </div>
      )}

      {trackingUrl && (
        <div style={ctaLine}>
          <Link href={trackingUrl} style={ctaLink}>
            View Full Details
          </Link>
        </div>
      )}
    </EmailLayout>
  );
}

const trackingBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const trackingCode = {
  margin: '0 0 6px',
  fontSize: '18px',
  fontWeight: 700,
  color: '#1e293b',
  letterSpacing: '1px',
  fontFamily: 'SF Mono, Monaco, monospace',
};

const trackingLink = {
  fontSize: '13px',
  color: '#6366f1',
  textDecoration: 'none',
  fontWeight: 500,
};

const description = {
  margin: '0 0 16px',
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.5',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
};

const detailsGrid = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #e2e8f0',
};

const detailItem = {
  padding: '6px 0',
  borderBottom: '1px solid #e2e8f0',
};

const detailLabel = {
  margin: '0 0 1px',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: '0.5px',
};

const detailValue = {
  margin: 0,
  fontSize: '13px',
  color: '#1e293b',
};

const pill = {
  display: 'inline-block' as const,
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
};

const supportBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  borderRadius: '6px',
  padding: '10px 14px',
  marginTop: '16px',
};

const supportText = {
  margin: 0,
  fontSize: '13px',
  color: '#991b1b',
};

const ctaLine = {
  textAlign: 'center' as const,
  marginTop: '20px',
};

const ctaLink = {
  fontSize: '14px',
  color: '#6366f1',
  textDecoration: 'none',
  fontWeight: 600,
};
