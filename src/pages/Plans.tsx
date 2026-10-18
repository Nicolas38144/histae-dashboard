import { Alert, Box } from '@mui/material';
import { getPlanCatalog } from '../api/admin';
import { AsyncState } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { PlanCard } from '../components/PlanCard';
import { useAsyncData } from '../hooks/useAsyncData';

export default function Plans() {
  const { data, loading, error, reload } = useAsyncData(getPlanCatalog);

  return (
    <>
      <PageHeader
        title="Plans"
        description="Free, Premium Mensuel et Premium Annuel : tarifs et conditions du catalogue API. Les deux abonnements Premium offrent les mêmes fonctionnalités."
      />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && !loading && !error && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          {data.offers.map((offer) => {
            const plan = data.plans.find((candidate) => candidate.code === offer.plan_code)!;
            return <PlanCard key={offer.code} plan={plan} offer={offer} />;
          })}
          {data.offers.length === 0 && <Alert severity="info">Aucune offre disponible.</Alert>}
        </Box>
      )}
    </>
  );
}
