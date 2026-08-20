import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={750}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
      </Box>
      {actions}
    </Box>
  );
}

