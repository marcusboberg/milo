const STOCKHOLM_TZ = 'Europe/Stockholm';

const pad2 = (value: number): string => value.toString().padStart(2, '0');

export const getStockholmDate = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STOCKHOLM_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

export const getStockholmHour = (date = new Date()): number => {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: STOCKHOLM_TZ,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(date);
  return Number(hour);
};

export const getRelativeStockholmDate = (dayOffset: number, date = new Date()): string => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + dayOffset);
  return getStockholmDate(shifted);
};

export const formatLocalDateTimeInput = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const toIsoFromDateTimeLocal = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

export const formatSince = (fromISO: string, now = new Date()): string => {
  const from = new Date(fromISO);
  const diffMs = now.getTime() - from.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} h ${remMins} m`;
};

export const formatStockholmDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: STOCKHOLM_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
