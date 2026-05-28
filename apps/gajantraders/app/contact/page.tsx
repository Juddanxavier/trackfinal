'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Clock, ArrowRight, Send,
  ChevronRight, HeadphonesIcon, MessageSquare, Building2,
  Globe, CheckCircle, Loader2, ArrowUpRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true },
};

const offices = [
  {
    icon: Building2,
    city: 'Mumbai (HQ)',
    address: '7, Gajan Traders House, P D Mello Road, Near Masjid Bunder, Mumbai 400009, Maharashtra, India',
    phone: '+91 22 2344 5678',
    email: 'mumbai@gajantraders.com',
    hours: 'Mon-Sat: 9:30 AM - 6:30 PM',
  },
  {
    icon: Building2,
    city: 'Delhi NCR',
    address: '42, Logistics Hub, Sector 12, Dwarka, New Delhi 110078, India',
    phone: '+91 11 4567 8901',
    email: 'delhi@gajantraders.com',
    hours: 'Mon-Sat: 9:30 AM - 6:30 PM',
  },
  {
    icon: Globe,
    city: 'Dubai (Intl.)',
    address: 'Office 1204, Business Bay Tower, Sheikh Zayed Road, Dubai, UAE',
    phone: '+971 4 567 8901',
    email: 'dubai@gajantraders.com',
    hours: 'Sun-Thu: 9:00 AM - 6:00 PM',
  },
];

