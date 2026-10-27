import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContinuationCredits } from '../../src/components/ContinuationCredits';
import { adminUser } from '../fixtures';

describe('ContinuationCredits', () => {
  it('shows the API balance, reservations and separate weekly ceiling', () => {
    render(<ContinuationCredits quota={adminUser.continuation_quota!} />);
    expect(screen.getByText('Disponibles : 3')).toBeInTheDocument();
    expect(screen.getByText('Réservés : 1')).toBeInTheDocument();
    expect(screen.getByText('Continuations confirmées cette semaine : 1 sur 5')).toBeInTheDocument();
    expect(screen.getByText(/Discussion|Pendant les 24 heures/)).toBeInTheDocument();
  });
  it('shows Premium without a numeric weekly allowance', () => {
    const quota = { ...adminUser.continuation_quota! };
    delete quota.weekly_limit;
    delete quota.remaining;
    render(<ContinuationCredits quota={{ ...quota, plan: 'premium' }} />);
    expect(screen.getByText('Continuations illimitées, sans débit de crédit ni publicité.')).toBeInTheDocument();
    expect(screen.queryByText(/Continuations confirmées/)).not.toBeInTheDocument();
  });
});
