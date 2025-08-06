export interface DataTableProps {
  columns: { field: string; headerName: string }[];
  rows: any[];
  searchLabel?: string;
  onRequestAdd?: (data: any) => Promise<void>;
  onRequestEdit?: (data: any) => Promise<void>;
  onRequestDelete?: (id: string) => Promise<void>;
  editableFields?: string[];
}
