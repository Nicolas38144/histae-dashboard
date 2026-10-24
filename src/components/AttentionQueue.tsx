import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { AdminMetrics } from '../api/types';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { formatNumber } from '../utils/format';
import { attentionTasks } from '../utils/attention-tasks';

export function AttentionQueue({ data }: { data: AdminMetrics }) {
  useLocale();
  const tasks = attentionTasks(data);
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2">{t('workspace.attention')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{t('workspace.attentionIntro')}</Typography>
      {tasks.length ? (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {tasks.map(task => (
            <Box key={task.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>
                {task.maintenance ? t('common.boundedJobs') + ' · ' : ''}{t(task.label)} <strong>{formatNumber(task.count)}</strong>
              </Typography>
              {task.path.startsWith('#')
                ? <Button component="a" href={task.path}>{t('workspace.open')}</Button>
                : <Button component={Link} to={task.path}>{t('workspace.open')}</Button>}
            </Box>
          ))}
        </Box>
      ) : <Alert severity="success">{t('workspace.clear')}</Alert>}
    </Paper>
  );
}
