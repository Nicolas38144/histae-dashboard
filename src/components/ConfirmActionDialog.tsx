import type { ReactNode } from 'react';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';

export function ConfirmActionDialog({
  children, open, title, description, confirmLabel, value, onValueChange, valueLabel, requireValue = false, minValueLength = 1, maxValueLength, confirmDisabled = false, danger = false, loading = false, onCancel, onConfirm,
}: {
  children?: ReactNode;
  open: boolean; title: string; description: string; confirmLabel: string; value?: string; onValueChange?: (value: string) => void;
  valueLabel?: string; requireValue?: boolean; minValueLength?: number; maxValueLength?: number;
  confirmDisabled?: boolean; danger?: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  useLocale();
  const valueLength = value?.trim().length ?? 0;
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: valueLabel ? 2 : 0 }}>{description}</DialogContentText>
        {children}
        {valueLabel && <TextField autoFocus fullWidth multiline minRows={2} label={valueLabel} value={value ?? ''} onChange={(event) => onValueChange?.(event.target.value)} inputProps={{ maxLength: maxValueLength }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>{t("common.cancel")}</Button>
        <Button onClick={onConfirm} variant="contained" color={danger ? 'error' : 'primary'} disabled={loading || confirmDisabled || (requireValue && valueLength < minValueLength) || (maxValueLength !== undefined && valueLength > maxValueLength)}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
