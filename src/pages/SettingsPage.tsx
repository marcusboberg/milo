import { Link } from 'react-router-dom';
import { useStore } from '../lib/mockStore';

export const SettingsPage = () => {
  const { cats } = useStore();

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage household setup and catalog flow.</p>
      </header>

      <section className="card">
        <h3 className="section-title">Cats</h3>
        <ul className="cat-list">
          {cats.map((cat) => (
            <li key={cat.id}>{cat.name}</li>
          ))}
        </ul>
        <button type="button" className="btn btn-outline btn-sm">
          Add your first cat
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Members</h3>
        <p className="muted-text">Use email/password sign-in (Firebase Auth).</p>
      </section>

      <section className="card">
        <h3 className="section-title">Foods & Snacks</h3>
        <p className="muted-text">Manage catalog items and photos.</p>
        <Link className="quick-link settings-link" to="/choose-food">
          Open food catalog
        </Link>
      </section>
    </section>
  );
};
