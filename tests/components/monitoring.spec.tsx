import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Monitoring from '../../src/pages/Monitoring';
import type { AdminSession } from '../../src/api/types';

function show(role: AdminSession['role']) {
  const session: AdminSession = { user_id: 'fixture', role, authenticated_at: '2026-10-13T00:00:00Z', expires_at: '2026-10-14T00:00:00Z' };
  render(<MemoryRouter><Routes><Route element={<Outlet context={session} />}><Route path="/" element={<Monitoring />} /></Route></Routes></MemoryRouter>);
}

describe('Monitoring', () => {
  it('opens the three tools on the same origin for the superadmin', () => {
    show('superadmin');
    for (const tool of ['Grafana', 'Prometheus', 'Alertmanager']) {
      const link = screen.getByRole('link', { name: `Ouvrir ${tool}` });
      expect(link).toHaveAttribute('href', `/monitoring/${tool.toLowerCase()}/`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
  it('refuses a direct visit by a regular admin', () => {
    show('admin');
    expect(screen.getByRole('alert')).toHaveTextContent('réservée au superadministrateur');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
