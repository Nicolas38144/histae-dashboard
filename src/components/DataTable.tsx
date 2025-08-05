import { Box, TextField, IconButton, Button } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useMemo, useRef, useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { DataTableProps } from '../types/dataTableProps.type';

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
}: DataTableProps) => {
  const [searchText, setSearchText] = useState('');
  const [tableHeight, setTableHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

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
        width: Math.ceil(maxContentWidth + padding),
      };
    });

    return [
      ...dynamicCols,
      ...( (onRequestEdit || onRequestDelete) ? [{
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }: any) => (
          <>
            {onRequestEdit &&
              <IconButton onClick={() => onRequestEdit(row.id)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            }
            {onRequestDelete &&
              <IconButton onClick={() => onRequestDelete(row.id)} size="small">
                <Delete fontSize="small" color="error" />
              </IconButton>
            }
          </>
        ),
      }] : [])
    ];
  }, [columns, filteredRows, onRequestEdit, onRequestDelete]);
      

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
      {filteredRows  && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <TextField
            label={searchLabel}
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1, mr: 2 }}
          />
          {onRequestAdd && (
            <Button
              variant="outlined"
              onClick={onRequestAdd}
              sx={{
                minWidth: 40,
                px: 2,
                py: 0.8,
                color: '#9e9e9e',
                borderColor: '#bdbdbd',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                  borderColor: '#000000',
                }
              }}
            >
              +
            </Button>
          )}
        </Box>
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
    </Box>
  );
};

export default DataTable;
