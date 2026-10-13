import { Box } from '@mui/material';
import { getPlans } from '../api/admin';
import { AsyncState } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { PlanCard } from '../components/PlanCard';
import { useAsyncData } from '../hooks/useAsyncData';

export default function Plans() {
  const { data, loading, error, reload } = useAsyncData(getPlans);

  return (
    <>
      <PageHeader
        title="Plans"
        description="Catalogue commercial exposé par l’API. L’activation Premium reste sous le contrôle du fournisseur de facturation."
      />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {data.map((plan) => <PlanCard key={plan.code} plan={plan} />)}
        </Box>
      )}
    </>
  );
}
