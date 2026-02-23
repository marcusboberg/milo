import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/mockStore';
import { formatStockholmDateTime, getRelativeStockholmDate, getStockholmDate } from '../lib/time';
import { sortEventsByTimestampDesc } from '../lib/timeline';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const resolveDayParam = (value: string | null): string => {
  if (value === 'yesterday') {
    return getRelativeStockholmDate(-1);
  }
  if (value === 'today' || value == null) {
    return getStockholmDate();
  }
  return datePattern.test(value) ? value : getStockholmDate();
};

export const HistoryPage = () => {
  const [searchParams] = useSearchParams();
  const { events, selectedCatId } = useStore();
  const [day, setDay] = useState(() => resolveDayParam(searchParams.get('day')));
  const [showPortions, setShowPortions] = useState(true);
  const [showSnacks, setShowSnacks] = useState(true);

  useEffect(() => {
    setDay(resolveDayParam(searchParams.get('day')));
  }, [searchParams]);

  const filtered = useMemo(() => {
    const merged = events.filter((event) => {
      if (event.catId !== selectedCatId) return false;
      if (getStockholmDate(new Date(event.eventAt)) !== day) return false;
      if (event.eventType === 'portion' && !showPortions) return false;
      if (event.eventType === 'snack' && !showSnacks) return false;
      return true;
    });

    return sortEventsByTimestampDesc(merged);
  }, [events, selectedCatId, day, showPortions, showSnacks]);

  return (
    <section>
      <h1>History timeline</h1>
      <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      <div style={{ display: 'flex', gap: 12, margin: '10px 0' }}>
        <label>
          <input type="checkbox" checked={showPortions} onChange={(e) => setShowPortions(e.target.checked)} /> Portions
        </label>
        <label>
          <input type="checkbox" checked={showSnacks} onChange={(e) => setShowSnacks(e.target.checked)} /> Snacks
        </label>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filtered.map((event) => (
          <li key={event.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 0' }}>
            <strong>{event.eventType === 'portion' ? `Portion ${event.slot}` : 'Snack'}</strong>
            <div>{event.itemName}</div>
            <div>{event.amountChip ?? event.amountText ?? '-'}</div>
            <div>{formatStockholmDateTime(event.eventAt)}</div>
            {event.note && <div>Note: {event.note}</div>}
            <button>Edit</button> <button>Delete</button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p style={{ color: '#6b7280' }}>No timeline events for the selected day/filter.</p>}
    </section>
  );
};
