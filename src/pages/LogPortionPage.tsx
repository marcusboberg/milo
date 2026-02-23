import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PortionSlot } from '../types';
import { useStore } from '../lib/mockStore';
import { getStockholmDate } from '../lib/time';

const chips: Array<'1/4' | '1/3' | '1/2' | '1/1'> = ['1/4', '1/3', '1/2', '1/1'];

const isPortionSlot = (value: string | null): value is PortionSlot =>
  value === 'portion1' || value === 'portion2' || value === 'portion3' || value === 'extra';

export const LogPortionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSlot = searchParams.get('slot');

  const { foods, selectedCatId, plans, addEvent } = useStore();
  const [slot, setSlot] = useState<PortionSlot>(isPortionSlot(initialSlot) ? initialSlot : 'portion1');
  const [amountChip, setAmountChip] = useState<'1/4' | '1/3' | '1/2' | '1/1'>('1/1');
  const [amountText, setAmountText] = useState('');
  const [eventAt, setEventAt] = useState(new Date().toISOString().slice(0, 16));

  const todayPlan = plans.find((p) => p.catId === selectedCatId && p.stockholmDate === getStockholmDate());
  const [foodId, setFoodId] = useState(todayPlan?.defaultFoodId ?? foods[0]?.id ?? '');

  const selectedFood = useMemo(() => foods.find((f) => f.id === foodId), [foods, foodId]);

  return (
    <section>
      <h1>Log Portion</h1>

      <label>Portion slot</label>
      <select value={slot} onChange={(e) => setSlot(e.target.value as PortionSlot)}>
        <option value="portion1">Portion 1</option>
        <option value="portion2">Portion 2</option>
        <option value="portion3">Portion 3</option>
        <option value="extra">Extra portion</option>
      </select>

      <label>Food</label>
      <select value={foodId} onChange={(e) => setFoodId(e.target.value)}>
        {foods.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <label>Amount</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {chips.map((chip) => (
          <button key={chip} onClick={() => setAmountChip(chip)} style={{ background: chip === amountChip ? '#a7f3d0' : '#f4f4f5' }}>
            {chip}
          </button>
        ))}
      </div>
      <input value={amountText} onChange={(e) => setAmountText(e.target.value)} placeholder="30g, small, a bit more" />

      <label>Time</label>
      <input type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />

      <button
        style={{ marginTop: 12 }}
        onClick={() => {
          addEvent({
            catId: selectedCatId,
            eventType: 'portion',
            slot,
            itemId: selectedFood?.id ?? foods[0].id,
            amountChip,
            amountText,
            eventAt: new Date(eventAt).toISOString()
          });
          navigate('/');
        }}
      >
        Save portion
      </button>
    </section>
  );
};
