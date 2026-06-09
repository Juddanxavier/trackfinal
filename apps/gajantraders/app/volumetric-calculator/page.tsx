"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Ruler,
  HeadphonesIcon,
  Package,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const units = {
  metric: { label: "CM / KG", divisor: 5000 },
  imperial: { label: "Inches / LBS", divisor: 166 },
};

type UnitSystem = keyof typeof units;

export default function VolumetricCalculatorPage() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [actualWeight, setActualWeight] = useState("");

  const l = parseFloat(length);
  const w = parseFloat(width);
  const h = parseFloat(height);
  const aw = parseFloat(actualWeight);

  const isValid = l > 0 && w > 0 && h > 0;
  const divisor = units[unitSystem].divisor;
  const volumetricWeight = isValid ? (l * w * h) / divisor : null;
  const actualOk = aw > 0;
  const chargeableWeight =
    volumetricWeight !== null && actualOk
      ? Math.max(volumetricWeight, aw)
      : volumetricWeight;

  const weightUnit = unitSystem === "metric" ? "kg" : "lbs";
  const dimUnit = unitSystem === "metric" ? "cm" : "in";

  const clearAll = () => {
    setLength("");
    setWidth("");
    setHeight("");
    setActualWeight("");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="bg-zinc-50 pt-36 lg:pt-44 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Box className="w-6 h-6 text-primary" />
              <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                Volumetric Calculator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl">
              Dimensional Weight Calculator
            </h1>
            <p className="text-lg sm:text-xl text-zinc-700 max-w-2xl mt-6 leading-relaxed">
              Calculate volumetric (dimensional) weight for your shipments. When
              dimensional weight exceeds actual weight, the charge is based on
              the IATA volumetric standard.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative max-w-7xl mx-auto px-6 lg:px-8 mt-12"
        >
          <div className="bg-zinc-200 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=80"
              alt=""
              className="w-full h-[300px] lg:h-[400px] object-cover opacity-80"
            />
          </div>
        </motion.div>
      </section>

      {/* ===== CALCULATOR ===== */}
      <section className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Calculator Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="flex items-center gap-3 mb-5">
                <Ruler className="w-6 h-6 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                  Enter Package Dimensions
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-8">
                Calculate volumetric weight in seconds
              </h2>

              <div className="bg-zinc-50 border border-zinc-100 p-8 lg:p-10">
                {/* Unit Toggle */}
                <div className="flex gap-2 mb-8 bg-white p-1 border border-zinc-200 rounded-lg w-fit">
                  {(
                    Object.entries(units) as [
                      UnitSystem,
                      (typeof units)[UnitSystem],
                    ][]
                  ).map(([key, u]) => (
                    <button
                      key={key}
                      onClick={() => setUnitSystem(key)}
                      className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                        unitSystem === key
                          ? "bg-primary text-white shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>

                {/* L x W x H */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Length", value: length, set: setLength },
                    { label: "Width", value: width, set: setWidth },
                    { label: "Height", value: height, set: setHeight },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                        {field.label} ({dimUnit})
                      </label>
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="any"
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Actual Weight */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Actual Weight ({weightUnit})
                  </label>
                  <input
                    type="number"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Optional. Enter the actual weight to determine which is
                    greater for billing.
                  </p>
                </div>

                {/* Clear */}
                <div className="flex justify-end">
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Results Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-zinc-50 border border-zinc-100 p-8 lg:p-10 sticky top-28">
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                    Results
                  </span>
                </div>

                {!isValid ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                      <Ruler className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500">
                      Enter dimensions to calculate volumetric weight
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Volumetric Weight */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-5 text-center">
                      <p className="text-xs text-zinc-500 mb-1">
                        Volumetric Weight
                      </p>
                      <p className="text-2xl font-bold text-zinc-900 font-heading">
                        {volumetricWeight!.toFixed(2)}{" "}
                        <span className="text-sm font-normal text-zinc-500">
                          {weightUnit}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {length} × {width} × {height} / {divisor}
                      </p>
                    </div>

                    {/* Actual Weight */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-5 text-center">
                      <p className="text-xs text-zinc-500 mb-1">
                        Actual Weight
                      </p>
                      <p className="text-2xl font-bold text-zinc-900 font-heading">
                        {actualOk ? `${aw.toFixed(2)}` : "\u2014"}{" "}
                        <span className="text-sm font-normal text-zinc-500">
                          {actualOk ? weightUnit : ""}
                        </span>
                      </p>
                    </div>

                    {/* Chargeable Weight */}
                    <div
                      className={`rounded-lg p-5 text-center border-2 ${
                        chargeableWeight !== null &&
                        actualOk &&
                        chargeableWeight > aw
                          ? "bg-primary/5 border-primary/20"
                          : "bg-white border-zinc-200"
                      }`}
                    >
                      <p className="text-xs text-zinc-500 mb-1">
                        Chargeable Weight
                      </p>
                      <p className="text-2xl font-bold text-zinc-900 font-heading">
                        {chargeableWeight!.toFixed(2)}{" "}
                        <span className="text-sm font-normal text-zinc-500">
                          {weightUnit}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {chargeableWeight !== null &&
                        actualOk &&
                        chargeableWeight === aw
                          ? "Billed by actual weight"
                          : chargeableWeight !== null &&
                              actualOk &&
                              chargeableWeight > aw
                            ? "Billed by volumetric weight"
                            : actualOk
                              ? ""
                              : "Add actual weight for comparison"}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-zinc-100 rounded-lg">
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        <strong>Note:</strong> If the volumetric weight exceeds
                        the actual weight, the shipment is charged based on the
                        dimensional weight per IATA standards. This ensures the
                        package density is accounted for.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-14 lg:py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            {...fadeIn}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
              How It Works
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
              Understanding volumetric weight
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Measure Your Package",
                desc: "Measure the length, width, and height of your package in centimeters or inches. Include any protruding parts.",
              },
              {
                step: "02",
                title: "Calculate Dimensional Weight",
                desc: `Divide the cubic size (L × W × H) by the standard divisor — ${units.metric.divisor} for metric or ${units.imperial.divisor} for imperial.`,
              },
              {
                step: "03",
                title: "Compare & Ship",
                desc: "The greater of actual weight and volumetric weight becomes the chargeable weight. This ensures fair pricing for all package sizes.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white border border-zinc-100 p-8"
              >
                <span className="text-4xl font-bold text-primary/10 font-heading block mb-4">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-zinc-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-base text-zinc-700 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            {...fadeIn}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
              Volumetric FAQs
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What is volumetric weight?",
                a: "Volumetric weight, also called dimensional weight (DIM weight), is a pricing technique used by couriers. It considers the volume a package occupies rather than just its actual weight, ensuring low-density packages are charged fairly for the space they consume.",
              },
              {
                q: "How is volumetric weight calculated?",
                a: `The formula is: (Length × Width × Height) ÷ Divisor. For metric measurements (cm), the divisor is ${units.metric.divisor}. For imperial (inches), the divisor is ${units.imperial.divisor}. The result is the volumetric weight in kg or lbs.`,
              },
              {
                q: "Why do couriers use dimensional weight?",
                a: "Couriers use volumetric weight because a lightweight but bulky package takes up valuable cargo space. Charging by dimensional weight ensures that both heavy-dense and large-light shipments are priced equitably relative to the space they use.",
              },
              {
                q: "Does Gajan Traders use volumetric pricing?",
                a: "Yes, like all major international couriers, Gajan Traders follows IATA guidelines. Your shipment will be charged based on the greater of actual weight or volumetric weight. Use this calculator to estimate chargeable weight before booking.",
              },
              {
                q: "How can I reduce volumetric weight?",
                a: "Use appropriately sized boxes — avoid oversized packaging. Remove unnecessary void fill, use vacuum sealing for soft goods, and consider flat-pack assembly for furniture. Efficient packing reduces dimensional weight and saves on shipping costs.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-zinc-50 border border-zinc-100 p-6"
              >
                <h3 className="text-base font-semibold text-zinc-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-base text-zinc-700 leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 lg:py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4">
              Ready to ship with us?
            </h2>
            <p className="text-zinc-700 max-w-lg mx-auto mb-10 text-lg">
              Get instant quotes, calculate volumetric weight, and track your
              shipments — all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
