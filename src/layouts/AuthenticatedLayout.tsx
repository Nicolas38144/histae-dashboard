import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

const AuthenticatedLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </>
  );
};

export default AuthenticatedLayout;
