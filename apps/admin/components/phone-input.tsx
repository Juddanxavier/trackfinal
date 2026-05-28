"use client"

import { Input } from "@/components/ui/input"
import { getDialCode, prependCountryCode } from "@/lib/phone"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  error?: string
  id?: string
  placeholder?: string
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  error,
  id,
  placeholder,
  className,
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (value) {
            onChange(prependCountryCode(value, countryCode))
          }
        }}
        placeholder={placeholder || getDialCode(countryCode) + " 9000000000"}
        className={className}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
