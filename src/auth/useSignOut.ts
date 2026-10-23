import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  return async () => {
    const request = logout();
    navigate('/login', { replace: true });
    try {
      await request;
    } catch {
      // The shared logout status keeps the warning visible across redirects.
    }
  };
}
