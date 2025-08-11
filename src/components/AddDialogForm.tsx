import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useNotification } from './Notifier';
import { t } from 'i18next';
import type { AddDialogFormProps } from '../types/dataTableProps.type';

const AddDialogForm = ({ open, onClose, onSubmit, fields }: AddDialogFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { showNotification } = useNotification();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const emptyField = fields.find(({ field }) => !formData[field]?.trim());

    if (emptyField) {
      showNotification(`${t("notifications.field")} ${emptyField.headerName} ${t("notifications.field")}`, 'error');
      return;
    }

    try {
      await onSubmit(formData);
      showNotification(t("notifications.successAdding"), 'success');
      setFormData({});
      onClose();
    } catch (err) {
      showNotification(t("notifications.errorAdding"), 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("addDialogForm.title")}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map(({ field, headerName }) => (
          <TextField
            key={field}
            label={headerName}
            value={formData[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            margin="dense"
            fullWidth
          />
        ))}
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'center', gap: 5}}>
        <Button onClick={onClose}>{t("addDialogForm.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={fields.some(({ field }) => !formData[field]?.trim())}
        >
          {t("addDialogForm.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDialogForm;
