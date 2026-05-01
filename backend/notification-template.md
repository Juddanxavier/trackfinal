# MSG91 Notification Templates Setup Guide

## Overview
This system sends shipment notifications via MSG91 WhatsApp and Email templates.

## Architecture Flow
```
Shipment Status Change
        ↓
Check .env (NOTIFY_ON_*)
        ↓
Check User Preferences
        ↓
Queue to BullMQ
        ↓
MSG91 API (WhatsApp / Email)
```

## WhatsApp Templates

### Variables (Placeholders)
| Body | Variable | Example |
|------|----------|---------|
| {{1}} | body_1 | John Doe |
| {{2}} | body_2 | TRACK123 |
| {{3}} | body_3 | United States |
| {{4}} | body_4 | Delivered |
| {{5}} | body_5 | New York |
| {{6}} | body_6 | DHL |

### Template Setup in MSG91 Dashboard

1. Login to [MSG91 Dashboard](https://control.msg91.com)
2. Go to **WhatsApp** → **Templates**
3. Create new template with these parameters:

#### Template: `shipment_delivered`
```
Name: shipment_delivered
Category: TRANSACTIONAL
Language: English

Body:
Hello {{1}},

Your shipment {{2}} has been delivered to {{3}}.

Status: {{4}}
Location: {{5}}
Carrier: {{6}}

Track your package: {{2}}

- GT Express Team
```

#### Template: `shipment_in_transit`
```
Name: shipment_in_transit
Category: TRANSACTIONAL
Language: English

Body:
Hello {{1}},

Your shipment {{2}} is now on the way to {{3}}.

Current Status: {{4}}
Location: {{5}}
Carrier: {{6}}

Track your package: {{2}}

- GT Express Team
```

#### Template: `shipment_created`
```
Name: shipment_created
Category: TRANSACTIONAL
Language: English

Body:
Hello {{1}},

Your shipment {{2}} has been created.

Destination: {{3}}
Carrier: {{6}}

Track your package: {{2}}

- GT Express Team
```

#### Template: `shipment_exception`
```
Name: shipment_exception
Category: TRANSACTIONAL
Language: English

Body:
Hello {{1}},

There's an issue with your shipment {{2}}.

Location: {{5}}
Carrier: {{6}}

Please contact support for details.

- GT Express Team
```

#### Template: `shipment_cancelled`
```
Name: shipment_cancelled
Category: TRANSACTIONAL
Language: English

Body:
Hello {{1}},

Your shipment {{2}} has been cancelled.

If you have questions, contact support.

- GT Express Team
```

## Email Templates

### Variables
| Variable | Example |
|----------|---------|
| {{name}} | John Doe |
| {{trackingNumber}} | TRACK123 |
| {{whiteLabelCode}} | TRACK123 |
| {{destination}} | United States |
| {{status}} | Delivered |
| {{statusRaw}} | delivered |
| {{carrierCode}} | dhl |
| {{carrierName}} | DHL |
| {{location}} | New York |
| {{deliveredAt}} | 05/15/2026 |
| {{estimatedDelivery}} | 05/20/2026 |
| {{origin}} | China |

### Template Setup in MSG91 Dashboard

1. Login to [MSG91 Dashboard](https://control.msg91.com)
2. Go to **Email** → **Templates** (or **Sequences**)
3. Create new template

#### Template ID Format
Your template ID from MSG91 dashboard, e.g., `shipment_delivered_001`

## .env Configuration

```bash
# MSG91 API Configuration
MSG91_API_KEY=your-msg91-auth-key
MSG91_WHATSAPP_SENDER=919876543210

# WhatsApp Template Names (from MSG91 dashboard)
MSG91_TEMPLATE_SHIPMENT_CREATED=shipment_created
MSG91_TEMPLATE_SHIPMENT_IN_TRANSIT=shipment_in_transit
MSG91_TEMPLATE_SHIPMENT_DELIVERED=shipment_delivered
MSG91_TEMPLATE_SHIPMENT_EXCEPTION=shipment_exception
MSG91_TEMPLATE_SHIPMENT_CANCELLED=shipment_cancelled

# Email Template IDs (from MSG91 dashboard)
MSG91_EMAIL_TEMPLATE_CREATED=your_created_template_id
MSG91_EMAIL_TEMPLATE_IN_TRANSIT=your_intransit_template_id
MSG91_EMAIL_TEMPLATE_DELIVERED=your_delivered_template_id
MSG91_EMAIL_TEMPLATE_EXCEPTION=your_exception_template_id
MSG91_EMAIL_TEMPLATE_CANCELLED=your_cancelled_template_id

# Notification Status Controls
NOTIFY_ON_IN_TRANSIT=true
NOTIFY_ON_DELIVERED=true
NOTIFY_ON_CANCELLED=false
NOTIFY_ON_EXCEPTION=false
```

## Status Trigger Controls

Control which statuses trigger notifications via `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| NOTIFY_ON_IN_TRANSIT | Notify when shipment is in transit | true |
| NOTIFY_ON_DELIVERED | Notify when delivered | true |
| NOTIFY_ON_CANCELLED | Notify when cancelled | false |
| NOTIFY_ON_EXCEPTION | Notify on exception | false |

## Data Mapping

When shipment status changes, this data is sent:

```json
{
  "recipientName": "John Doe",
  "trackingNumber": "TRACK123",
  "whiteLabelCode": "TRACK123",
  "destinationCountry": "United States",
  "status": "delivered",
  "location": "New York",
  "carrierCode": "dhl",
  "originCountry": "China"
}
```

Maps to WhatsApp variables:
- `{1}` = recipientName (John Doe)
- `{2}` = whiteLabelCode (TRACK123)
- `{3}` = destinationCountry (United States)
- `{4}` = status (Delivered)
- `{5}` = location (New York)
- `{6}` = carrierCode (DHL)

## Testing

### Test Endpoint
```bash
curl "http://localhost:4000/api/test-notifications/send?status=delivered&phone=919876543210"
```

Expected backend console output:
```
Processing whatsapp for 919876543210
WhatsApp sent: 919876543210
```

Or on failure:
```
WhatsApp failed: Invalid authkey
```

## Troubleshooting

### "No template: shipment_delivered"
- Check `.env` has `MSG91_TEMPLATE_SHIPMENT_DELIVERED` set
- Template name must match exactly

### "Invalid authkey"
- Check `MSG91_API_KEY` is correct
- Key must be from MSG91 dashboard

### "Template not approved"
- MSG91 may require template approval
- Check template status in MSG91 dashboard

### WhatsApp not receiving
- Verify phone number is registered with WhatsApp
- Check sender number is verified with MSG91