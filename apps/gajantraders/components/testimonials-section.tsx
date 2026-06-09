"use client";

import { motion } from "framer-motion";
import { Star as StarIcon } from "lucide-react";
import ReactCountryFlag from "react-country-flag";

const testimonials = [
  {
    quote:
      "Absolutely the fastest service I've used for my Malaysia shipments. The rate of ₹290/kg is unbeatable for the speed.",
    name: "John Doe",
    initials: "JD",
    role: "E-commerce Seller",
    country: "Malaysia",
    flag: "MY",
  },
  {
    quote:
      "Gajan Traders removed all the headache from customs clearance. My packages to UK arrive earlier than expected every time.",
    name: "Anita S.",
    initials: "AS",
    role: "Textile Exporter",
    country: "United Kingdom",
    flag: "GB",
  },
  {
    quote:
      "Great tracking interface. I can see exactly where my shipment is without calling support.",
    name: "Rahul K.",
    initials: "RK",
    role: "Retail Manager",
    country: "UAE",
    flag: "AE",
  },
  {
    quote:
      "Customer support is top notch. They helped me repackage a shipment to save weight. Highly recommended!",
    name: "Mohamed K.",
    initials: "MK",
    role: "Small Business Owner",
    country: "Saudi Arabia",
    flag: "SA",
  },
  {
    quote: "Best rates for USA shipments. Saved me 20% compared to DHL.",
    name: "Sarah R.",
    initials: "SR",
    role: "Artisan",
    country: "USA",
    flag: "US",
  },
  {
    quote: "Reliable and trustworthy. Been using them for 2 years now.",
    name: "Dinesh K.",
    initials: "DK",
    role: "Trader",
    country: "Canada",
    flag: "CA",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="py-16 px-4 overflow-hidden"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="font-heading font-semibold text-white leading-[1.05] -tracking-[0.48px] text-balance mb-4"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
          >
            Loved by <span className="text-primary">2000+</span> Customers
          </h2>
          <p className="text-base text-white/50 max-w-prose mx-auto">
            Real feedback from businesses worldwide who trust us with their
            shipments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-6 right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />

              <div className="relative z-10">
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, r) => (
                    <StarIcon
                      key={r}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <div className="relative mb-6">
                  <span className="absolute -top-4 -left-2 text-5xl text-primary/15 font-serif">
                    &ldquo;
                  </span>
                  <p className="text-base text-white/70 leading-relaxed pl-5">
                    {item.quote}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold">
                        {item.initials}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-primary transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-white/40">{item.role}</p>
                    </div>
                  </div>
                  <ReactCountryFlag
                    countryCode={item.flag}
                    className="w-8 h-6 rounded shadow-sm"
                    svg
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
