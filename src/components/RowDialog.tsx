import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef } from 'react';
import type { RowDialogProps } from '../types/rowDialogProps.type';


const RowDialog = ({
  open,
  type,
  data,
  rowId,
  onClose,
  onConfirm,
  setEditData,
}: RowDialogProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((type === 'edit' || type === 'add') && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [type]);

  const handleChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
  if (type === 'edit' && rowId) {
    onConfirm(rowId, data);
  } else if (type === 'delete' && rowId) {
    onConfirm(rowId);
  } else if (type === 'add') {
    onConfirm(null, data);
  }
  onClose();
};

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {{
          add: 'Ajouter une vibe',
          edit: 'Modifier la vibe',
          delete: 'Confirmer la suppression',
        }[type]}
      </DialogTitle>
      <DialogContent>
        {type === 'delete' ? (
          <Typography>Êtes-vous sûr de vouloir supprimer cette vibe ?</Typography>
        ) : (
          <>
            {Object.entries(data).map(([key, value], index) => (
              <TextField
                key={key}
                margin="dense"
                label={key}
                fullWidth
                value={value}
                inputRef={index === 0 ? firstInputRef : undefined}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleConfirm}
          color={type === 'delete' ? 'error' : 'primary'}
          variant="contained"
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RowDialog;
