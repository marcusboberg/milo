export type EventType = 'portion' | 'snack';
export type PortionSlot = 'portion1' | 'portion2' | 'portion3' | 'extra';

export interface Member {
  uid: string;
  email: string;
  displayName?: string;
}

export interface Cat {
  id: string;
  name: string;
  photoUrl?: string;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  householdId: string;
  kind: 'food' | 'snack';
  name: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface FeedingEvent {
  id: string;
  householdId: string;
  catId: string;
  eventType: EventType;
  slot?: PortionSlot;
  itemId: string;
  itemName: string;
  amountChip?: '1/4' | '1/3' | '1/2' | '1/1';
  amountText?: string;
  note?: string;
  eventAt: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface DailyPlan {
  id: string;
  householdId: string;
  catId: string;
  stockholmDate: string;
  defaultFoodId?: string;
  defaultFoodName?: string;
  startedAt?: string;
  plannedSlots: {
    portion1?: string;
    portion2?: string;
    portion3?: string;
  };
}
