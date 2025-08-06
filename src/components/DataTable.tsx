import { Box, TextField, Button, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useMemo, useRef, useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { DataTableProps } from '../types/dataTableProps.type';
import ConfirmDialog from './ConfirmDialog';
import AddDialogForm from './AddDialogForm';
import { useNotification } from '../components/Notifier';

const getTextWidth = (text: string, font = '14px Roboto') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = font;
    return context.measureText(text).width;
  }
  return 100;
};

const DataTable = ({
  columns,
  rows,
  searchLabel = 'Recherche',
  onRequestAdd,
  onRequestEdit,
  onRequestDelete,
  editableFields = [],
  addFields = [],
  showAddButton = false,
}: DataTableProps & {
  editableFields?: string[];
  addFields?: { field: string; headerName: string }[];
  showAddButton?: boolean;
}) => {
  const [searchText, setSearchText] = useState('');
  const [tableHeight, setTableHeight] = useState(400);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return rows;

    return rows.filter((row) =>
      columns.some((col) => {
        if (col.field === 'actions') return false;
        const value = row[col.field];
        return value?.toString().toLowerCase().includes(searchText.toLowerCase());
      })
    );
  }, [rows, searchText, columns]);

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
        editable: editableFields.includes(col.field),
        width: Math.ceil(maxContentWidth + padding),
      };
    });

    return [
      ...dynamicCols,
      ...(onRequestDelete
        ? [{
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: ({ row }: any) => (
              <IconButton
                onClick={() => {
                  setRowToDelete(row.id);
                  setDeleteConfirmOpen(true);
                }}
                size="small"
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            ),
          }]
        : []
      ),
    ];
  }, [columns, filteredRows, onRequestDelete, editableFields]);

  const { showNotification } = useNotification();
  const handleRowUpdate = async (newRow: any, oldRow: any) => {
    for (const field of editableFields) {
      const value = newRow[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        showNotification(`Le champ ne peut pas être vide.`, 'error');
        throw new Error(`Le champ "${field}" ne peut pas être vide.`);
      }
    }
    if (onRequestEdit && newRow !== oldRow) {
      await onRequestEdit(newRow);
    }
    return newRow;
  };

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          label={searchLabel}
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flex: 1, mr: 2 }}
        />
        {showAddButton && onRequestAdd && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddDialog(true)}
          >
            Ajouter
          </Button>
        )}
      </Box>

      <Box sx={{ height: tableHeight }}>
        <DataGrid
          rows={filteredRows}
          columns={autoSizedColumns}
          pagination
          processRowUpdate={handleRowUpdate}
          isCellEditable={(params) => editableFields.includes(params.field)}
          disableRowSelectionOnClick
          sx={{ width: 'calc(100vw - 200px - 32px)' }}
        />
      </Box>

      {addFields && onRequestAdd && (
        <AddDialogForm
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onSubmit={onRequestAdd}
          fields={addFields}
        />
      )}

      {onRequestDelete && <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirmer la suppression"
        message="Voulez-vous vraiment supprimer cette entrée ?"
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={async () => {
          if (rowToDelete && onRequestDelete) {
            await onRequestDelete(rowToDelete);
          }
          setDeleteConfirmOpen(false);
          setRowToDelete(null);
        }}
      />}
    </Box>
  );
};

export default DataTable;
