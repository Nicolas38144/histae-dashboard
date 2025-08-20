import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import PeriodToggle from '../components/PeriodToggle';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { usePostViewModel } from '../hooks/usePostViewModel';

const Post = () => {
  const {
    posts,
    loading,
    error,
    columns,
    addFields,
    periodTitle,
    setPeriodTitle,
    addPost,
    removePost,
  } = usePostViewModel();

  return (
    <Box className="page-post" sx={{ display: 'flex', flexDirection: 'column' }}>
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        searchLabel="Research posts"
        columns={columns}
        rows={posts}
        addFields={addFields}
        onRequestAdd={addPost}
        onRequestDelete={removePost}
        showAddButton={true}
      />
    </Box>
  );
};

export default Post;
