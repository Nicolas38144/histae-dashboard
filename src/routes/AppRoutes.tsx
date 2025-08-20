import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Post from '../pages/Post';
import Vibe from '../pages/Vibe';
import User from '../pages/User';
import DetailsUser from '../pages/DetailsUser';
import PostReport from '../pages/PostReport'
import Match from '../pages/Match';
import ProtectedLayout from '../layouts/ProtectedLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import { t } from 'i18next';
import SubscriptionPlan from '../pages/SubscritionPlan';

const AppRoutes = ({ toggleTheme, mode }: { toggleTheme: () => void; mode: 'light' | 'dark' }) => (
  <BrowserRouter>
    <ScrollToTop />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout toggleTheme={toggleTheme} mode={mode} />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/users" element={<User />} />
          <Route path="/users/:id" element={<DetailsUser />} />
          <Route path="/vibes" element={<Vibe />} />
          <Route path="/posts" element={<Post />} />
          <Route path="/post-reports" element={<PostReport />} />
          <Route path="/matches" element={<Match />} />
          <Route path="/subscription-plans" element={<SubscriptionPlan />} />
          <Route path="*" element={<div>{t("pageNotFound")}</div>} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
