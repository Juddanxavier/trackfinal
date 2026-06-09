"use client";

import { Mail, Phone } from "lucide-react";
import { SlideIn } from "@/components/ScrollAnimations";

export default function CTASection() {
  return (
    <section className="py-14 px-4" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="max-w-4xl mx-auto text-center">
        <SlideIn direction="up">
          <h2
            className="font-heading font-semibold text-white leading-[1.05] -tracking-[0.48px] text-balance mb-4"
            style={{ fontSize: "clamp(1.25rem, 3vw, 1.625rem)" }}
          >
            Ready to Ship?
          </h2>
          <p className="text-base text-white/50 mb-8 max-w-prose mx-auto">
            Contact us today for a free consultation and quote. Our team is
            available 24/7 to assist you.
          </p>
        </SlideIn>
        <SlideIn
          direction="up"
          delay={0.1}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="mailto:info@gajantraders.com"
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-white/80 transition-all duration-300 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            info@gajantraders.com
          </a>
          <a
            href="tel:+1234567890"
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-white/80 transition-all duration-300 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            +1 234 567 890
          </a>
        </SlideIn>
      </div>
    </section>
  );
}
