import { Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function MetricCard({ label, value, icon, accent = 'primary.main' }: { label: string; value: number | string; icon: ReactNode; accent?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: 3, borderTopColor: accent }}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography variant="h3" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {value}<span style={{ display: 'flex' }}>{icon}</span>
      </Typography>
    </Paper>
  );
}

