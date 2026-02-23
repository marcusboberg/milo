import type { DailyPlan, FeedingEvent } from '../types';
import { getStockholmHour } from './time';

export type TodayCta =
  | { kind: 'chooseFood'; label: string }
  | { kind: 'logPortion2'; label: string }
  | { kind: 'logPortion3'; label: string }
  | { kind: 'none'; label: string };

export const buildTodayCta = (plan: DailyPlan | undefined, events: FeedingEvent[], now = new Date()): TodayCta => {
  const hasPortion1 = events.some((e) => e.slot === 'portion1');
  const hasPortion2 = events.some((e) => e.slot === 'portion2');
  const hasPortion3 = events.some((e) => e.slot === 'portion3');
  const hour = getStockholmHour(now);

  if (!plan?.defaultFoodId || !hasPortion1) {
    return { kind: 'chooseFood', label: "Choose today's food" };
  }

  if (hour >= 17 && !hasPortion2) {
    return { kind: 'logPortion2', label: 'Log Portion 2' };
  }

  if (hour >= 20 && !hasPortion3) {
    return { kind: 'logPortion3', label: 'Log Portion 3' };
  }

  return { kind: 'none', label: 'All set for now' };
};

export const shouldShowYesterdayModal = ({
  yesterdayMissing,
  todayStarted
}: {
  yesterdayMissing: boolean;
  todayStarted: boolean;
}): boolean => yesterdayMissing && !todayStarted;
