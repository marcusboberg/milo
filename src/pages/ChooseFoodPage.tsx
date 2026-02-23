import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/mockStore';

export const ChooseFoodPage = () => {
  const navigate = useNavigate();
  const { foods, selectedCatId, chooseDefaultFood } = useStore();

  return (
    <section>
      <h1>Choose today's default food</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {foods.map((food) => (
          <button
            key={food.id}
            style={{ border: '1px solid #ddd', borderRadius: 12, minHeight: 90, padding: 8 }}
            onClick={() => {
              chooseDefaultFood(selectedCatId, food.id);
              navigate('/');
            }}
          >
            {food.name}
          </button>
        ))}
        <button style={{ border: '1px dashed #aaa', borderRadius: 12 }}>+ Add new food</button>
      </div>
    </section>
  );
};
