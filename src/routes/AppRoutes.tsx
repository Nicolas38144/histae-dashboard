import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Vibe from '../pages/Vibe';
import User from '../pages/User';
import ProtectedLayout from '../layouts/ProtectedLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Message from '../pages/Message';

const AppRoutes = ({ toggleTheme, mode }: { toggleTheme: () => void; mode: 'light' | 'dark' }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout toggleTheme={toggleTheme} mode={mode} />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user" element={<User />} />
          <Route path="/vibe" element={<Vibe />} />
          <Route path="/message" element={<Message />} />
          <Route path="*" element={<div>404 - Page non trouvée</div>} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
