// src/lib/dateUtils.ts
import { addHours, format, startOfDay, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const COLOMBIA_TZ = "America/Bogota";

/**
 * The "day" goes from 6:00 AM to 5:59 AM the next day.
 * This function returns the "logical date" for a given timestamp.
 */
export function getLogicalDate(date: Date = new Date()): string {
  // Convert to Colombia time
  const zonedDate = toZonedTime(date, COLOMBIA_TZ);
  
  // If it's before 6 AM, it's still the previous logical day
  const hours = zonedDate.getHours();
  if (hours < 6) {
    return format(subHours(zonedDate, 6), "yyyy-MM-dd");
  }
  return format(zonedDate, "yyyy-MM-dd");
}

export function getColombiaTime(date: Date = new Date()): Date {
  return toZonedTime(date, COLOMBIA_TZ);
}

export function formatInColombia(date: Date, formatStr: string): string {
  return format(toZonedTime(date, COLOMBIA_TZ), formatStr);
}
