'use client'

import { useState, ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BookOpenIcon,
  FileTextIcon,
  UsersIcon,
  TruckIcon,
  FileChartColumnIcon,
  Settings2Icon,
  SearchIcon,
  ArrowRightIcon,
} from "lucide-react"

const DOC_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpenIcon,
    description: "Learn the basics of the platform",
    articles: [
      { id: "overview", title: "Platform Overview" },
      { id: "account", title: "Creating Your Account" },
      { id: "navigation", title: "Navigation Guide" },
    ],
  },
  {
    id: "quotes",
    title: "Quotes",
    icon: FileTextIcon,
    description: "Create and manage shipping quotes",
    articles: [
      { id: "creating-quote", title: "Creating a Quote" },
      { id: "quote-statuses", title: "Quote Statuses" },
      { id: "email-notifications", title: "Email Notifications" },
    ],
  },
  {
    id: "shipments",
    title: "Shipments",
    icon: TruckIcon,
    description: "Track and manage shipments",
    articles: [
      { id: "creating-shipment", title: "Creating Shipments" },
      { id: "tracking-statuses", title: "Tracking Statuses" },
      { id: "carrier-info", title: "Carrier Information" },
    ],
  },
  {
    id: "users",
    title: "Users & Permissions",
    icon: UsersIcon,
    description: "Manage team members and access",
    articles: [
      { id: "user-roles", title: "User Roles" },
      { id: "inviting", title: "Inviting Users" },
      { id: "permissions", title: "Permission Levels" },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: FileChartColumnIcon,
    description: "Generate and analyze reports",
    articles: [
      { id: "report-types", title: "Report Types" },
      { id: "exporting", title: "Exporting Data" },
      { id: "scheduled-reports", title: "Scheduled Reports" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings2Icon,
    description: "Configure your organisation",
    articles: [
      { id: "org-settings", title: "Organisation Settings" },
      { id: "notification-prefs", title: "Notification Preferences" },
      { id: "security", title: "Security Settings" },
    ],
  },
]

const DOC_CONTENT: Record<string, { title: string; category: string; content: string }> = {
  overview: {
    title: "Platform Overview",
    category: "Getting Started",
    content: `Track is a comprehensive shipping management platform designed for logistics businesses. It provides real-time shipment tracking, quote management, and team collaboration tools.

## Key Features

- **Quote Management** - Create and manage shipping quotes with custom pricing
- **Shipment Tracking** - Track packages across multiple carriers in real-time
- **Team Collaboration** - Invite team members with role-based access
- **Notifications** - Receive instant updates on shipment status changes
- **Reports** - Generate analytics and export data

## Getting Help

Visit the Help page to contact support or browse FAQs.`,
  },
  account: {
    title: "Creating Your Account",
    category: "Getting Started",
    content: `Follow these steps to create your account and set up your organisation.

## Registration Steps

1. Visit the login page and click Register
2. Enter your email address and create a password
3. Provide your organisation name
4. Verify your email address
5. Complete your organisation profile

## Password Requirements

Your password must meet these criteria:
- At least 12 characters long
- Include uppercase and lowercase letters
- Include at least one number
- Include at least one special character

## Organisation Setup

After registration, you can add team members, configure settings, and set up notification preferences.`,
  },
  navigation: {
    title: "Navigation Guide",
    category: "Getting Started",
    content: `Learn how to navigate the platform efficiently.

## Main Sections

- **Dashboard** - Overview of your activity and stats
- **Quotes** - Manage shipping quotes
- **Shipments** - Track and manage shipments
- **Users** - Manage team members
- **Settings** - Configure organisation
- **Notifications** - View alerts and updates

## Sidebar Features

- **Organisation Switcher** - Change between organisations
- **Quick Links** - Access frequently used pages
- **Get Help** - Access support`,
  },
  "creating-quote": {
    title: "Creating a Quote",
    category: "Quotes",
    content: `Learn how to create shipping quotes for customers.

## Creating a New Quote

1. Navigate to the Quotes page
2. Click the New Quote button
3. Fill in the required information:
   - Origin address
   - Destination address
   - Package weight
   - Package dimensions
4. Select carrier preferences
5. Submit the quote

## Quote Fields

- **Origin** - Pickup location (required)
- **Destination** - Delivery location (required)
- **Weight** - Package weight in kg (required)
- **Dimensions** - L x W x H in cm (required)
- **Description** - Package contents (optional)
- **Customer** - Associated customer (optional)

## Pricing

- Customers can submit quotes without setting a price
- Staff users can set pricing for quotes
- Prices are visible only to staff and admins`,
  },
  "quote-statuses": {
    title: "Quote Statuses",
    category: "Quotes",
    content: `Understanding the different states of a quote.

## Status Types

- **Pending** - Awaiting staff review
- **Reviewed** - Staff has seen the quote
- **Accepted** - Customer accepted the quote
- **Rejected** - Customer declined
- **Expired** - No response after 7 days
- **Converted** - Shipment created

## Status Transitions

Pending → Reviewed → Accepted/Rejected or Expired

After acceptance, the quote can be converted to a shipment.

## Notifications

Staff receive alerts for new quotes. Customers receive updates on quote status changes.`,
  },
  "email-notifications": {
    title: "Email Notifications",
    category: "Quotes",
    content: `Configure how you receive quote updates via email.

## Email Triggers

- New quote submitted (Staff)
- Quote accepted (Staff)
- Quote rejected (Staff)
- Quote status update (Customer)

## Managing Notifications

1. Go to Settings > Notifications
2. Toggle email notifications on/off
3. Configure notification frequency:
   - Immediate
   - Daily digest
   - Weekly digest

## Troubleshooting

If you're not receiving emails:
- Check your spam folder
- Verify your email address in settings
- Ensure notifications are enabled`,
  },
  "creating-shipment": {
    title: "Creating Shipments",
    category: "Shipments",
    content: `Create shipments from accepted quotes or from scratch.

## From Accepted Quote

1. Go to Quotes page
2. Find the accepted quote
3. Click Convert to Shipment
4. Review and confirm details
5. The shipment is created automatically

## From Scratch

1. Navigate to Shipments
2. Click New Shipment
3. Enter recipient details, package info, carrier
4. Submit the shipment

## Required Information

- Recipient name and address
- Phone number
- Email for tracking updates
- Package weight and dimensions`,
  },
  "tracking-statuses": {
    title: "Tracking Statuses",
    category: "Shipments",
    content: `Understanding shipment tracking states.

## Status Types

- **Label Created** - Shipping label generated
- **Picked Up** - Package collected
- **In Transit** - On the way
- **Out for Delivery** - With delivery driver
- **Delivered** - Received by recipient
- **Exception** - Delivery issue
- **Returned** - Being sent back

## Tracking Updates

Updates come from carrier scanning, webhook integrations, and manual updates.

## Public Tracking

Share the tracking code with customers for them to check status.`,
  },
  "carrier-info": {
    title: "Carrier Information",
    category: "Shipments",
    content: `Details about supported carriers.

## Supported Carriers

- Dicom (Express, Standard)
- USPS (Priority, First Class)
- UPS (Ground, 2-Day, Next Day)
- FedEx (Express, Ground)
- Canada Post (Standard, Express)

## Carrier Selection

When creating a quote or shipment, compare delivery times and pricing across carriers.

## Tracking Integration

All shipments are tracked automatically with real-time status updates.`,
  },
  "user-roles": {
    title: "User Roles",
    category: "Users & Permissions",
    content: `Understanding role-based access control.

## Role Types

- **Admin** - Full organisation access
- **Staff** - Manage quotes, shipments, users
- **Customer** - Own quotes and shipments

## Admin Capabilities

- Manage organisation settings
- Invite and remove users
- Set quote prices
- Delete any record
- View all reports

## Staff Capabilities

- Create and manage quotes
- Create and manage shipments
- View organisation users
- View reports

## Customer Capabilities

- Create own quotes
- View own shipments
- Accept/reject quotes
- Update own profile`,
  },
  inviting: {
    title: "Inviting Users",
    category: "Users & Permissions",
    content: `Add team members to your organisation.

## Invitation Process

1. Go to Users page
2. Click Invite User
3. Enter email and name
4. Select the role
5. Click Send Invitation

The invited user receives an email with instructions.

## Role Assignment

Only admins can invite users. The role is set by the admin, not the invitee.`,
  },
  permissions: {
    title: "Permission Levels",
    category: "Users & Permissions",
    content: `Detailed breakdown of access rights.

## Feature Access

| Feature | Admin | Staff | Customer |
|---------|-------|-------|----------|
| Dashboard | Full | Full | Limited |
| Quotes - Create | Yes | Yes | Yes |
| Quotes - View All | Yes | Yes | No |
| Quotes - Set Price | Yes | Yes | No |
| Shipments - Create | Yes | Yes | Own |
| Shipments - View All | Yes | Yes | Own |
| Users - Invite | Yes | No | No |
| Settings | Full | Limited | Profile |

## Data Isolation

Customers can only see their own data. Staff and admins can see all organisation data.`,
  },
  "report-types": {
    title: "Report Types",
    category: "Reports",
    content: `Available reporting features.

## Report Categories

- **Activity Reports** - Daily/weekly/monthly activity
- **Performance Reports** - Quote acceptance rate, revenue
- **User Reports** - Active users, sign-ups

## Generating Reports

1. Go to Reports page
2. Select report type
3. Choose date range
4. Apply filters
5. Click Generate

## Scheduled Reports

Admins can schedule reports to be emailed daily, weekly, or monthly.`,
  },
  exporting: {
    title: "Exporting Data",
    category: "Reports",
    content: `Export reports and data to external files.

## Export Formats

- **CSV** - For spreadsheets
- **JSON** - For data processing
- **PDF** - For print/share

## Export Process

1. Generate the report
2. Click Export
3. Choose format
4. Download file

## Limits

- Export up to 10,000 records
- Date range limits apply`,
  },
  "scheduled-reports": {
    title: "Scheduled Reports",
    category: "Reports",
    content: `Automate report delivery via email.

## Setting Up Scheduled Reports

1. Go to Reports
2. Click Schedule
3. Configure report type, frequency, recipients
4. Set delivery time
5. Save schedule

## Frequency Options

- Daily - End of each day
- Weekly - Each Monday
- Monthly - 1st of month`,
  },
  "org-settings": {
    title: "Organisation Settings",
    category: "Settings",
    content: `Manage your organisation profile and preferences.

## Basic Information

- Organisation name
- Email address
- Phone number
- Physical address

## Localisation

- Timezone
- Date format
- Currency

## How to Update

1. Go to Settings
2. Click Organisation
3. Edit fields
4. Click Save Changes

Only admins can change organisation name.`,
  },
  "notification-prefs": {
    title: "Notification Preferences",
    category: "Settings",
    content: `Control how you receive notifications.

## Notification Types

- **In-App** - Bell icon notifications
- **Email** - Email alerts

## Configuring Preferences

1. Go to Settings
2. Click Notifications
3. Toggle notification types
4. Set quiet hours (optional)
5. Save preferences

## Event Triggers

Choose which events trigger notifications: new quote received, quote accepted/rejected, shipment status change, new user invited.`,
  },
  security: {
    title: "Security Settings",
    category: "Settings",
    content: `Protect your account and organisation.

## Changing Your Password

1. Go to Settings
2. Click Security
3. Enter current password
4. Enter new password
5. Confirm new password
6. Click Update

## Password Requirements

- 12+ characters
- Mixed case
- Numbers
- Special characters

## Session Management

- View logged-in devices
- Sign out all devices
- Sessions expire after 15 minutes of inactivity`,
  },
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: ReactNode[] = []

  for (const line of lines) {
    if (line.startsWith("# ")) {
      elements.push(<h1 key={line} className="text-3xl font-bold tracking-tight mb-6">{line.slice(2)}</h1>)
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={line} className="text-xl font-semibold tracking-tight mt-8 mb-4">{line.slice(3)}</h2>)
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={line} className="text-lg font-semibold mt-6 mb-2">{line.slice(4)}</h3>)
    } else if (line.startsWith("- ")) {
      elements.push(<li key={line} className="ml-6 list-disc">{line.slice(2)}</li>)
    } else if (/^\d+\. /.test(line)) {
      elements.push(<li key={line} className="ml-6 list-decimal">{line.replace(/^\d+\. /, "")}</li>)
    } else if (line.startsWith("| ") && !line.includes("---")) {
      const cols = line.split("|").filter(c => c.trim())
      if (cols.length > 1) {
        elements.push(
          <tr key={line} className="border-b">
            {cols.map((c, i) => <td key={i} className="px-3 py-2">{c.trim()}</td>)}
          </tr>
        )
      }
    } else if (line.trim()) {
      elements.push(<p key={line} className="leading-7 mb-2 text-muted-foreground">{line}</p>)
    }
  }

  return <div className="prose dark:prose-invert max-w-none">{elements}</div>
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  const allArticles = DOC_SECTIONS.flatMap(section =>
    section.articles.map(article => ({
      ...article,
      sectionTitle: section.title,
      sectionIcon: section.icon,
    }))
  )

  const filteredArticles = searchQuery
    ? allArticles.filter(
        a =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          DOC_CONTENT[a.id]?.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allArticles

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticle(articleId)
    const section = DOC_SECTIONS.find(s => s.articles.some(a => a.id === articleId))
    setSelectedSection(section?.id || null)
  }

  const currentContent = selectedArticle ? DOC_CONTENT[selectedArticle] : null

  if (currentContent) {
    return (
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Back to all docs
          </button>
          <div className="mb-2 text-sm text-muted-foreground">{currentContent.category}</div>
          <MarkdownContent content={currentContent.content} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="flex items-center gap-3">
              <BookOpenIcon className="h-10 w-10" />
              Documentation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse guides and tutorials for all platform features.
          </p>
        </div>

        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOC_SECTIONS.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSelectArticle(section.articles[0]?.id || "")}
            >
              <CardHeader className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.articles.length} articles
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">All Articles</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => handleSelectArticle(article.id)}
                className="text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <article.sectionIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{article.sectionTitle}</span>
                </div>
                <p className="font-medium">{article.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}