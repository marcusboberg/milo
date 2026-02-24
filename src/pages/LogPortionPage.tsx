import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PortionSlot } from '../types';
import { useStore } from '../lib/mockStore';
import { formatLocalDateTimeInput, getStockholmDate, toIsoFromDateTimeLocal } from '../lib/time';

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
  const [eventAt, setEventAt] = useState(() => formatLocalDateTimeInput());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const todayPlan = plans.find((p) => p.catId === selectedCatId && p.stockholmDate === getStockholmDate());
  const [foodId, setFoodId] = useState(todayPlan?.defaultFoodId ?? foods[0]?.id ?? '');

  const selectedFood = useMemo(() => foods.find((f) => f.id === foodId), [foods, foodId]);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Log Portion</h1>
        <p className="page-subtitle">Capture exactly what Milo ate.</p>
      </header>

      <article className="card form-card">
        <label className="field">
          <span className="field-label">Portion slot</span>
          <select className="select" value={slot} onChange={(e) => setSlot(e.target.value as PortionSlot)}>
            <option value="portion1">Portion 1</option>
            <option value="portion2">Portion 2</option>
            <option value="portion3">Portion 3</option>
            <option value="extra">Extra portion</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Food</span>
          <select className="select" value={foodId} onChange={(e) => setFoodId(e.target.value)}>
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Amount</span>
          <div className="chip-row">
            {chips.map((chip) => (
              <button
                type="button"
                key={chip}
                onClick={() => setAmountChip(chip)}
                className={`btn btn-chip${chip === amountChip ? ' btn-chip-active' : ''}`}
              >
                {chip}
              </button>
            ))}
          </div>
          <input className="input" value={amountText} onChange={(e) => setAmountText(e.target.value)} placeholder="30g, small, a bit more" />
        </label>

        <label className="field">
          <span className="field-label">Time</span>
          <input className="input" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        </label>

        <div className="button-row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving || foods.length === 0}
            onClick={() => {
              setSaveError(null);
              const fallbackFoodId = selectedFood?.id ?? foods[0]?.id;
              if (!fallbackFoodId) {
                setSaveError('Add food first, then try again.');
                return;
              }

              void (async () => {
                setSaving(true);
                const result = await addEvent({
                  catId: selectedCatId,
                  eventType: 'portion',
                  slot,
                  itemId: fallbackFoodId,
                  amountChip,
                  amountText,
                  eventAt: toIsoFromDateTimeLocal(eventAt)
                });
                setSaving(false);

                if (!result.ok) {
                  setSaveError(result.reason ?? 'Could not save portion.');
                  return;
                }

                navigate('/');
              })();
            }}
          >
            {saving ? 'Saving...' : 'Save portion'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
        {saveError ? <p className="error-text">{saveError}</p> : null}
      </article>
    </section>
  );
};