const faqs = [
  {
    q: 'How long does international shipping take?',
    a: 'Standard shipping takes 5-10 business days, express 2-3 days, and priority delivers within 24 hours depending on the destination.',
  },
  {
    q: 'What documents are needed for shipping?',
    a: 'You typically need a commercial invoice, packing list, and any required customs forms. We guide you through the documentation process.',
  },
  {
    q: 'Can I track my shipment in real-time?',
    a: 'Yes, every shipment comes with a tracking ID. You can track your parcel in real-time through our website or mobile app.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className='bg-zinc-50 pt-36 lg:pt-44 pb-16 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className='flex items-center gap-3 mb-5'>
              <HeadphonesIcon className='w-6 h-6 text-primary' />
              <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Get in Touch</span>
            </div>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl'>
              We&apos;d love to hear from you
            </h1>
            <p className='text-lg sm:text-xl text-zinc-500 max-w-2xl mt-6 leading-relaxed'>
              Have a question about shipping, need a quote, or just want to say hello? Our team is ready to help.
            </p>
            <div className='flex flex-wrap gap-4 mt-8'>
              <Link
                href='/register'
                className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Get Started <ArrowRight className='w-4 h-4' />
              </Link>
              <a
                href='#form'
                className='inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Send Message
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='relative max-w-7xl mx-auto px-6 lg:px-8 mt-12'
        >
          <div className='bg-zinc-200 overflow-hidden'>
            <img
              src='https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&q=80'
              alt=''
              className='w-full h-[300px] lg:h-[400px] object-cover opacity-80'
            />
          </div>
        </motion.div>
      </section>

      {/* ===== CONTACT FORM + INFO ===== */}
      <section id='form' className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-5 gap-16'>
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className='lg:col-span-3'
            >
              <div className='flex items-center gap-3 mb-5'>
                <MessageSquare className='w-6 h-6 text-primary' />
                <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Send a Message</span>
              </div>
              <h2 className='text-xl sm:text-2xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-8'>
                Drop us a line
              </h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='bg-zinc-50 border border-zinc-100 p-10 text-center'
                >
                  <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5'>
                    <CheckCircle className='w-8 h-8 text-primary' />
                  </div>
                  <h3 className='text-lg font-semibold text-zinc-900 mb-2'>Message Sent!</h3>
                  <p className='text-zinc-500 text-sm max-w-sm mx-auto'>
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                    className='mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
                  >
                    Send Another <ArrowRight className='w-4 h-4' />
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-5'>
                  <div className='grid sm:grid-cols-2 gap-5'>
                    <div>
                      <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Full Name</label>
                      <input
                        type='text'
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder='John Doe'
                        className='w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Email</label>
                      <input
                        type='email'
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder='john@gajantraders.com'
                        className='w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                      />
                    </div>
                  </div>
                  <div className='grid sm:grid-cols-2 gap-5'>
                    <div>
                      <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Phone (optional)</label>
                      <input
                        type='tel'
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder='+91 98765 43210'
                        className='w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Subject</label>
                      <input
                        type='text'
                        required
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        placeholder='Shipping Inquiry'
                        className='w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Message</label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder='Tell us about your shipping needs...'
                      className='w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm resize-none'
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={sending}
                    className='inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-[#172554] disabled:bg-primary/60 text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 cursor-pointer rounded-lg'
                  >
                    {sending ? (
                      <><Loader2 className='w-4 h-4 animate-spin' /> Sending...</>
                    ) : (
                      <><Send className='w-4 h-4' /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='lg:col-span-2'
            >
              <div className='bg-zinc-50 border border-zinc-100 p-8 lg:p-10 space-y-8'>
                <div>
                  <div className='flex items-center gap-3 mb-5'>
                    <Phone className='w-5 h-5 text-primary' />
                    <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Call Us</span>
                  </div>
                  <a href='tel:+912223445678' className='block text-base font-semibold text-zinc-900 hover:text-primary transition-colors'>+91 22 2344 5678</a>
                  <a href='tel:+97145678901' className='block text-base font-semibold text-zinc-900 hover:text-primary transition-colors mt-1'>+971 4 567 8901</a>
                  <p className='text-xs text-zinc-400 mt-2'>Mon-Sat: 9:30 AM - 6:30 PM (IST)</p>
                </div>

                <div className='w-full h-px bg-zinc-200' />

                <div>
                  <div className='flex items-center gap-3 mb-5'>
                    <Mail className='w-5 h-5 text-primary' />
                    <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Email Us</span>
                  </div>
                  <a href='mailto:info@gajantraders.com' className='block text-base font-semibold text-zinc-900 hover:text-primary transition-colors'>info@gajantraders.com</a>
                  <a href='mailto:support@gajantraders.com' className='block text-base font-semibold text-zinc-900 hover:text-primary transition-colors mt-1'>support@gajantraders.com</a>
                  <p className='text-xs text-zinc-400 mt-2'>We respond within 24 hours</p>
                </div>

                <div className='w-full h-px bg-zinc-200' />

                <div>
                  <div className='flex items-center gap-3 mb-5'>
                    <Clock className='w-5 h-5 text-primary' />
                    <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Business Hours</span>
                  </div>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-zinc-500'>Mon - Sat</span>
                      <span className='text-zinc-900 font-medium'>9:30 AM - 6:30 PM</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-zinc-500'>Sunday</span>
                      <span className='text-zinc-900 font-medium'>Closed</span>
                    </div>
                  </div>
                </div>

                <div className='w-full h-px bg-zinc-200' />

                <div>
                  <div className='flex items-center gap-3 mb-5'>
                    <MapPin className='w-5 h-5 text-primary' />
                    <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>Head Office</span>
                  </div>
                  <p className='text-sm text-zinc-500 leading-relaxed'>
                    7, Gajan Traders House, P D Mello Road,<br />
                    Near Masjid Bunder, Mumbai 400009,<br />
                    Maharashtra, India
                  </p>
                  <a
                    href='https://maps.google.com'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[#1E293B] uppercase tracking-wider mt-3 transition-colors'
                  >
                    View on Map <ArrowUpRight className='w-3 h-3' />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== OFFICES ===== */}
      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase block mb-4'>Our Offices</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              Visit us at any of our locations
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial='initial' whileInView='animate' viewport={{ once: true }} className='grid md:grid-cols-3 gap-8'>
            {offices.map((office, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className='bg-white border border-zinc-100 p-8 hover:border-zinc-200 hover:shadow-sm transition-all duration-300'
              >
                <office.icon className='w-8 h-8 text-primary mb-5' />
                <h3 className='text-base font-semibold text-zinc-900 mb-3'>{office.city}</h3>
                <p className='text-sm text-zinc-500 leading-relaxed mb-4'>{office.address}</p>
                <div className='space-y-2 text-sm'>
                  <a href={`tel:${office.phone.replace(/\s/g, '')}`} className='flex items-center gap-2 text-zinc-600 hover:text-primary transition-colors'>
                    <Phone className='w-3.5 h-3.5' /> {office.phone}
                  </a>
                  <a href={`mailto:${office.email}`} className='flex items-center gap-2 text-zinc-600 hover:text-primary transition-colors'>
                    <Mail className='w-3.5 h-3.5' /> {office.email}
                  </a>
                  <div className='flex items-center gap-2 text-zinc-400'>
                    <Clock className='w-3.5 h-3.5' /> {office.hours}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-xs font-semibold tracking-[0.2em] uppercase block mb-4'>Quick Answers</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              Frequently asked questions
            </h2>
          </motion.div>

          <div className='max-w-3xl mx-auto space-y-4'>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className='bg-zinc-50 border border-zinc-100 p-6'
              >
                <h3 className='text-sm font-semibold text-zinc-900 mb-2'>{faq.q}</h3>
                <p className='text-sm text-zinc-500 leading-relaxed'>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className='py-16 lg:py-24 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <motion.div {...fadeIn}>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4'>
              Ready to ship with us?
            </h2>
            <p className='text-zinc-500 max-w-lg mx-auto mb-10 text-base'>
              Join thousands of businesses that trust Gajan Traders for their international shipping needs.
            </p>
            <div className='flex flex-wrap justify-center gap-4'>
              <Link
                href='/register'
                className='inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Create Account <ArrowRight className='w-4 h-4' />
              </Link>
              <Link
                href='/about'
                className='inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Learn More
              </Link>
            </div>
            <div className='flex flex-wrap justify-center gap-8 mt-10 text-sm text-zinc-400'>
              <span>No Hidden Charges</span>
              <span className='w-px h-4 bg-zinc-200' />
              <span>Doorstep Pickup</span>
              <span className='w-px h-4 bg-zinc-200' />
              <span>50+ Countries Served</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
