"use client";

import { motion } from "framer-motion";
import {
  Users,
  Globe as GlobeIcon,
  Award,
  Clock as ClockIcon,
} from "lucide-react";
import { StaggeredSlideIn } from "@/components/ScrollAnimations";

const stats = [
  { value: "50K+", label: "Happy Customers", icon: Users },
  { value: "200+", label: "Countries", icon: GlobeIcon },
  { value: "99%", label: "Success Rate", icon: Award },
  { value: "24/7", label: "Support", icon: ClockIcon },
];

export default function StatsSection() {
  return (
    <section className="py-14 px-4 bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <StaggeredSlideIn
          direction="up"
          delayBetween={0.08}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-3 p-4 md:p-5 rounded-xl ${
                i === 0
                  ? "bg-primary border border-primary/20"
                  : "bg-white/[0.02] border border-white/5"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  i === 0 ? "bg-white/15" : "bg-primary/10"
                }`}
              >
                <stat.icon
                  className={`w-5 h-5 ${i === 0 ? "text-white" : "text-primary"}`}
                />
              </div>
              <div>
                <div
                  className={`text-lg md:text-xl font-bold ${
                    i === 0 ? "text-white" : "text-white"
                  }`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-xs md:text-sm ${
                    i === 0 ? "text-white/60" : "text-white/40"
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </StaggeredSlideIn>
      </div>
    </section>
  );
}
