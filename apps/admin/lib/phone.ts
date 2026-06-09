export const COUNTRY_CODES: Record<string, string> = {
  US: "+1",
  CA: "+1",
  GB: "+44",
  AU: "+61",
  DE: "+49",
  FR: "+33",
  CN: "+86",
  JP: "+81",
  IN: "+91",
  BR: "+55",
  MX: "+52",
  LK: "+94",
  AE: "+971",
  SG: "+65",
  MY: "+60",
  TH: "+66",
  VN: "+84",
  KR: "+82",
  TW: "+886",
  HK: "+852",
  NZ: "+64",
  ZA: "+27",
  RU: "+7",
  TR: "+90",
  SA: "+966",
  PK: "+92",
  BD: "+880",
  PH: "+63",
  ID: "+62",
  NL: "+31",
  IT: "+39",
  ES: "+34",
  PT: "+351",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  FI: "+358",
  PL: "+48",
  AT: "+43",
  CH: "+41",
  BE: "+32",
  IE: "+353",
}

export function getDialCode(countryCode: string): string {
  return COUNTRY_CODES[countryCode] || "+1"
}

export function prependCountryCode(phone: string, countryCode: string): string {
  let cleaned = phone.replace(/\s/g, "")
  if (!cleaned.startsWith("+")) {
    const code = COUNTRY_CODES[countryCode] || "+1"
    cleaned = code + cleaned
  }
  return cleaned
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return ""
  const cleaned = phone.replace(/[^\d+]/g, "")
  const dialCode = cleaned.startsWith("+")
    ? cleaned.match(/^\+\d+/)?.[0] || ""
    : ""
  const number = cleaned.replace(dialCode, "")
  const groups: string[] = []
  for (let i = 0; i < number.length; i += 3) {
    groups.push(number.slice(i, i + 3))
  }
  return dialCode ? `${dialCode} ${groups.join(" ")}` : groups.join(" ")
}

export function stripPhoneFormatting(phone: string): string {
  return phone.replace(/[\s\-()]/g, "")
}
