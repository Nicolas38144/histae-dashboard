export interface DataTableProps {
  columns: { field: string; headerName: string }[];
  rows: any[];
  searchLabel?: string;
  onRequestAdd?: (data: any) => Promise<void>;
  onRequestEdit?: (data: any) => Promise<void>;
  onRequestDelete?: (id: string) => Promise<void>;
  editableFields?: string[];
}

export interface AddDialogFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  fields: { field: string; headerName: string }[];
}

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export type PeriodTitle = 'today' | 'last7days' | 'lastmonth' | 'thisyear' | 'last12months';

export interface PeriodToggleProps {
  value: PeriodTitle;
  onChange: (newValue: PeriodTitle) => void;
}