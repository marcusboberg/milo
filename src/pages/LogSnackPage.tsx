import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/mockStore';
import { formatLocalDateTimeInput, toIsoFromDateTimeLocal } from '../lib/time';

export const LogSnackPage = () => {
  const navigate = useNavigate();
  const { snacks, selectedCatId, addEvent } = useStore();
  const [itemId, setItemId] = useState(snacks[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [eventAt, setEventAt] = useState(() => formatLocalDateTimeInput());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Log Snack</h1>
        <p className="page-subtitle">Track bonus snacks between meals.</p>
      </header>

      <article className="card form-card">
        <label className="field">
          <span className="field-label">Snack item</span>
          <select className="select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {snacks.map((snack) => (
              <option key={snack.id} value={snack.id}>
                {snack.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Time</span>
          <input className="input" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Note (optional)</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="button-row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving || snacks.length === 0}
            onClick={() => {
              setSaveError(null);
              const snackId = itemId || snacks[0]?.id;
              if (!snackId) {
                setSaveError('Add a snack item first, then try again.');
                return;
              }

              void (async () => {
                setSaving(true);
                const result = await addEvent({
                  catId: selectedCatId,
                  eventType: 'snack',
                  itemId: snackId,
                  eventAt: toIsoFromDateTimeLocal(eventAt),
                  note
                });
                setSaving(false);

                if (!result.ok) {
                  setSaveError(result.reason ?? 'Could not save snack.');
                  return;
                }

                navigate('/');
              })();
            }}
          >
            {saving ? 'Saving...' : 'Save snack'}
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
