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
      : cta.kind === 'logPortion1'
        ? '/log-portion?slot=portion1'
      : cta.kind === 'logPortion2'
        ? '/log-portion?slot=portion2'
        : cta.kind === 'logPortion3'
          ? '/log-portion?slot=portion3'
          : null;

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Today</h1>
        <p className="page-subtitle">{todayDate}</p>
      </header>

      {yesterdayModal && (
        <article className="card alert-card">
          <h3 className="section-title">Yesterday is incomplete</h3>
          <div className="button-row">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/history?day=yesterday')}>
              Finish yesterday
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/choose-food')}>
              Start fresh today
            </button>
          </div>
        </article>
      )}

      <article className="card hero-card">
        <p className="kicker">Current status</p>
        <h2 className="hero-title">{latest ? `${formatSince(latest.eventAt)} since last meal` : 'No meals logged yet'}</h2>
        {latest && (
          <p className="hero-meta">
            {latest.eventType === 'portion' ? `Portion ${latest.slot}` : 'Snack'} · {latest.itemName} · {latest.amountChip ?? latest.amountText ?? 'n/a'} · {formatStockholmDateTime(latest.eventAt)}
          </p>
        )}
        {plannedComplete && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/log-portion?slot=extra')}
          >
            Log extra portion
          </button>
        )}
        <label className="field">
          <span className="field-label">Any comments on latest meal?</span>
          <input className="input" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="e.g. ate quickly" />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            updateLatestNote(selectedCatId, noteDraft);
            setNoteDraft('');
          }}
        >
          Save comment
        </button>
      </article>

      <section className="card">
        <h3 className="section-title">Recent timeline</h3>
        <ul className="timeline-list">
          {recentTimeline.map((event) => (
            <li key={event.id} className="timeline-item">
              <p className="timeline-title">{event.eventType === 'portion' ? `Portion ${event.slot}` : 'Snack'}</p>
              <p className="timeline-meta">{event.itemName}</p>
              <p className="timeline-meta">{event.amountChip ?? event.amountText ?? '-'}</p>
              <p className="timeline-meta">{formatStockholmDateTime(event.eventAt)}</p>
            </li>
          ))}
          {recentTimeline.length === 0 && <li className="empty-state">No recent events yet.</li>}
        </ul>
      </section>

      {cta.kind !== 'none' && (
        <button type="button" className="btn btn-primary btn-block" onClick={() => ctaTarget && navigate(ctaTarget)}>
          {cta.label}
        </button>
      )}

      <div className="quick-links">
        <Link className="quick-link quick-link-primary" to="/log-portion?slot=portion1">
          Log Portion
        </Link>
        <Link className="quick-link" to="/log-snack">
          Log Snack
        </Link>
      </div>
    </section>
  );
};
