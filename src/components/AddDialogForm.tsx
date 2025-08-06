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

interface AddDialogFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  fields: { field: string; headerName: string }[];
}

const AddDialogForm = ({ open, onClose, onSubmit, fields }: AddDialogFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { showNotification } = useNotification();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const emptyField = fields.find(({ field }) => !formData[field]?.trim());

    if (emptyField) {
      showNotification(`Le champ "${emptyField.headerName}" est requis`, 'error');
      return;
    }

    try {
      await onSubmit(formData);
      showNotification('Ajout réussi', 'success');
      setFormData({});
      onClose();
    } catch (err) {
      showNotification("Erreur lors de l'ajout", 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Ajouter une entrée</DialogTitle>
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
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={fields.some(({ field }) => !formData[field]?.trim())}
        >
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDialogForm;
