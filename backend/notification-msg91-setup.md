# MSG91 WhatsApp Templates Setup Guide
## Step-by-Step Setup
### Step 1: Login to MSG91 Dashboard
1. Go to: https://control.msg91.com
2. Login with your credentials
3. Navigate to **WhatsApp** → **Templates**
### Step 2: Create New Template
1. Click **Create Template** button
2. Fill in the details:
   - **Name:** `shipment_delivered` (lowercase with underscores)
   - **Category:** `TRANSACTIONAL`
   - **Language:** `English` (select from dropdown)
3. Copy the template content from below
4. Submit for review/approval
## WhatsApp Templates
### Template 1: `shipment__created`
**Purpose:** Send when a new shipment/order is created
```
Hi {{1}}, your order has been created!
Tracking Number: {{2}}
Destination: {{3}}
Carrier: {{6}}
We will notify you when there's an update.
```
---
### Template 2: `shipment_in_transit`
**Purpose:** Send when shipment is picked up and in transit
```
Hi {{1}}, your order has shipped!
Tracking Number: {{2}}
Destination: {{3}}
Current Status: {{4}}
Location: {{5}}
We will continue to provide updates until delivery.
```
---
### Template 3: `shipment_delivered`
**Purpose:** Send when shipment is delivered
```
Hi {{1}}, your order has been delivered!
Tracking Number: {{2}}
Delivered To: {{3}}
Status: {{4}}
Location: {{5}}
Carrier: {{6}}
Thank you for choosing us!
```
---
### Template 4: `shipment_exception`
**Purpose:** Send when there's an exception/delivery issue
```
Hi {{1}}, there is an issue with your order.
Tracking Number: {{2}}
Location: {{5}}
Please contact support for assistance.
```
---
### Template 5: `shipment_cancelled`
**Purpose:** Send when shipment is cancelled
```
Hi {{1}}, your order has been cancelled.
Tracking Number: {{2}}
If you have questions, contact support.
```
## Variable Mapping
### Where to place each variable
| Placeholder | Variable Name | Maps To | Example Value |
|------------|---------------|---------|--------------|
| {{1}} | Body 1 | recipientName | John Doe |
| {{2}} | Body 2 | whiteLabelCode / trackingNumber | TRACK123 |
| {{3}} | Body 3 | destinationCountry | United States |
| {{4}} | Body 4 | status | Delivered |
| {{5}} | Body 5 | location | New York |
| {{6}} | Body 6 | carrierCode | DHL |
### How to add variables in MSG91 Dashboard
1. In template body, type `{{` to see variable suggestions
2. Select or type the body number:
   - `{{1}}` → Maps to body_1 in API
   - `{{2}}` → Maps to body_2 in API
   - Continue for each variable
## Sample Data Flow
### Example: Shipment Delivered
**Input Data:**
```json
{
  "recipientName": "John Doe",
  "trackingNumber": "TRACK123",
  "whiteLabelCode": "TRACK123",
  "destinationCountry": "United States",
  "status": "Delivered",
  "location": "New York",
  "carrierCode": "DHL"
}
```
**Resulting Message:**
```
Hi John Doe, your order has been delivered!
Tracking Number: TRACK123
Delivered To: United States
Status: Delivered
Location: New York
Carrier: DHL
Thank you for choosing us!
```
---
## .env Configuration (Backend)
Add these to `backend/.env`:
```bash
# MSG91 API Configuration
MSG91_API_KEY=your-msg91-auth-key
MSG91_WHATSAPP_SENDER=9xxxxxxxxx

# WhatsApp Template Names (must match MSG91 dashboard exactly)
MSG91_TEMPLATE_SHIPMENT_CREATED=shipment_created
MSG91_TEMPLATE_SHIPMENT_IN_TRANSIT=shipment_in_transit
MSG91_TEMPLATE_SHIPMENT_DELIVERED=shipment_delivered
MSG91_TEMPLATE_SHIPMENT_EXCEPTION=shipment_exception
MSG91_TEMPLATE_SHIPMENT_CANCELLED=shipment_cancelled
```
### Template Name Rules
- Use lowercase letters only
- Use underscores instead of spaces
- No special characters
- Must match exactly what you named in MSG91 dashboard
## Status Trigger Controls
Control which statuses send notifications:
```bash
NOTIFY_ON_IN_TRANSIT=true
NOTIFY_ON_DELIVERED=true
NOTIFY_ON_CANCELLED=false
NOTIFY_ON_EXCEPTION=false
```
| Setting | Result |
|---------|--------|
| `=true` | Notification is sent |
| `=false` | Notification is NOT sent |
## Troubleshooting
### Error: "No template: shipment_xxx"
**Cause:** Template name in `.env` doesn't match MSG91 dashboard
**Fix:** Check that `MSG91_TEMPLATE_SHIPMENT_XXX` matches exactly
### Error: "Invalid authkey"
**Cause:** Wrong API key
**Fix:** Verify `MSG91_API_KEY` in .env is correct
### Error: "Template not approved"
**Cause:** MSG91 requires template approval
**Fix:** Wait for approval or check MSG91 dashboard for status
### Template Variables Not Showing
**Cause:** Variables not properly formatted
**Fix:** Ensure variables are typed exactly as `{{1}}`, `{{2}}`, etc.
## Testing
### Test the notification flow:
```bash
curl "http://localhost:4000/api/test-notifications/send?status=delivered&phone=9xxxxxxxxxx"
```
Expected backend response:
```json
{
  "result": [
    {"success": true, "channel": "email", "messageId": "queued-xxx"},
    {"success": true, "channel": "whatsapp", "messageId": "queued-xxx"},
    {"success": true, "channel": "in_app", "messageId": "xxx"}
  ]
}
```
## Developer Notes
### Files Involved
- `src/modules/notifications/msg91.service.ts` - MSG91 API integration
- `src/modules/notifications/notification-processor.ts` - BullMQ worker
- `.env` - Configuration
### Flow
1. Shipment status changes → `notificationService.sendToAll()`
2. Channels (email/whatsapp) queue to BullMQ
3. `NotificationProcessor` picks up job
4. Calls `MSG91Service.sendWhatsApp()` or `MSG91Service.sendEmail()`
5. Sends to MSG91 API