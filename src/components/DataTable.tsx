import {
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  DataGrid,
  type GridColDef,
  type GridRowsProp,
  type GridRowId,
} from '@mui/x-data-grid';

const getTextWidth = (text: string, font = '14px Roboto') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = font;
    return context.measureText(text).width;
  }
  return 100;
};

type DataTableProps = {
  columns: GridColDef[];
  rows: GridRowsProp;
  searchLabel?: string;
  searchableField?: string;
  onEdit?: (id: GridRowId, updatedRow: any) => void;
  onDelete?: (id: GridRowId) => void;
};

const DataTable = ({
  columns,
  rows,
  searchLabel = 'Recherche',
  searchableField,
  onEdit,
  onDelete,
}: DataTableProps) => {
  const [searchText, setSearchText] = useState('');
  const [tableHeight, setTableHeight] = useState(400);
  const [selectedId, setSelectedId] = useState<GridRowId | null>(null);
  const [dialogType, setDialogType] = useState<'edit' | 'delete' | null>(null);
  const [editData, setEditData] = useState<any>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    if (!searchableField || !searchText.trim()) return rows;
    return rows.filter((row) =>
      row[searchableField]
        ?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [rows, searchText, searchableField]);

  const handleOpenDialog = (type: 'edit' | 'delete', id: GridRowId) => {
    setSelectedId(id);
    setDialogType(type);
    if (type === 'edit') {
      const rowToEdit = rows.find((r) => r.id === id);
      if (rowToEdit) {
        const { id, ...rest } = rowToEdit;
        setEditData(rest);
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedId(null);
    setEditData({});
  };

  const handleEditFieldChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (dialogType === 'delete' && selectedId !== null && onDelete) {
      onDelete(selectedId);
    }
    if (dialogType === 'edit' && selectedId !== null && onEdit) {
      const updatedRow = { id: selectedId, ...editData };
      onEdit(selectedId, updatedRow);
    }
    handleCloseDialog();
  };

  const autoSizedColumns = useMemo(() => {
    const padding = 40;
    const dynamicCols = columns.map((col) => {
      const headerWidth = getTextWidth(col.headerName || col.field);
      const maxContentWidth = Math.max(
        ...filteredRows.map((row) =>
          getTextWidth(String(row[col.field] ?? ''))
        ),
        headerWidth
      );
      return {
        ...col,
        width: Math.ceil(maxContentWidth + padding),
      };
    });

    return [
      ...dynamicCols,
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <>
            <IconButton onClick={() => handleOpenDialog('edit', row.id)} size="small">
              <Edit fontSize="small" />
            </IconButton>
            <IconButton onClick={() => handleOpenDialog('delete', row.id)} size="small">
              <Delete fontSize="small" color="error" />
            </IconButton>
          </>
        ),
      },
    ];
  }, [columns, filteredRows]);

  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dialogType === 'edit' && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [dialogType]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const topOffset = containerRef.current.getBoundingClientRect().top;
        const availableHeight = window.innerHeight - topOffset - 128;
        setTableHeight(availableHeight > 200 ? availableHeight : 200);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column' }}>
      {searchableField && (
        <TextField
          label={searchLabel}
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      )}
      <Box sx={{ height: tableHeight }}>
        <DataGrid
          rows={filteredRows}
          columns={autoSizedColumns}
          pagination
          disableColumnResize
          disableRowSelectionOnClick
          sx={{ width: "calc(100vw - 200px - 32px)" }}
        />
      </Box>

      <Dialog open={!!dialogType} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogType === "delete"
            ? "Confirmer la suppression"
            : "Modifier l'élément"}
        </DialogTitle>
        <DialogContent>
          {dialogType === "delete" ? (
            <Typography>Êtes-vous sûr de vouloir supprimer cet élément ?</Typography>
          ) : (
            <>
              {Object.entries(editData).map(([key, value], index) => (
                <TextField
                  key={key}
                  margin="dense"
                  label={key}
                  fullWidth
                  value={value}
                  inputRef={index === 0 ? firstInputRef : undefined}
                  onChange={(e) => handleEditFieldChange(key, e.target.value)}
                />
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleConfirm}
            color={dialogType === "delete" ? "error" : "primary"}
            variant="contained"
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataTable;
