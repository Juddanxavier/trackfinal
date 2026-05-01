'use client'

import { useState } from "react"
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
import { toast } from "sonner"
import {
  CircleHelpIcon,
  MailIcon,
  BookOpenIcon,
  SendIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "lucide-react"

const FAQS = [
  {
    question: "How do I create a new quote?",
    answer:
      "Go to the Quotes page and click the 'New Quote' button. Fill in the origin, destination, weight, and dimensions. Staff users can set the price after submission.",
  },
  {
    question: "How do I track a shipment?",
    answer:
      "Navigate to Shipments and click on any shipment to view its tracking details. You can also use the public tracking code to share with customers.",
  },
  {
    question: "Can I change my password?",
    answer:
      "Yes, go to Settings > Security to update your password. You'll need to enter your current password and then set a new one.",
  },
  {
    question: "How do I invite new team members?",
    answer:
      "Only admins can invite users. Go to Users > Invite User and enter the email and name. An invitation email will be sent automatically.",
  },
  {
    question: "Why can't I see all shipments?",
    answer:
      "Customers only see their own shipments. Staff and admins can see all shipments in their organisation. Use filters to narrow down results.",
  },
  {
    question: "How do notifications work?",
    answer:
      "You receive in-app notifications for important updates. Go to Settings > Notifications to configure your preferences.",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitted(true)
    setIsSubmitting(false)
    toast.success("Support request submitted successfully")

    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          <span className="flex items-center gap-3">
            <CircleHelpIcon className="h-10 w-10" />
            Get Help
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
        <CircleHelpIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <a href="/docs" className="block">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpenIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Browse detailed guides and tutorials for every feature.
              </CardDescription>
            </CardContent>
          </Card>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions about the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <p className="text-muted-foreground">No matching FAQs found.</p>
          ) : (
            filteredFaqs.map((faq, index) => (
              <details
                key={index}
                className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <summary className="flex list-none items-center justify-between font-medium">
                  {faq.question}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground">{faq.answer}</p>
              </details>
            ))
          )}
        </CardContent>
      </Card>

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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Request Submitted</h3>
                <p className="text-muted-foreground">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSubmitted(false)}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="How do I..."
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your question or issue..."
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="min-h-32"
                  required
                />
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

      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <MailIcon className="h-4 w-4" />
          support@track.com
        </span>
        <span className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Mon-Fri 9AM-5PM
        </span>
      </div>
    </div>
  )
}