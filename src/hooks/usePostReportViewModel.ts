import { useCallback, useMemo } from 'react';
import { usePostReportStore } from '../stores/postReport.store';
import { formatDateFromDate } from '../utils/general';
import { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import React from 'react';

export const usePostReportViewModel = () => {
  const {
    postReports,
    loadingPostReport,
    errorPostReport,
    lastFetchedPostReport,
    fetchPostReports,
    removePostReport,
    periodTitle,
    setPeriodTitle,
  } = usePostReportStore();

  const { showNotification } = useNotification();

  const handleDelete = async (id: string) => {
    try {
      await removePostReport(id);
      showNotification(t("notifications.postReportDeleted"), 'success');
    } catch {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  const fetchFnPostReports = useCallback(async () => {
    await fetchPostReports(periods[periodTitle].days);
  }, [fetchPostReports, periodTitle]);

  useAutoFetchStore({
    lastFetched: lastFetchedPostReport,
    fetchFn: fetchFnPostReports,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'postreports:metrics:period',
  });

  const formattedPostReports = useMemo(() => {
    return postReports.map((pr) => ({
      ...pr,
      report_date: formatDateFromDate(pr.report_date),
      creation_date: formatDateFromDate(pr.creation_date),
    }));
  }, [postReports]);

  const columns = [
    { field: 'report_date', headerName: t("postReportPage.reportDate") },
    { field: 'creation_date', headerName: t("postReportPage.creationDate") },
    {
      field: 'origin_user_info',
      headerName:t("postReportPage.origin"),
      renderCell: (params: any) =>
        React.createElement(Link, {
          to: `/users/${params.row.origin_user_id}`,
          style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }
        }, params.value),
    },
    {
      field: 'target_user_info',
      headerName: t("postReportPage.target"),
      renderCell: (params: any) =>
        React.createElement(Link, {
          to: `/users/${params.row.target_user_id}`,
          style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }
        }, params.value),
    },
    { field: 'content', headerName: t("postReportPage.content") },
    { field: 'reason', headerName: t("postReportPage.reason") },
  ];

  return {
    postReports: formattedPostReports,
    loading: loadingPostReport,
    error: errorPostReport,
    periodTitle,
    setPeriodTitle,
    columns,
    handleDelete,
  };
};
