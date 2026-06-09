"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { X, ChevronDown, Loader2, Send, Search } from "lucide-react";

interface FormData {
  destinationCountry: string;
  goodsType: string;
  weight: string;
  email: string;
  phone: string;
  remarks: string;
}

interface FormErrors {
  destinationCountry?: string;
  goodsType?: string;
  weight?: string;
  email?: string;
  phone?: string;
}

const goodsTypes = [
  { value: "general", label: "General" },
  { value: "fragile", label: "Fragile" },
  { value: "electronics", label: "Electronics" },
  { value: "perishable", label: "Perishable" },
  { value: "hazardous", label: "Hazardous" },
  { value: "machinery", label: "Machinery" },
  { value: "chemicals", label: "Chemicals" },
  { value: "other", label: "Other" },
];

const destinationCountries = [
  "Australia",
  "Bangladesh",
  "Bhutan",
  "Canada",
  "China",
  "Dubai (UAE)",
  "France",
  "Germany",
  "Hong Kong",
  "Indonesia",
  "Italy",
  "Japan",
  "Kenya",
  "Malaysia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Pakistan",
  "Philippines",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Thailand",
  "UK",
  "USA",
  "Vietnam",
];

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border ${error ? "border-red-300" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm flex items-center justify-between bg-white`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No results</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 ${value === opt ? "bg-primary/10 text-primary" : "text-slate-700"}`}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function QuoteDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    destinationCountry: "",
    goodsType: "general",
    weight: "",
    email: user?.email || "",
    phone: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen && user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [isOpen, user?.email]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.destinationCountry)
      newErrors.destinationCountry = "Destination is required";
    if (!formData.goodsType) newErrors.goodsType = "Goods type is required";
    if (!formData.weight || parseFloat(formData.weight) <= 0)
      newErrors.weight = "Valid weight is required";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await api.post("/quotes", {
        originCountry: "India",
        destinationCountry: formData.destinationCountry,
        goodsType: formData.goodsType,
        weight: parseFloat(formData.weight),
        email: formData.email,
        phone: formData.phone,
        remarks: formData.remarks || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Request a Quote
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Free packing on all shipments ✦ Get competitive rates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Destination
              </label>
              <Combobox
                value={formData.destinationCountry}
                onChange={(val) => handleChange("destinationCountry", val)}
                options={destinationCountries}
                placeholder="Select destination"
                error={errors.destinationCountry}
              />
              {errors.destinationCountry && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.destinationCountry}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Goods Type
              </label>
              <select
                value={formData.goodsType}
                onChange={(e) => handleChange("goodsType", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm bg-white"
              >
                {goodsTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Weight (KG)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.0"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.weight ? "border-red-300" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm`}
              />
              {errors.weight && (
                <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? "border-red-300" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? "border-red-300" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Remarks (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any special instructions..."
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium hover:from-slate-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
