import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: 10, padding: 10, background: '#eee' }}>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/profile">Profile</Link>
      <Link to="/vibe">Vibe</Link>
      <button onClick={handleLogout}>Se déconnecter</button>
    </nav>
  );
};

export default Navbar;
