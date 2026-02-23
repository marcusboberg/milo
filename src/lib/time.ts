const STOCKHOLM_TZ = 'Europe/Stockholm';

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
