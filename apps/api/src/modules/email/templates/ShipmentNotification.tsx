import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/Layout';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const exceptions = [
  'shipment.created',
  'shipment.pending',
  'shipment.in_transit',
  'shipment.out_for_delivery',
  'shipment.delivered',
  'shipment.exception',
  'shipment.customs',
];

type TitleKey = (typeof exceptions)[number] | `quote.${string}`;

const SHIPMENT_BADGES: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  'shipment.created': { label: 'Created', bg: '#eff6ff', color: '#2563eb' },
  'shipment.in_transit': { label: 'In Transit', bg: '#fefce8', color: '#ca8a04' },
  'shipment.out_for_delivery': {
    label: 'Out for Delivery',
    bg: '#fefce8',
    color: '#ca8a04',
  },
  'shipment.delivered': { label: 'Delivered', bg: '#f0fdf4', color: '#16a34a' },
  'shipment.exception': { label: 'Exception', bg: '#fef2f2', color: '#dc2626' },
  'shipment.pending': { label: 'Pending', bg: '#f3f4f6', color: '#6b7280' },
  'shipment.customs': { label: 'Customs', bg: '#eff6ff', color: '#2563eb' },
};

interface ShipmentNotificationProps {
  titleKey: TitleKey;
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
  const badge = isQuote
    ? { label: status || 'Updated', bg: '#eff6ff', color: '#2563eb' }
    : SHIPMENT_BADGES[titleKey] || { label: 'Updated', bg: '#eff6ff', color: '#2563eb' };

  const headerText = isQuote
    ? 'Quote Update'
    : titleKey === 'shipment.exception'
      ? 'Delivery Exception'
      : titleKey === 'shipment.delivered'
        ? 'Delivered'
        : titleKey === 'shipment.out_for_delivery'
          ? 'Out for Delivery'
          : titleKey === 'shipment.customs'
            ? 'Customs Clearance'
            : titleKey === 'shipment.in_transit'
              ? 'In Transit'
              : 'Shipment Update';

  return (
    <EmailLayout
      preview={`${headerText} - ${whiteLabelCode || orgName || ''}`}
      title={headerText}
      subtitle={orgName}
    >
      {!isQuote && (
        <div style={trackingCard}>
          <div style={trackingHeader}>
            <div style={trackingBadge}>
              <span style={{ ...trackingBadgeText, color: badge.color, backgroundColor: badge.bg }}>
                {badge.label}
              </span>
            </div>
          </div>
          <div style={trackingCodeRow}>
            <Text style={trackingCodeLabel}>Tracking Number</Text>
            <Text style={trackingCodeValue}>
              {whiteLabelCode || '\u2014'}
            </Text>
          </div>
          {trackingUrl && (
            <Link href={trackingUrl} style={trackingLink}>
              Track this shipment &rarr;
            </Link>
          )}
        </div>
      )}

      <Hr style={divider} />

      <div style={detailsGrid}>
        {!isQuote && (
          <table style={detailTable}>
            <tbody>
              {location && (
                <tr>
                  <td style={detailLabelCell}>Current Location</td>
                  <td style={detailValueCell}>{location}</td>
                </tr>
              )}
              {destinationCountry && (
                <tr>
                  <td style={detailLabelCell}>Destination</td>
                  <td style={detailValueCell}>{destinationCountry}</td>
                </tr>
              )}
              {exceptionReason && (
                <tr>
                  <td style={{ ...detailLabelCell, color: '#dc2626' }}>
                    Reason
                  </td>
                  <td style={{ ...detailValueCell, color: '#dc2626' }}>
                    {exceptionReason}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {isQuote && (
          <table style={detailTable}>
            <tbody>
              {quoteId && (
                <tr>
                  <td style={detailLabelCell}>Quote ID</td>
                  <td style={detailValueCell}>
                    {quoteId.slice(0, 8).toUpperCase()}
                  </td>
                </tr>
              )}
              {originCountry && (
                <tr>
                  <td style={detailLabelCell}>Origin</td>
                  <td style={detailValueCell}>{originCountry}</td>
                </tr>
              )}
              {destinationCountry && (
                <tr>
                  <td style={detailLabelCell}>Destination</td>
                  <td style={detailValueCell}>{destinationCountry}</td>
                </tr>
              )}
              {weight && (
                <tr>
                  <td style={detailLabelCell}>Weight</td>
                  <td style={detailValueCell}>{weight} kg</td>
                </tr>
              )}
              {status && (
                <tr>
                  <td style={detailLabelCell}>Status</td>
                  <td style={detailValueCell}>
                    <span
                      style={{
                        ...statusPill,
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {exceptionReason && (
        <div style={exceptionBox}>
          <Text style={exceptionTitle}>Action Required</Text>
          <Text style={exceptionText}>
            There's an issue with this shipment that needs attention. Please
            contact support for assistance.
          </Text>
        </div>
      )}

      {trackingUrl && (
        <div style={secondaryCta}>
          <Link href={trackingUrl} style={secondaryCtaLink}>
            View Full Details &rarr;
          </Link>
        </div>
      )}
    </EmailLayout>
  );
}

const trackingCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '20px',
  border: '1px solid #e2e8f0',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const trackingHeader = {
  marginBottom: '14px',
};

const trackingBadge = {
  textAlign: 'center' as const,
};

const trackingBadgeText = {
  display: 'inline-block' as const,
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
};

const trackingCodeRow = {
  marginBottom: '14px',
};

const trackingCodeLabel = {
  margin: '0 0 4px',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.4px',
};

const trackingCodeValue = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  color: '#111827',
  letterSpacing: '1.5px',
  fontFamily: 'SF Mono, Monaco, Consolas, monospace',
};

const trackingLink = {
  fontSize: '14px',
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const detailsGrid = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  marginBottom: '16px',
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

const statusPill = {
  display: 'inline-block' as const,
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
};

const exceptionBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '14px 16px',
  border: '1px solid #fecaca',
  marginTop: '12px',
};

const exceptionTitle = {
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#991b1b',
};

const exceptionText = {
  margin: 0,
  fontSize: '12px',
  color: '#7f1d1d',
  lineHeight: '1.5',
};

const secondaryCta = {
  textAlign: 'center' as const,
  marginTop: '16px',
};

const secondaryCtaLink = {
  fontSize: '13px',
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
};
