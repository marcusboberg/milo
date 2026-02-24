import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import type { Cat, DailyPlan, FeedingEvent, FoodItem, PortionSlot } from '../types';
import { db } from './firebase';
import { getStockholmDate } from './time';
import { latestEventForCat } from './timeline';
import { useAuth } from './useAuth';

interface Store {
  cats: Cat[];
  selectedCatId: string;
  setSelectedCatId: (catId: string) => void;
  foods: FoodItem[];
  snacks: FoodItem[];
  events: FeedingEvent[];
  plans: DailyPlan[];
  addFood: (input: { name: string; imageUrl?: string }) => { ok: boolean; reason?: string; foodId?: string };
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
  }) => Promise<{ ok: boolean; reason?: string }>;
  updateLatestNote: (catId: string, note: string) => void;
}

const now = new Date().toISOString();
const seededCats: Cat[] = [{ id: 'cat_milo', name: 'Milo', createdAt: now }];
const seededFoods: FoodItem[] = [
  { id: 'food_kalkon', householdId: 'hh1', kind: 'food', name: 'Kalkon', imageUrl: '/foods/Bozita-cat-pouch-turkey-chunks-in-jelly.jpg', active: true, createdAt: now },
  { id: 'food_kyckling', householdId: 'hh1', kind: 'food', name: 'Kyckling', imageUrl: '/foods/Bozita-cat-pouch-extra-chicken-chunks-in-sauce.jpg', active: true, createdAt: now },
  { id: 'food_not', householdId: 'hh1', kind: 'food', name: 'Nöt', imageUrl: '/foods/Bozita_Beef-in-Sauce_85g_Cat_Pouch.jpg', active: true, createdAt: now },
  { id: 'food_ren', householdId: 'hh1', kind: 'food', name: 'Ren', imageUrl: '/foods/Bozita-cat-pouch-reindeer-chunks-in-sauce.jpg', active: true, createdAt: now },
  { id: 'snack_treat', householdId: 'hh1', kind: 'snack', name: 'Dental treat', active: true, createdAt: now }
];
const catalogStorageKey = 'milo.catalog.v1';

const sharedHouseholdId = (() => {
  const candidate = import.meta.env.VITE_HOUSEHOLD_ID;
  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
  return trimmed.length > 0 ? trimmed : 'hh_milo';
})();
const isEventType = (value: unknown): value is FeedingEvent['eventType'] => value === 'portion' || value === 'snack';
const isPortionSlot = (value: unknown): value is PortionSlot => value === 'portion1' || value === 'portion2' || value === 'portion3' || value === 'extra';
const isPlannedSlot = (value: unknown): value is keyof DailyPlan['plannedSlots'] => value === 'portion1' || value === 'portion2' || value === 'portion3';
const isAmountChip = (value: unknown): value is FeedingEvent['amountChip'] => value === '1/4' || value === '1/3' || value === '1/2' || value === '1/1';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const formatFirestoreError = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message).replace(/^Firebase:\s*/i, '').trim();
  }
  return fallback;
};

const isFoodKind = (value: unknown): value is FoodItem['kind'] => value === 'food' || value === 'snack';

const isFoodItem = (value: unknown): value is FoodItem => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FoodItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.householdId === 'string' &&
    isFoodKind(candidate.kind) &&
    typeof candidate.name === 'string' &&
    typeof candidate.active === 'boolean' &&
    typeof candidate.createdAt === 'string' &&
    (candidate.imageUrl === undefined || typeof candidate.imageUrl === 'string')
  );
};

const seedById = new Map(seededFoods.map((item) => [item.id, item]));

const normalizeCatalog = (items: FoodItem[]): FoodItem[] => {
  const extras = items.filter((item) => !seedById.has(item.id));
  const seededNormalized = seededFoods.map((seed) => {
    const existing = items.find((item) => item.id === seed.id);
    if (!existing) {
      return seed;
    }
    return {
      ...existing,
      householdId: seed.householdId,
      kind: seed.kind,
      name: seed.name,
      imageUrl: seed.imageUrl
    };
  });
  return [...seededNormalized, ...extras];
};

const loadCatalog = (): FoodItem[] => {
  if (typeof window === 'undefined') return seededFoods;
  try {
    const raw = window.localStorage.getItem(catalogStorageKey);
    if (!raw) return seededFoods;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seededFoods;
    const validItems = parsed.filter(isFoodItem);
    return validItems.length > 0 ? normalizeCatalog(validItems) : seededFoods;
  } catch {
    return seededFoods;
  }
};

