"use client";

import { motion } from "framer-motion";
import {
  Plane as PlaneIcon,
  Package as PackageIcon,
  Truck as TruckIcon,
  Shield as ShieldIcon,
  Clock as ClockIcon,
  Globe as GlobeIcon,
} from "lucide-react";

const services = [
  {
    icon: PlaneIcon,
    label: "International Courier",
    desc: "Fast delivery worldwide",
  },
  { icon: PackageIcon, label: "Express Delivery", desc: "Priority shipping" },
  { icon: TruckIcon, label: "Door Pickup", desc: "We come to you" },
  { icon: ShieldIcon, label: "Secure Packaging", desc: "Protected parcels" },
  { icon: ClockIcon, label: "24/7 Tracking", desc: "Real-time updates" },
  { icon: GlobeIcon, label: "200+ Countries", desc: "Global coverage" },
];

export default function ServicesSection() {
  return (
    <section className="py-16 md:py-24 px-4 bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-white leading-[1.05] -tracking-[0.48px] text-balance"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
          >
            What We Offer
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/40 text-base max-w-prose mx-auto mt-4 leading-relaxed"
          >
            End-to-end logistics services from pickup to delivery
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center text-center gap-3 p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {service.label}
                </div>
                <div className="text-xs text-white/40 mt-1">{service.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
