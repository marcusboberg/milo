import { createContext, useContext, useMemo, useState } from 'react';
import type { Cat, DailyPlan, FeedingEvent, FoodItem, PortionSlot } from '../types';
import { getStockholmDate } from './time';
import { latestEventForCat } from './timeline';

interface Store {
  cats: Cat[];
  selectedCatId: string;
  setSelectedCatId: (catId: string) => void;
  foods: FoodItem[];
  snacks: FoodItem[];
  events: FeedingEvent[];
  plans: DailyPlan[];
  chooseDefaultFood: (catId: string, foodId: string) => void;
  addEvent: (input: {
    catId: string;
    eventType: 'portion' | 'snack';
    itemId: string;
    slot?: PortionSlot;
    amountChip?: FeedingEvent['amountChip'];
    amountText?: string;
    note?: string;
    eventAt: string;
  }) => void;
  updateLatestNote: (catId: string, note: string) => void;
}

const now = new Date().toISOString();
const seededCats: Cat[] = [{ id: 'cat_milo', name: 'Milo', createdAt: now }];
const seededFoods: FoodItem[] = [
  { id: 'food_chicken', householdId: 'hh1', kind: 'food', name: 'Chicken wet food', active: true, createdAt: now },
  { id: 'food_salmon', householdId: 'hh1', kind: 'food', name: 'Salmon kibble', active: true, createdAt: now },
  { id: 'snack_treat', householdId: 'hh1', kind: 'snack', name: 'Dental treat', active: true, createdAt: now }
];

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedCatId, setSelectedCatId] = useState(seededCats[0].id);
  const [foods] = useState(seededFoods.filter((f) => f.kind === 'food'));
  const [snacks] = useState(seededFoods.filter((f) => f.kind === 'snack'));
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [events, setEvents] = useState<FeedingEvent[]>([]);

  const chooseDefaultFood = (catId: string, foodId: string) => {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return;

    const todayId = `${catId}_${getStockholmDate()}`;
    setPlans((prev) => {
      const existing = prev.find((p) => p.id === todayId);
      if (existing) {
        return prev.map((p) =>
          p.id === todayId ? { ...p, defaultFoodId: foodId, defaultFoodName: food.name, startedAt: p.startedAt ?? new Date().toISOString() } : p
        );
      }
      return [
        ...prev,
        {
          id: todayId,
          householdId: 'hh1',
          catId,
          stockholmDate: getStockholmDate(),
          defaultFoodId: foodId,
          defaultFoodName: food.name,
          startedAt: new Date().toISOString(),
          plannedSlots: {}
        }
      ];
    });
  };

  const addEvent: Store['addEvent'] = (input) => {
    const item = [...foods, ...snacks].find((f) => f.id === input.itemId);
    if (!item) return;
    const newEvent: FeedingEvent = {
      id: crypto.randomUUID(),
      householdId: 'hh1',
      catId: input.catId,
      eventType: input.eventType,
      slot: input.slot,
      itemId: input.itemId,
      itemName: item.name,
      amountChip: input.amountChip,
      amountText: input.amountText,
      note: input.note,
      eventAt: input.eventAt,
      createdAt: new Date().toISOString(),
      createdBy: 'demo-user'
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateLatestNote = (catId: string, note: string) => {
    setEvents((prev) => {
      const next = [...prev];
      const latest = latestEventForCat(next, catId);
      const idx = latest ? next.findIndex((e) => e.id === latest.id) : -1;
      if (idx >= 0) {
        next[idx] = { ...next[idx], note, updatedAt: new Date().toISOString() };
      }
      return next;
    });
  };

  const value = useMemo(
    () => ({
      cats: seededCats,
      selectedCatId,
      setSelectedCatId,
      foods,
      snacks,
      events,
      plans,
      chooseDefaultFood,
      addEvent,
      updateLatestNote
    }),
    [selectedCatId, foods, snacks, events, plans]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('Store missing');
  return ctx;
};
