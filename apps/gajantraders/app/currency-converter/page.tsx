"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Globe,
  RefreshCw,
  DollarSign,
  Euro,
  PoundSterling,
  IndianRupee,
  HeadphonesIcon,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const currencies = [
  { code: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "INR", label: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "QAR", label: "Qatari Riyal", symbol: "﷼", flag: "🇶🇦" },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "KWD", label: "Kuwaiti Dinar", symbol: "د.ك", flag: "🇰🇼" },
];

const popularPairs = [
  { from: "USD", to: "INR", label: "US Dollar to Indian Rupee" },
  { from: "GBP", to: "INR", label: "British Pound to Indian Rupee" },
  { from: "EUR", to: "INR", label: "Euro to Indian Rupee" },
  { from: "AED", to: "INR", label: "UAE Dirham to Indian Rupee" },
  { from: "INR", to: "USD", label: "Indian Rupee to US Dollar" },
  { from: "SAR", to: "INR", label: "Saudi Riyal to Indian Rupee" },
];

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

export default function CurrencyConverterPage() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [amount, setAmount] = useState("1");
  const [rate, setRate] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (rates[toCurrency] && fromCurrency !== toCurrency) {
      const baseRate = rates[toCurrency] / rates[fromCurrency];
      setRate(baseRate);
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        setConvertedAmount(numAmount * baseRate);
      }
    } else if (fromCurrency === toCurrency) {
      setRate(1);
      const numAmount = parseFloat(amount);
      setConvertedAmount(isNaN(numAmount) ? null : numAmount);
    }
  }, [fromCurrency, toCurrency, amount, rates]);

  const fetchRates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/currency-rates");
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();
      setRates({ ...data.rates, USD: 1 });
      setLastUpdated(data.date);
    } catch {
      setError("Could not load exchange rates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatCurrency = (value: number, code: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fromCurrencyData = currencies.find((c) => c.code === fromCurrency);
  const toCurrencyData = currencies.find((c) => c.code === toCurrency);

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
              <Globe className="w-6 h-6 text-primary" />
              <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                Currency Converter
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl">
              Real-Time Exchange Rates
            </h1>
            <p className="text-lg sm:text-xl text-zinc-700 max-w-2xl mt-6 leading-relaxed">
              Convert currencies instantly with accurate, real-time exchange
              rates. Compare global values and make smarter financial decisions
              with ease.
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
              src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&q=80"
              alt=""
              className="w-full h-[300px] lg:h-[400px] object-cover opacity-80"
            />
          </div>
        </motion.div>
      </section>

      {/* ===== CONVERTER TOOL ===== */}
      <section className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Converter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="flex items-center gap-3 mb-5">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                  Try Our Currency Converter
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-8">
                Convert currencies in real time
              </h2>

              <div className="bg-zinc-50 border border-zinc-100 p-8 lg:p-10">
                {/* From / To */}
                <div className="grid sm:grid-cols-5 gap-4 items-end mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      From
                    </label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none cursor-pointer"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      onClick={swapCurrencies}
                      className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:border-primary/30 hover:text-primary transition-all duration-200 cursor-pointer"
                      title="Swap currencies"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      To
                    </label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none cursor-pointer"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-zinc-500">
                      {fromCurrencyData?.symbol || "$"}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1"
                      min="0"
                      step="any"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Result */}
                {rate !== null && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/10 rounded-lg p-6 text-center"
                  >
                    <p className="text-sm text-zinc-500 mb-1">
                      {amount} {fromCurrency} =
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 font-heading">
                      {convertedAmount !== null
                        ? formatCurrency(convertedAmount, toCurrency)
                        : "\u2014"}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                    </p>
                  </motion.div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      onClick={fetchRates}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-zinc-500">
                      Loading rates...
                    </span>
                  </div>
                )}

                {/* Last updated */}
                {lastUpdated && !error && (
                  <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                    <span>
                      Rates updated:{" "}
                      {new Date(lastUpdated).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={fetchRates}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Rate Reference Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-zinc-50 border border-zinc-100 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                    Popular Rates
                  </span>
                </div>
                <p className="text-sm text-zinc-700 mb-6">
                  Commonly used currency pairs for international shipping and
                  trade.
                </p>

                <div className="space-y-3">
                  {popularPairs.map((pair, i) => {
                    const fromRate = rates[pair.from] || 1;
                    const toRate = rates[pair.to] || 0;
                    const pairRate = toRate / fromRate;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setFromCurrency(pair.from);
                          setToCurrency(pair.to);
                          setAmount("1");
                        }}
                        className="w-full flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-lg hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-zinc-900">
                            {pair.label}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            1 {pair.from} = {pairRate.toFixed(4)} {pair.to}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Rates provided by European Central Bank</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-14 lg:py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            {...fadeIn}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
              Currency FAQs
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "How often are exchange rates updated?",
                a: "Our rates are sourced from the European Central Bank and are updated daily on working days. The rates shown are mid-market rates and may differ from the rates offered by banks or currency exchange services.",
              },
              {
                q: "Why might the rate I see differ from my bank?",
                a: "Banks and currency exchange services typically add a markup to the mid-market rate. The rates shown here are the wholesale mid-market rates without any markup.",
              },
              {
                q: "Which currencies can I convert?",
                a: "We support over 30 currencies including USD, GBP, INR, EUR, AED, CAD, AUD, SGD, MYR, QAR, SAR, and KWD. These cover all major international shipping routes served by Gajan Traders.",
              },
              {
                q: "How do I calculate shipping costs in my currency?",
                a: 'Simply select your local currency as "From" and the billing currency as "To", then enter the shipping cost amount. The converter will show you the equivalent in your preferred currency.',
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-white border border-zinc-100 p-6"
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
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4">
              Ready to ship with us?
            </h2>
            <p className="text-zinc-700 max-w-lg mx-auto mb-10 text-lg">
              Get instant quotes, real-time tracking, and competitive exchange
              rates for all your international shipping needs.
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
