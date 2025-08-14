import { usePostStore } from '../stores/post.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useCallback, useMemo } from 'react';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

const Post = () => {
  const { posts, loading, error, lastFetched, fetchPosts, addPost, removePost, periodTitle, setPeriodTitle, } = usePostStore();

  const fetchFn = useCallback(async () => {
    await fetchPosts(periods[periodTitle].days);
  }, [fetchPosts, periodTitle]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'posts:metrics:period',
  });

  const formattedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      created_at: formatDateFromDate(post.created_at),
    }));
  }, [posts]);
  
  const columns = [
    { field: 'created_at', headerName: t("postPage.date") },
    { field: 'author', headerName: t("postPage.author"), renderCell: (params: any) => (
      <Link
        to={`/users/${params.row.user_id}`}
        style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {params.value}
      </Link>
    ), },
    { field: 'content', headerName: t("postPage.post") },
    { field: 'nb_like', headerName: t("postPage.nbLike") },
    { field: 'nb_report', headerName: t("postPage.nbReport") },
  ];

  const addFields = [
    { field: 'user_id', headerName: t("postPage.userID") },
    { field: 'content', headerName: t("postPage.post") },
  ]

  return (
    <Box
      className="page-post"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title={t("postPage.title")} />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={formattedPosts}
        addFields={addFields}
        onRequestAdd={addPost}
        onRequestDelete={removePost}
        showAddButton={true}
      />
    </Box>
  );
};

export default Post;
