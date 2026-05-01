# MSG91 Notification Templates Setup Guide

## WhatsApp Templates

### Template: `shipment_created`
```
Hi {{1}}, your order has been created!

Tracking Number: {{2}}
Destination: {{3}}
Carrier: {{6}}

We will notify you when there's an update.
```

### Template: `shipment_in_transit`
```
Hi {{1}}, your order has shipped!

Tracking Number: {{2}}
Destination: {{3}}
Current Status: {{4}}
Location: {{5}}

We will continue to provide updates until delivery.
```

### Template: `shipment_delivered`
```
Hi {{1}}, your order has been delivered!

Tracking Number: {{2}}
Delivered To: {{3}}
Status: {{4}}
Location: {{5}}
Carrier: {{6}}

Thank you for choosing us!
```

### Template: `shipment_exception`
```
Hi {{1}}, there is an issue with your order.

Tracking Number: {{2}}
Location: {{5}}

Please contact support for assistance.
```

### Template: `shipment_cancelled`
```
Hi {{1}}, your order has been cancelled.

Tracking Number: {{2}}

If you have questions, contact support.
```

---

## Variable Mapping

| Placeholder | Value |
|-------------|-------|
| {{1}} | Name |
| {{2}} | Tracking Number |
| {{3}} | Destination |
| {{4}} | Status |
| {{5}} | Location |
| {{6}} | Carrier |

---

## .env Configuration

```bash
MSG91_API_KEY=your-auth-key
MSG91_WHATSAPP_SENDER=9xxxxxxxxx

MSG91_TEMPLATE_SHIPMENT_CREATED=shipment_created
MSG91_TEMPLATE_SHIPMENT_IN_TRANSIT=shipment_in_transit
MSG91_TEMPLATE_SHIPMENT_DELIVERED=shipment_delivered
MSG91_TEMPLATE_SHIPMENT_EXCEPTION=shipment_exception
MSG91_TEMPLATE_SHIPMENT_CANCELLED=shipment_cancelled
```

---

## Data Mapping (for developers)

```json
{
  "recipientName": "{{1}}",
  "whiteLabelCode": "{{2}}",
  "destinationCountry": "{{3}}",
  "status": "{{4}}",
  "location": "{{5}}",
  "carrierCode": "{{6}}"
}
```