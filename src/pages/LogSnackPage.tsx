import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/mockStore';

export const LogSnackPage = () => {
  const navigate = useNavigate();
  const { snacks, selectedCatId, addEvent } = useStore();
  const [itemId, setItemId] = useState(snacks[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [eventAt, setEventAt] = useState(new Date().toISOString().slice(0, 16));

  return (
    <section>
      <h1>Log Snack</h1>
      <label>Snack item</label>
      <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
        {snacks.map((snack) => (
          <option key={snack.id} value={snack.id}>
            {snack.name}
          </option>
        ))}
      </select>

      <label>Time</label>
      <input type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />

      <label>Note (optional)</label>
      <input value={note} onChange={(e) => setNote(e.target.value)} />

      <button
        style={{ marginTop: 12 }}
        onClick={() => {
          addEvent({
            catId: selectedCatId,
            eventType: 'snack',
            itemId,
            eventAt: new Date(eventAt).toISOString(),
            note
          });
          navigate('/');
        }}
      >
        Save snack
      </button>
    </section>
  );
};
