import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';

export function ConfirmActionDialog({
  open, title, description, confirmLabel, value, onValueChange, valueLabel, requireValue = false, minValueLength = 1, maxValueLength, danger = false, loading = false, onCancel, onConfirm,
}: {
  open: boolean; title: string; description: string; confirmLabel: string; value?: string; onValueChange?: (value: string) => void;
  valueLabel?: string; requireValue?: boolean; minValueLength?: number; maxValueLength?: number;
  danger?: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const valueLength = value?.trim().length ?? 0;
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: valueLabel ? 2 : 0 }}>{description}</DialogContentText>
        {valueLabel && <TextField autoFocus fullWidth multiline minRows={2} label={valueLabel} value={value ?? ''} onChange={(event) => onValueChange?.(event.target.value)} inputProps={{ maxLength: maxValueLength }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button onClick={onConfirm} variant="contained" color={danger ? 'error' : 'primary'} disabled={loading || (requireValue && valueLength < minValueLength) || (maxValueLength !== undefined && valueLength > maxValueLength)}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
