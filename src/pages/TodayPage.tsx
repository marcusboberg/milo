import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useStore } from '../lib/mockStore';
import { buildTodayCta, shouldShowYesterdayModal } from '../lib/todayStateMachine';
import { formatSince, formatStockholmDateTime, getRelativeStockholmDate, getStockholmDate } from '../lib/time';
import { sortEventsByTimestampDesc } from '../lib/timeline';

export const TodayPage = () => {
  const navigate = useNavigate();
  const { selectedCatId, events, plans, updateLatestNote } = useStore();
  const [noteDraft, setNoteDraft] = useState('');

  const todayDate = getStockholmDate();
  const yesterdayDate = getRelativeStockholmDate(-1);
  const todayPlan = plans.find((p) => p.catId === selectedCatId && p.stockholmDate === todayDate);
  const yesterdayPlan = plans.find((p) => p.catId === selectedCatId && p.stockholmDate === yesterdayDate);
  const catEvents = useMemo(() => sortEventsByTimestampDesc(events.filter((e) => e.catId === selectedCatId)), [events, selectedCatId]);
  const todayEvents = catEvents.filter((e) => getStockholmDate(new Date(e.eventAt)) === todayDate);
  const yesterdayEvents = catEvents.filter((e) => getStockholmDate(new Date(e.eventAt)) === yesterdayDate);
  const plannedComplete = todayEvents.some((event) => event.slot === 'portion3');

  const cta = buildTodayCta(todayPlan, todayEvents);
  const latest = catEvents[0];
  const recentTimeline = catEvents.slice(0, 8);

  const yesterdayHasData = Boolean(yesterdayPlan) || yesterdayEvents.some((event) => event.eventType === 'portion');
  const yesterdayHasPortion1 = yesterdayEvents.some((event) => event.slot === 'portion1');
  const yesterdayHasPortion2 = yesterdayEvents.some((event) => event.slot === 'portion2');
  const yesterdayHasPortion3 = yesterdayEvents.some((event) => event.slot === 'portion3');
  const yesterdayMissing = yesterdayHasData && (!yesterdayHasPortion1 || !yesterdayHasPortion2 || !yesterdayHasPortion3);

  const yesterdayModal = shouldShowYesterdayModal({
    yesterdayMissing,
    todayStarted: Boolean(todayPlan?.startedAt)
  });

  const ctaTarget =
    cta.kind === 'chooseFood'
      ? '/choose-food'
      : cta.kind === 'logPortion2'
        ? '/log-portion?slot=portion2'
        : cta.kind === 'logPortion3'
          ? '/log-portion?slot=portion3'
          : null;

  return (
    <section>
      <h1>Today</h1>
      {yesterdayModal && (
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <h3>Yesterday is incomplete</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/history?day=yesterday')}>Finish yesterday</button>
            <button onClick={() => navigate('/choose-food')}>Start fresh today</button>
          </div>
        </div>
      )}

      <article style={{ background: '#ecfeff', borderRadius: 12, padding: 12 }}>
        <h2>{latest ? `${formatSince(latest.eventAt)} since last meal` : 'No meals logged yet'}</h2>
        {latest && (
          <p>
            {latest.eventType === 'portion' ? `Portion ${latest.slot}` : 'Snack'} · {latest.itemName} · {latest.amountChip ?? latest.amountText ?? 'n/a'} · {formatStockholmDateTime(latest.eventAt)}
          </p>
        )}
        {plannedComplete && (
          <button
            style={{ marginTop: 8, padding: '8px 10px', border: '1px solid #9ca3af', borderRadius: 8, background: '#fff', color: '#374151' }}
            onClick={() => navigate('/log-portion?slot=extra')}
          >
            Log extra portion
          </button>
        )}
        <label>
          Any comments on latest meal?
          <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="e.g. ate quickly" style={{ display: 'block', width: '100%', marginTop: 6 }} />
        </label>
        <button
          style={{ marginTop: 8 }}
          onClick={() => {
            updateLatestNote(selectedCatId, noteDraft);
            setNoteDraft('');
          }}
        >
          Save comment
        </button>
      </article>

      <section style={{ marginTop: 12 }}>
        <h3>Recent timeline</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentTimeline.map((event) => (
            <li key={event.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
              <strong>{event.eventType === 'portion' ? `Portion ${event.slot}` : 'Snack'}</strong>
              <div>{event.itemName}</div>
              <div>{event.amountChip ?? event.amountText ?? '-'}</div>
              <div>{formatStockholmDateTime(event.eventAt)}</div>
            </li>
          ))}
          {recentTimeline.length === 0 && <li style={{ color: '#6b7280' }}>No recent events yet.</li>}
        </ul>
      </section>

      <div style={{ marginTop: 12 }}>
        {cta.kind !== 'none' && (
          <button style={{ width: '100%', padding: 14, background: '#22c55e', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 700 }} onClick={() => ctaTarget && navigate(ctaTarget)}>
            {cta.label}
          </button>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <Link to="/log-portion">Log Portion</Link>
        <Link to="/log-snack">Log Snack</Link>
        <Link to="/history">Open History</Link>
      </div>
    </section>
  );
};
