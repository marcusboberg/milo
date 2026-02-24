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
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">History timeline</h1>
        <p className="page-subtitle">Filter events by day and type.</p>
      </header>

      <section className="card form-card">
        <label className="field">
          <span className="field-label">Day</span>
          <input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>

        <div className="filter-row">
          <label className="check-row">
            <input type="checkbox" checked={showPortions} onChange={(e) => setShowPortions(e.target.checked)} />
            <span>Portions</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={showSnacks} onChange={(e) => setShowSnacks(e.target.checked)} />
            <span>Snacks</span>
          </label>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Events</h3>
        <ul className="timeline-list">
          {filtered.map((event) => (
            <li key={event.id} className="timeline-item">
              <p className="timeline-title">{event.eventType === 'portion' ? `Portion ${event.slot}` : 'Snack'}</p>
              <p className="timeline-meta">{event.itemName}</p>
              <p className="timeline-meta">{event.amountChip ?? event.amountText ?? '-'}</p>
              <p className="timeline-meta">{formatStockholmDateTime(event.eventAt)}</p>
              {event.note && <p className="timeline-meta">Note: {event.note}</p>}
              <div className="button-row">
                <button type="button" className="btn btn-ghost btn-sm">
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && <p className="empty-state">No timeline events for the selected day/filter.</p>}
      </section>
    </section>
  );
};
