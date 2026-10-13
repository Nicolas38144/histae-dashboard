import { OpenInNewOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import type { AdminSession } from '../api/types';
import { PageHeader } from '../components/PageHeader';

const tools = [
  { name: 'Grafana', path: 'grafana', description: 'Tableaux de bord de disponibilité, latence et traitements.' },
  { name: 'Prometheus', path: 'prometheus', description: 'Métriques, requêtes PromQL et état des collectes.' },
  { name: 'Alertmanager', path: 'alertmanager', description: 'Alertes actives, regroupement et silences.' },
] as const;

export default function Monitoring() {
  const session = useOutletContext<AdminSession>();
  if (session.role !== 'superadmin') {
    return <Alert severity="error">La supervision est réservée au superadministrateur.</Alert>;
  }
  return (
    <>
      <PageHeader title="Supervision" description="Outils de supervision de la pile de développement." />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
        {tools.map((tool) => (
          <Paper key={tool.path} variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700}>{tool.name}</Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>{tool.description}</Typography>
            <Button component="a" href={`/monitoring/${tool.path}/`} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewOutlined />}>
              Ouvrir {tool.name}
            </Button>
          </Paper>
        ))}
      </Box>
    </>
  );
}
