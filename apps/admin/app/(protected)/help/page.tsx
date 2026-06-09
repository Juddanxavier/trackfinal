"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { contactFormSchema, type ContactFormData } from "@/lib/validation"
import {
  CircleHelpIcon,
  MailIcon,
  BookOpenIcon,
  SendIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PackageIcon,
  TruckIcon,
  QuoteIcon,
  UserIcon,
  BellIcon,
  SettingsIcon,
  GlobeIcon,
  PhoneIcon,
  MessageCircleIcon,
} from "lucide-react"

const FAQS = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create a new shipment?",
        answer:
          "Go to the Shipments page and click the 'New Shipment' button. Enter the tracking number, select a carrier, and fill in the recipient details. The system will automatically track the package.",
      },
      {
        question: "How do I get a shipping quote?",
        answer:
          "Navigate to Quotes and click 'New Quote'. Enter origin, destination, package weight, and dimensions. Staff will review and provide pricing within 24 hours.",
      },
      {
        question: "How do I invite team members?",
        answer:
          "Only admins can invite users. Go to Users > Invite User, enter the email and name, and select a role. An invitation email will be sent automatically.",
      },
    ],
  },
  {
    category: "Tracking & Delivery",
    questions: [
      {
        question: "How does tracking work?",
        answer:
          "We integrate with 17Track to provide real-time tracking. Enter any tracking number on our platform, and you'll see the latest status, location updates, and estimated delivery time.",
      },
      {
        question: "Why is my shipment not updating?",
        answer:
          "Tracking updates depend on the carrier. If no updates for 48+ hours, try clicking 'Sync' on the shipment page to force a refresh. Some carriers may have limited tracking visibility.",
      },
      {
        question: "Can I change the delivery address?",
        answer:
          "Contact our support immediately if address changes are needed. We can attempt modifications before the package leaves our facility, though changes may incur additional fees.",
      },
      {
        question: "What happens if delivery fails?",
        answer:
          "Failed deliveries are flagged as 'Exception'. Recipients can arrange redelivery or pickup from the carrier's local facility. Check the shipment details for specific carrier instructions.",
      },
    ],
  },
  {
    category: "Billing & Payments",
    questions: [
      {
        question: "How do I pay for shipments?",
        answer:
          "We offer credit terms for approved businesses. Staff can generate invoices, and admins manage payment settings in the organisation profile.",
      },
      {
        question: "Can I get a refund for returned shipments?",
        answer:
          "Refunds depend on the carrier's policy and where the shipment is in the delivery process. Contact support with your shipment ID to review options.",
      },
    ],
  },
  {
    category: "Account & Settings",
    questions: [
      {
        question: "How do I change my password?",
        answer:
          "Go to Profile > Security. Enter your current password and set a new one. For admin accounts, you can also reset other users' passwords.",
      },
      {
        question: "How do notifications work?",
        answer:
          "You receive in-app notifications for shipment updates. Go to Settings > Notifications to configure email, SMS, or WhatsApp alerts.",
      },
      {
        question: "Why can't I see all shipments?",
        answer:
          "Customers see only their own shipments. Staff and admins can view all shipments in their organisation. Use organisation filters to see specific groups.",
      },
    ],
  },
]

const HELP_ARTICLES = [
  {
    icon: PackageIcon,
    title: "Creating Shipments",
    description: "Learn how to create, manage, and track shipments",
    link: "/docs#shipments",
  },
  {
    icon: QuoteIcon,
    title: "Managing Quotes",
    description: "Request and manage shipping quotes",
    link: "/docs#quotes",
  },
  {
    icon: TruckIcon,
    title: "Carrier Information",
    description: "Supported carriers and their coverage",
    link: "/docs#carriers",
  },
  {
    icon: GlobeIcon,
    title: "International Shipping",
    description: " customs requirements and documentation",
    link: "/docs#international",
  },
  {
    icon: BellIcon,
    title: "Notification Settings",
    description: "Configure alerts for shipment updates",
    link: "/docs#notifications",
  },
  {
    icon: UserIcon,
    title: "Team Management",
    description: "Add users, set roles, and manage permissions",
    link: "/docs#users",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const filteredFaqs = FAQS.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0)

  const onSubmit = async (data: ContactFormData) => {
    try {
      await api.post("/notifications", {
        titleKey: "help.contact",
        data,
        userId: undefined,
      })
      setSubmitted(true)
      toast.success("Support request submitted successfully")
      reset({ name: "", email: "", subject: "", message: "" })
    } catch {
      toast.error(
        "Failed to submit support request. Please try again or email us directly."
      )
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          <span className="flex items-center gap-3">
            <CircleHelpIcon className="h-10 w-10 text-primary" />
            Help Center
          </span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Find answers, learn the platform, or contact our support team.
        </p>
      </div>

      <div className="relative">
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 text-lg"
        />
        <CircleHelpIcon className="absolute top-3.5 left-3 h-5 w-5 text-muted-foreground" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {HELP_ARTICLES.map((article, index) => (
          <a key={index} href={article.link} className="block">
            <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <article.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {article.description}
                </CardDescription>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions about our services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={filteredFaqs[0]?.category || "Getting Started"}
            className="w-full"
          >
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-2">
              {filteredFaqs.map((category, idx) => (
                <TabsTrigger
                  key={idx}
                  value={category.category}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>
            {filteredFaqs.map((category, catIdx) => (
              <TabsContent
                key={catIdx}
                value={category.category}
                className="mt-6 space-y-4"
              >
                {category.questions.map((faq, index) => (
                  <details
                    key={index}
                    className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <summary className="flex list-none items-center justify-between font-medium">
                      {faq.question}
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5" />
              Live Chat
            </CardTitle>
            <CardDescription>
              Chat with our support team in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Start Live Chat
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Available Mon-Fri 9AM-6PM IST
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5" />
              Phone Support
            </CardTitle>
            <CardDescription>
              Speak directly with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Call +91 98765 43210
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Mon-Sat 9AM-8PM IST
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for? Send us a message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Request Submitted</h3>
                <p className="text-muted-foreground">
                  We&apos;ll get back to you within 4 hours during business
                  hours.
                </p>
              </div>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="How do I..."
                  {...register("subject")}
                />
                {errors.subject && (
                  <p className="text-sm text-red-500">
                    {errors.subject.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your question or issue..."
                  {...register("message")}
                  className="min-h-32"
                />
                {errors.message && (
                  <p className="text-sm text-red-500">
                    {errors.message.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <a
          href="mailto:support@gajantraders.com"
          className="flex items-center gap-2 transition-colors hover:text-primary"
        >
          <MailIcon className="h-4 w-4" />
          support@gajantraders.com
        </a>
        <span className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4" />
          +91 98765 43210
        </span>
        <span className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Mon-Sat 9AM-8PM IST
        </span>
      </div>
    </div>
  )
}
