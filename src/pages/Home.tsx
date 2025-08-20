import { Box, Paper, Typography } from '@mui/material';
import { MainTitle } from '../components/Title';
import PeriodToggle from '../components/PeriodToggle';
import ChartWithToggle from '../components/ChartWithToggle';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { useHomeViewModel } from '../hooks/useHomeViewModel';

const Home = () => {
  const {
    metrics,
    chartData,
    loadingSizeDB,
    loadingChartData,
    errorMetric,
    periodTitle,
    setPeriodTitle,
    chartTitle,
  } = useHomeViewModel();

  return (
    <Box className="page-home" sx={{ display: 'flex', flexDirection: 'column' }}>
      <MainTitle title="Home" />
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {(loadingSizeDB || loadingChartData) && <Loader />}
      {errorMetric && <Error error={errorMetric} />}

      {!loadingSizeDB && !loadingChartData && !errorMetric && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {metrics.map((metric) => (
            <Paper key={metric.label} elevation={3} sx={{ flex: '1 1 200px', p: 2, textAlign: 'center' }}>
              <Typography variant="h6">{metric.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{metric.value}</Typography>
            </Paper>
          ))}

          {chartData && chartData.length > 0 && <ChartWithToggle data={chartData} title={chartTitle} />}
        </Box>
      )}
    </Box>
  );
};

export default Home;