const toDailyPlan = (id: string, value: unknown, fallbackHouseholdId: string): DailyPlan | null => {
  const data = asRecord(value);
  if (!data) return null;
  if (typeof data.catId !== 'string' || typeof data.stockholmDate !== 'string') return null;

  const plannedSlotsRecord = asRecord(data.plannedSlots);
  const plannedSlots: DailyPlan['plannedSlots'] = {};
  if (plannedSlotsRecord) {
    for (const [key, slotFoodId] of Object.entries(plannedSlotsRecord)) {
      if (isPlannedSlot(key) && typeof slotFoodId === 'string') {
        plannedSlots[key] = slotFoodId;
      }
    }
  }

  return {
    id,
    householdId: typeof data.householdId === 'string' ? data.householdId : fallbackHouseholdId,
    catId: data.catId,
    stockholmDate: data.stockholmDate,
    defaultFoodId: typeof data.defaultFoodId === 'string' ? data.defaultFoodId : undefined,
    defaultFoodName: typeof data.defaultFoodName === 'string' ? data.defaultFoodName : undefined,
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : undefined,
    plannedSlots
  };
};

const toFeedingEvent = (id: string, value: unknown, fallbackHouseholdId: string): FeedingEvent | null => {
  const data = asRecord(value);
  if (!data) return null;
  if (!isEventType(data.eventType)) return null;
  if (typeof data.catId !== 'string' || typeof data.itemId !== 'string' || typeof data.itemName !== 'string' || typeof data.eventAt !== 'string') return null;

  return {
    id,
    householdId: typeof data.householdId === 'string' ? data.householdId : fallbackHouseholdId,
    catId: data.catId,
    eventType: data.eventType,
    slot: isPortionSlot(data.slot) ? data.slot : undefined,
    itemId: data.itemId,
    itemName: data.itemName,
    amountChip: isAmountChip(data.amountChip) ? data.amountChip : undefined,
    amountText: typeof data.amountText === 'string' ? data.amountText : undefined,
    note: typeof data.note === 'string' ? data.note : undefined,
    eventAt: data.eventAt,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : data.eventAt,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : 'unknown',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined
  };
};

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [selectedCatId, setSelectedCatId] = useState(seededCats[0].id);
  const [catalog, setCatalog] = useState<FoodItem[]>(() => loadCatalog());
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [events, setEvents] = useState<FeedingEvent[]>([]);
  const householdId = useMemo(() => (user ? sharedHouseholdId : null), [user]);
  const foods = useMemo(() => catalog.filter((item) => item.kind === 'food' && item.active), [catalog]);
  const snacks = useMemo(() => catalog.filter((item) => item.kind === 'snack' && item.active), [catalog]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(catalogStorageKey, JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    let isActive = true;
    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribePlans: (() => void) | null = null;

    if (!user || !householdId) {
      return () => {
        isActive = false;
        unsubscribeEvents?.();
        unsubscribePlans?.();
      };
    }

    const bootstrap = async () => {
      const joinedAt = new Date().toISOString();
      const householdRef = doc(db, 'households', householdId);
      const memberRef = doc(db, 'households', householdId, 'members', user.uid);

      try {
        await setDoc(
          householdRef,
          {
            createdBy: user.uid,
            createdAt: joinedAt
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('Could not update household doc, continuing with member bootstrap.', error);
      }

      try {
        await setDoc(
          memberRef,
          {
            uid: user.uid,
            email: user.email ?? '',
            joinedAt
          },
          { merge: true }
        );

        if (!isActive) return;

        const eventsQuery = query(collection(db, 'households', householdId, 'events'), orderBy('eventAt', 'desc'));
        const plansQuery = query(collection(db, 'households', householdId, 'dailyPlans'), orderBy('stockholmDate', 'desc'));

        unsubscribeEvents = onSnapshot(
          eventsQuery,
          (snapshot) => {
            const nextEvents = snapshot.docs
              .map((snap) => toFeedingEvent(snap.id, snap.data(), householdId))
              .filter((event): event is FeedingEvent => event !== null);
            setEvents(nextEvents);
          },
          (error) => {
            console.error('Failed to subscribe to events.', error);
            setEvents([]);
          }
        );

        unsubscribePlans = onSnapshot(
          plansQuery,
          (snapshot) => {
            const nextPlans = snapshot.docs
              .map((snap) => toDailyPlan(snap.id, snap.data(), householdId))
              .filter((plan): plan is DailyPlan => plan !== null);
            setPlans(nextPlans);
          },
          (error) => {
            console.error('Failed to subscribe to daily plans.', error);
            setPlans([]);
          }
        );
      } catch (error) {
        console.error('Failed to bootstrap household membership.', error);
        if (!isActive) return;
        setPlans([]);
        setEvents([]);
      }
    };

    void bootstrap();

    return () => {
      isActive = false;
      unsubscribeEvents?.();
      unsubscribePlans?.();
    };
  }, [user, householdId]);

  const addFood: Store['addFood'] = useCallback(
    ({ name, imageUrl }) => {
      const trimmedName = name.trim();
      const normalizedName = trimmedName.toLocaleLowerCase();

      if (!trimmedName) {
        return { ok: false, reason: 'Food name is required.' };
      }

      const existing = foods.some((item) => item.name.toLocaleLowerCase() === normalizedName);
      if (existing) {
        return { ok: false, reason: 'Food already exists.' };
      }

      const id = `food_${crypto.randomUUID()}`;
      const newFood: FoodItem = {
        id,
        householdId: householdId ?? 'hh1',
        kind: 'food',
        name: trimmedName,
        imageUrl: imageUrl?.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString()
      };

      setCatalog((prev) => [...prev, newFood]);
      return { ok: true, foodId: id };
    },
    [foods, householdId]
  );

  const chooseDefaultFood = useCallback(
    (catId: string, foodId: string) => {
      const food = foods.find((f) => f.id === foodId);
      if (!food) return;

      const stockholmDate = getStockholmDate();
      const todayId = `${catId}_${stockholmDate}`;
      const existingPlan = plans.find((plan) => plan.id === todayId);
      const startedAt = existingPlan?.startedAt ?? new Date().toISOString();
      const planHouseholdId = householdId ?? existingPlan?.householdId ?? 'hh1';

      setPlans((prev) => {
        const existing = prev.find((p) => p.id === todayId);
        if (existing) {
          return prev.map((p) =>
            p.id === todayId ? { ...p, defaultFoodId: foodId, defaultFoodName: food.name, startedAt: p.startedAt ?? startedAt } : p
          );
        }
        return [
          ...prev,
          {
            id: todayId,
            householdId: planHouseholdId,
            catId,
            stockholmDate,
            defaultFoodId: foodId,
            defaultFoodName: food.name,
            startedAt,
            plannedSlots: {}
          }
        ];
      });

      if (!user || !householdId) return;

      void setDoc(
        doc(db, 'households', householdId, 'dailyPlans', todayId),
        {
          householdId,
          catId,
          stockholmDate,
          defaultFoodId: foodId,
          defaultFoodName: food.name,
          startedAt,
          plannedSlots: existingPlan?.plannedSlots ?? {}
        },
        { merge: true }
      ).catch((error) => {
        console.error('Failed to save default food.', error);
      });
    },
    [foods, plans, user, householdId]
  );

  const addEvent: Store['addEvent'] = useCallback(
    async (input) => {
      if (!user || !householdId) {
        return { ok: false, reason: 'Log in to save meals.' };
      }

      const item = [...foods, ...snacks].find((f) => f.id === input.itemId);
      if (!item) {
        return { ok: false, reason: 'Select a valid food before saving.' };
      }

      const createdAt = new Date().toISOString();
      const payload: Record<string, unknown> = {
        householdId,
        catId: input.catId,
        eventType: input.eventType,
        itemId: input.itemId,
        itemName: item.name,
        eventAt: input.eventAt,
        createdAt,
        createdBy: user.uid
      };

      if (input.slot) payload.slot = input.slot;
      if (input.amountChip) payload.amountChip = input.amountChip;

      const amountText = input.amountText?.trim();
      if (amountText) payload.amountText = amountText;

      const note = input.note?.trim();
      if (note) payload.note = note;

      try {
        await addDoc(collection(db, 'households', householdId, 'events'), payload);
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: formatFirestoreError(error, 'Could not save meal. Try again.') };
      }
    },
    [foods, snacks, user, householdId]
  );

  const updateLatestNote = useCallback(
    (catId: string, note: string) => {
      const latest = latestEventForCat(events, catId);
      if (!latest) return;

      const trimmedNote = note.trim();
      const updatedAt = new Date().toISOString();

      setEvents((prev) => {
        const next = [...prev];
        const idx = next.findIndex((event) => event.id === latest.id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            note: trimmedNote || undefined,
            updatedAt
          };
        }
        return next;
      });

      if (!user || !householdId) return;

      void updateDoc(doc(db, 'households', householdId, 'events', latest.id), {
        note: trimmedNote,
        updatedAt
      }).catch((error) => {
        console.error('Failed to update latest note.', error);
      });
    },
    [events, user, householdId]
  );

  const value = useMemo(
    () => ({
      cats: seededCats,
      selectedCatId,
      setSelectedCatId,
      foods,
      snacks,
      events,
      plans,
      addFood,
      chooseDefaultFood,
      addEvent,
      updateLatestNote
    }),
    [selectedCatId, foods, snacks, events, plans, addFood, chooseDefaultFood, addEvent, updateLatestNote]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('Store missing');
  return ctx;
};
