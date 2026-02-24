import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/mockStore';

export const ChooseFoodPage = () => {
  const navigate = useNavigate();
  const { foods, selectedCatId, chooseDefaultFood, addFood } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submitNewFood = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = addFood({ name: foodName, imageUrl });
    if (!result.ok) {
      setFormError(result.reason ?? 'Could not add food.');
      return;
    }

    if (result.foodId) {
      chooseDefaultFood(selectedCatId, result.foodId);
    }

    setFoodName('');
    setImageUrl('');
    setShowAddForm(false);
    navigate('/log-portion?slot=portion1');
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Choose today&apos;s default food</h1>
        <p className="page-subtitle">Pick one base meal and continue directly to Portion 1.</p>
      </header>

      <article className="card choose-hero">
        <div className="choose-hero-top">
          <p className="kicker">Daily default</p>
          <span className="pill-badge">{foods.length} options</span>
        </div>
        <p className="muted-text">The selected food becomes today&apos;s default for all portion logs.</p>
      </article>

      <div className="food-grid">
        {foods.map((food) => (
          <button
            type="button"
            key={food.id}
            className="food-card"
            onClick={() => {
              chooseDefaultFood(selectedCatId, food.id);
              navigate('/log-portion?slot=portion1');
            }}
          >
            {food.imageUrl ? <img src={food.imageUrl} alt={food.name} className="food-image" loading="lazy" /> : null}
            <span className="sr-only">{food.name}</span>
          </button>
        ))}
        <button type="button" className="food-card add-food-tile" onClick={() => setShowAddForm((prev) => !prev)}>
          <span className="add-food-symbol">+</span>
          <span>Add new food</span>
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={submitNewFood} className="card form-card choose-form">
          <h3 className="section-title">Register food</h3>

          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={foodName} onChange={(event) => setFoodName(event.target.value)} placeholder="e.g. Kalkon" required />
          </label>

          <label className="field">
            <span className="field-label">Image URL (optional)</span>
            <input
              className="input"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>

          {formError ? <p className="error-text">{formError}</p> : null}

          <div className="button-row">
            <button type="submit" className="btn btn-primary btn-sm">
              Save food
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
};
