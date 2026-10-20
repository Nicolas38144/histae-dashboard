import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { OpenInNewOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import type { AdminSession } from '../api/types';
import { PageHeader } from '../components/PageHeader';

const tools = () => ([
  { name: t("common.grafana"), path: 'grafana', description: t("monitoring.availabilityLatencyAndProcessingDashboards") },
  { name: t("common.prometheus"), path: 'prometheus', description: t("monitoring.metricsPromqlQueriesAndScrapeStatus") },
  { name: t("common.alertmanager"), path: 'alertmanager', description: t("monitoring.activeAlertsGroupingAndSilences") },
] as const);

export default function Monitoring() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  if (session.role !== 'superadmin') {
    return <Alert severity="error">{t("monitoring.monitoringIsRestrictedToTheSuperadministrator")}</Alert>;
  }
  return (
    <>
      <PageHeader title={t("common.monitoring")} description={t("monitoring.developmentStackMonitoringTools")} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
        {tools().map((tool) => (
          <Paper key={tool.path} variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700}>{tool.name}</Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>{tool.description}</Typography>
            <Button component="a" href={`/monitoring/${tool.path}/`} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewOutlined />}>
              {t("monitoring.open", { name: tool.name })}
            </Button>
          </Paper>
        ))}
      </Box>
    </>
  );
}
