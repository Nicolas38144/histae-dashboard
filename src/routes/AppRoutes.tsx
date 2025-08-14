import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Publication from '../pages/Publication';
import Vibe from '../pages/Vibe';
import User from '../pages/User';
import DetailsUser from '../pages/DetailsUser';
import ProtectedLayout from '../layouts/ProtectedLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Match from '../pages/Match';
import { t } from 'i18next';

const AppRoutes = ({ toggleTheme, mode }: { toggleTheme: () => void; mode: 'light' | 'dark' }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout toggleTheme={toggleTheme} mode={mode} />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/users" element={<User />} />
          <Route path="/users/:id" element={<DetailsUser />} />
          <Route path="/publications" element={<Publication />} />
          <Route path="/vibes" element={<Vibe />} />
          <Route path="/matches" element={<Match />} />
          <Route path="*" element={<div>{t("pageNotFound")}</div>} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
