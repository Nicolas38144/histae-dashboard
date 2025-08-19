import { useCallback, useMemo } from 'react';
import { usePostReportStore } from '../stores/postReport.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

const PostReport = () => {
  const { postReports, loadingPostReport, errorPostReport, lastFetchedPostReport, fetchPostReports, removePostReport, periodTitle, setPeriodTitle } = usePostReportStore();

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
    { field: 'origin_user_info', headerName: t("postReportPage.origin"), renderCell: (params: any) => (
      <Link to={`/users/${params.row.origin_user_id}`} style={{ color: '#000', textDecoration: 'underline' }}>
        {params.value}
      </Link>
    )},
    { field: 'target_user_info', headerName: t("postReportPage.target"), renderCell: (params: any) => (
      <Link to={`/users/${params.row.user2_id}`} style={{ color: '#000', textDecoration: 'underline' }}>
        {params.value}
      </Link>
    )},
    { field: 'content', headerName: t("postReportPage.content") },
    { field: 'reason', headerName: t("postReportPage.reason") },
  ];

  return (
    <Box className="page-match" sx={{ display: 'flex', flexDirection: 'column' }}>
      <MainTitle title={t("postReportPage.title")} />
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loadingPostReport && <Loader />}
      {errorPostReport && <Error error={errorPostReport} />}

      <DataTable
        columns={columns}
        rows={formattedPostReports}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default PostReport;
