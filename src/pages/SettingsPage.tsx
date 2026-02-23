import { useStore } from '../lib/mockStore';

export const SettingsPage = () => {
  const { cats } = useStore();

  return (
    <section>
      <h1>Settings</h1>
      <h3>Cats</h3>
      <ul>
        {cats.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
      <button>Add your first cat</button>

      <h3>Members</h3>
      <p>Invite via email link sign-in (Firebase Auth).</p>

      <h3>Foods & Snacks</h3>
      <p>Manage catalog items and photos.</p>
    </section>
  );
};
