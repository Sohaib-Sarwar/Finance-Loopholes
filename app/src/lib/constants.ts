// Mirrors the constants defined at the top of logic.cpp exactly.
// Do not change these values or the bank balance model — see logic.cpp
// lines 13-21 (the single source of truth for this calculator).

export const DAYS_PER_YEAR = 365.0;
export const WEEKS_PER_YEAR = 52.0;
export const MONTHS_PER_YEAR = 12.0;
export const DAYS_PER_WEEK = 7.0;

// Fixed weekly bank closing-balance pattern (logic.cpp lines 19-21).
export const WEEKDAY_BALANCE = 600_000.0; // Monday-Friday, each day
export const SATURDAY_BALANCE = 840_000.0;
export const SUNDAY_BALANCE = 936_000.0;
