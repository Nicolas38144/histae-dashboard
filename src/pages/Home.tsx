import { useCallback } from 'react';
import { useMetricStore } from '../stores/metric.store';
import { MAX_CACHE_DURATION, TITLE } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import { Box, Paper, Typography } from '@mui/material';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import ChartWithToggle from '../components/ChartWithToggle';
import { t } from 'i18next';

const Home = () => {
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
    periodTitle,
    setPeriodTitle,
  } = useMetricStore();

  const fetchFn = useCallback(async () => {
    await fetchSizeDatabase(periods[periodTitle].days);
    await fetchChartData(periods[periodTitle].days);
  }, [fetchSizeDatabase, fetchChartData, periodTitle]);

  useAutoFetchStore({
    lastFetched: Math.max(lastFetchedSizeDB || 0, lastFetchedChartData || 0),
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'home:metrics:period',
  });

  const metrics = sizeDB
    ? [
        { label: t("homePage.users"), value: sizeDB.nb_user },
        { label: t("homePage.matchesCreated"), value: sizeDB.nb_match },
        { label: t("homePage.matchesNotContinued"), value: sizeDB.nb_match_not_continued },
        { label: t("homePage.matchesContinued"), value: sizeDB.nb_match_continued },
        { label: t("homePage.matchReports"), value: sizeDB.nb_match_report },
        { label: t("homePage.posts"), value: sizeDB.nb_post },
        { label: t("homePage.postsLiked"), value: sizeDB.nb_post_liked },
        { label: t("homePage.postReports"), value: sizeDB.nb_post_report },
      ]
    : [];

  return (
    <Box className="page-match" sx={{ display: 'flex', flexDirection: 'column' }}>
      <MainTitle title={t("homePage.title")} />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loadingSizeDB && <Loader />}
      {loadingChartData && <Loader />}
      {error && <Error error={error} />}

      {!loadingSizeDB && !loadingChartData && !error && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {metrics.map((metric) => (
            <Paper
              elevation={3}
              key={metric.label}
              sx={{ flex: '1 1 200px', p: 2, textAlign: 'center' }}
            >
              <Typography variant="h6">{metric.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {metric.value}
              </Typography>
            </Paper>
          ))}
	
          {chartData && chartData.length > 0 && <ChartWithToggle data={chartData} title={TITLE[periodTitle]} />}
        </Box>
      )}
    </Box>
  );
};

export default Home;
