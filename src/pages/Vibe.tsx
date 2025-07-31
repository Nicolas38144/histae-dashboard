import { useEffect, useState } from 'react';
import { getVibes } from '../services/vibe';
import type { IVibe } from '../types/vibe.interface';

const Vibe = () => {
  const [vibes, setVibes] = useState<IVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVibes = async () => {
    try {
      const data = await getVibes();
      console.log("Raw vibes response:", data);
      setVibes(data);
    } catch (err) {
      setError('Erreur lors du chargement des vibes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVibes();
  }, []);

  return (
    <div>
      <h2>Liste des Vibes</h2>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul>
          {vibes.map((vibe) => (
            <li key={vibe.id}>
              {vibe.vibe}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Vibe;