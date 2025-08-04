import type { GridRowId } from '@mui/x-data-grid';

export type RowDialogProps = {
  open: boolean;
  type: 'add' | 'edit' | 'delete';
  data: any;
  rowId: GridRowId | null;
  onClose: () => void;
  onConfirm: (id: GridRowId | null, updatedData?: any) => void;
  setEditData: React.Dispatch<React.SetStateAction<any>>;
};
