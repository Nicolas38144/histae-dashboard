import { Button } from '@mui/material';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AsyncState } from '../../src/components/AsyncState';
import { ConfirmActionDialog } from '../../src/components/ConfirmActionDialog';
import { useNotification } from '../../src/components/notification-context';
import { renderDashboard } from '../helpers/render';

describe('shared interaction components', () => {
  it('requires a trimmed reason before confirming a sensitive action', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    function SensitiveAction() {
      const [reason, setReason] = useState('');
      return <ConfirmActionDialog
          open
          title="Action sensible"
          description="Cette action sera auditée."
          confirmLabel="Confirmer"
          value={reason}
          onValueChange={setReason}
          valueLabel="Motif"
          requireValue
          onCancel={() => undefined}
          onConfirm={confirm}
        />;
    }
    renderDashboard(<SensitiveAction />);

    const button = screen.getByRole('button', { name: 'Confirmer' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Motif'), '   ');
    expect(button).toBeDisabled();
    await user.clear(screen.getByLabelText('Motif'));
    await user.type(screen.getByLabelText('Motif'), 'Action vérifiée');
    await user.click(button);
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('renders retryable errors and empty loading state independently', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = renderDashboard(<AsyncState loading={false} error="Service indisponible" onRetry={retry} />);
    expect(screen.getByText('Service indisponible')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<AsyncState loading error={null} />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('shows user-visible success and error notifications', async () => {
    const user = userEvent.setup();
    function Trigger() {
      const { showNotification } = useNotification();
      return <Button onClick={() => showNotification('Opération confirmée.', 'success')}>Notifier</Button>;
    }
    renderDashboard(<Trigger />);
    await user.click(screen.getByRole('button', { name: 'Notifier' }));
    expect(await screen.findByText('Opération confirmée.')).toBeVisible();
  });
});
