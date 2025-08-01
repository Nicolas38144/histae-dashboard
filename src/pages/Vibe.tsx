// components/Vibe.tsx
import { useEffect } from 'react';
import { useVibeStore } from '../stores/vibe.store';

const Vibe = () => {
  const { vibes, loading, error, fetchVibes } = useVibeStore();

  useEffect(() => {
    if (vibes.length === 0) {
      fetchVibes();
    }
  }, [vibes.length, fetchVibes]);

  return (
    <div>
      <h2>Liste des Vibes</h2>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul>
          {vibes.map((vibe) => (
            <li key={vibe.id}>{vibe.vibe}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Vibe;
