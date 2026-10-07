import { CssBaseline, ThemeProvider } from '@mui/material';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import type { AdminSession } from '../../src/api/types';
import { NotifierProvider } from '../../src/components/Notifier';
import { getTheme } from '../../src/theme';
import { adminSession } from '../fixtures';

type DashboardRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  routePath?: string;
  session?: AdminSession;
};

export function renderDashboard(ui: ReactElement, options: DashboardRenderOptions = {}) {
  const { route = '/', routePath, session = adminSession, ...renderOptions } = options;
  return render(
    <ThemeProvider theme={getTheme('light')}>
      <CssBaseline />
      <NotifierProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes><Route element={<Outlet context={session} />}><Route path={routePath ?? route} element={ui} /></Route></Routes>
        </MemoryRouter>
      </NotifierProvider>
    </ThemeProvider>,
    renderOptions,
  );
}
