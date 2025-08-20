import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import type { ConfirmDialogProps } from '../types/dataTableProps.type';

const ConfirmDialog = ({
  open,
  title = t("confirmDialog.title"),
  message = t("confirmDialog.message"),
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {t("confirmDialog.cancel")}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
           {t("confirmDialog.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
