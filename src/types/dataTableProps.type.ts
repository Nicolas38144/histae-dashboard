import type { GridColDef, GridRowsProp, GridRowId } from "@mui/x-data-grid";

export type DataTableProps = {
  columns: GridColDef[];
  rows: GridRowsProp;
  searchLabel?: string;
  onRequestAdd?: () => void;
  onRequestEdit?: (id: GridRowId) => void;
  onRequestDelete?: (id: GridRowId) => void;
};
