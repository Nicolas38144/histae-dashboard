import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login } from '../services/auth.service';

const Login = () => {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) return alert('Numéro requis');

    const success = await login(phone);

    if (success) {
      navigate('/home');
    } else {
      alert('Échec de la connexion');
    }
  };

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone"
          required
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
};

export default Login;
