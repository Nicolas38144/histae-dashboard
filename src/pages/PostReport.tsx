import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import PeriodToggle from '../components/PeriodToggle';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import { usePostReportViewModel } from '../hooks/usePostReportViewModel';

const PostReport = () => {
  const {
    postReports,
    loading,
    error,
    columns,
    periodTitle,
    setPeriodTitle,
    handleDelete
  } = usePostReportViewModel();

  return (
    <Box className="page-postreport" sx={{ display: 'flex', flexDirection: 'column' }}>
      <MainTitle title="Post Reports" />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={postReports}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default PostReport;
