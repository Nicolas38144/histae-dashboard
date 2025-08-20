import { useCallback, useMemo } from 'react';
import { userMetricStore } from '../stores/metric.store';
import { MAX_CACHE_DURATION, TITLE } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { periods } from '../components/PeriodToggle';
import { t } from 'i18next';

export const useHomeViewModel = () => {
  const {
    sizeDB,
    chartData,
    loadingSizeDB,
    loadingChartData,
    errorMetric,
    lastFetchedSizeDB,
    lastFetchedChartData,
    fetchSizeDatabase,
    fetchChartData,
    periodTitle,
    setPeriodTitle
  } = userMetricStore();

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

  const metrics = useMemo(() => {
    if (!sizeDB) return [];
    return [
      { label: t("homePage.users"), value: sizeDB.nb_user },
      { label: t("homePage.matchesCreated"), value: sizeDB.nb_match },
      { label: t("homePage.matchesNotContinued"), value: sizeDB.nb_match_not_continued },
      { label: t("homePage.matchesContinued"), value: sizeDB.nb_match_continued },
      { label: t("homePage.matchReports"), value: sizeDB.nb_match_report },
      { label: t("homePage.posts"), value: sizeDB.nb_post },
      { label: t("homePage.postsLiked"), value: sizeDB.nb_post_liked },
      { label: t("homePage.postReports"), value: sizeDB.nb_post_report },
    ];
  }, [sizeDB]);

  return {
    sizeDB,
    chartData,
    loadingSizeDB,
    loadingChartData,
    errorMetric,
    metrics,
    periodTitle,
    setPeriodTitle,
    chartTitle: TITLE[periodTitle],
  };
};
