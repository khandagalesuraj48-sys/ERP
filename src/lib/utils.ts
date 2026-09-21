import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with proper conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators. */
export function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-IN", opts).format(n);
}

/** Format currency (INR default for construction ERP). */
export function money(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format fuel efficiency with explicit operational units */
export function formatFuelEfficiency(
  quantityLitres: number,
  readingDelta: number,
  meterType: "KM" | "HOUR"
): { primary: string; secondary?: string } {
  if (quantityLitres <= 0 || readingDelta <= 0) {
    return { primary: meterType === "KM" ? "— L/100 KM" : "— L/Hr" };
  }

  if (meterType === "KM") {
    const lPer100Km = (quantityLitres / readingDelta) * 100;
    const kmPerLitre = readingDelta / quantityLitres;
    return {
      primary: `${lPer100Km.toFixed(1)} L/100 KM`,
      secondary: `${kmPerLitre.toFixed(2)} KM/L`,
    };
  } else {
    const lPerHour = quantityLitres / readingDelta;
    return {
      primary: `${lPerHour.toFixed(1)} L/Hr`,
    };
  }
}
