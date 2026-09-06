import { CssBaseline, ThemeProvider } from '@mui/material';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotifierProvider } from '../../src/components/Notifier';
import { getTheme } from '../../src/theme';

type DashboardRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  routePath?: string;
};

export function renderDashboard(ui: ReactElement, options: DashboardRenderOptions = {}) {
  const { route = '/', routePath, ...renderOptions } = options;
  return render(
    <ThemeProvider theme={getTheme('light')}>
      <CssBaseline />
      <NotifierProvider>
        <MemoryRouter initialEntries={[route]}>
          {routePath ? <Routes><Route path={routePath} element={ui} /></Routes> : ui}
        </MemoryRouter>
      </NotifierProvider>
    </ThemeProvider>,
    renderOptions,
  );
}
