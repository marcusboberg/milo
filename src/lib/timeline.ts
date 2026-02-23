import type { FeedingEvent } from '../types';

export const sortEventsByTimestampDesc = (events: FeedingEvent[]): FeedingEvent[] =>
  [...events].sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());

export const latestEventForCat = (events: FeedingEvent[], catId: string): FeedingEvent | undefined =>
  sortEventsByTimestampDesc(events.filter((event) => event.catId === catId))[0];
