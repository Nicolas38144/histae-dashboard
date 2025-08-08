import { useState, useEffect, useCallback } from 'react';
import { useMetricStore } from '../stores/metric.store';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { Box, Paper, Typography } from '@mui/material';
import PeriodToggle, { type PeriodTitle, periods } from '../components/PeriodToggle';
import ChartWithToggle from '../components/ChartWithToggle';

const Home = () => {
  const [periodTitle, setPeriodTitle] = useState<PeriodTitle>('last7days');
  const {
    sizeDB,
    chartData,
    loadingSizeDB,
    loadingChartData,
    error,
    lastFetchedSizeDB,
    lastFetchedChartData,
    fetchSizeDatabase,
    fetchChartData,
  } = useMetricStore();

  const fetchFn = useCallback(() => {
    return fetchSizeDatabase(periods[periodTitle].days);
  }, [fetchSizeDatabase, periodTitle]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchFn();
      await fetchChartData(periods[periodTitle].days);
    };
    fetchData();
  }, [fetchFn, fetchChartData, periodTitle]);

  useAutoFetchStore({
    lastFetched: Math.max(lastFetchedSizeDB || 0, lastFetchedChartData || 0),
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
  });

  const metrics = sizeDB
    ? [
        { label: 'Likes', value: sizeDB.nb_like },
        { label: 'Matches', value: sizeDB.nb_match },
        { label: 'Match Reports', value: sizeDB.nb_match_report },
        { label: 'Messages', value: sizeDB.nb_message },
        { label: 'Publications', value: sizeDB.nb_publication },
        { label: 'Publication Reports', value: sizeDB.nb_publication_report },
        { label: 'Users', value: sizeDB.nb_user },
      ]
    : [];

	const title = {
			today: "aujourd'hui",
			last7days: "les 7 derniers jours",
			lastmonth: "les 30 derniers jours",
			thisyear: "cette année",
			last12months: "les 12 derniers mois"
	};

  return (
    <Box className="page-match" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Title title="Accueil" />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loadingSizeDB && <Loader />}
      {loadingChartData && <Loader />}

      {error && <Error error={error} />}

      {!loadingSizeDB && !loadingChartData && !error && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {metrics.map((metric) => (
            <Paper
              key={metric.label}
              sx={{ flex: '1 1 200px', p: 2, textAlign: 'center', boxShadow: 3 }}
            >
              <Typography variant="h6">{metric.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {metric.value}
              </Typography>
            </Paper>
          ))}
	
          {chartData && chartData.length > 0 && <ChartWithToggle data={chartData} title={title[periodTitle]} />}
        </Box>
      )}
    </Box>
  );
};

export default Home;
