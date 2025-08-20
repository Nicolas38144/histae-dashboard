import { useCallback, useMemo } from 'react';
import { usePostStore } from '../stores/post.store';
import { formatDateFromDate } from '../utils/general';
import { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import React from 'react';

export const usePostViewModel = () => {
  const {
    posts,
    loadingPost,
    errorPost,
    lastFetchedPost,
    fetchPosts,
    addPost,
    removePost,
    periodTitle,
    setPeriodTitle,
  } = usePostStore();

  const fetchFn = useCallback(async () => {
    await fetchPosts(periods[periodTitle].days);
  }, [fetchPosts, periodTitle]);

  useAutoFetchStore({
    lastFetched: lastFetchedPost,
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
    {
      field: 'author',
      headerName: t("postPage.author"),
      renderCell: (params: any) =>
        React.createElement(Link, {
          to: `/users/${params.row.user_id}`,
          style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }
        }, params.value),
    },
    { field: 'content', headerName: t("postPage.post") },
    { field: 'nb_like', headerName: t("postPage.nbLike") },
    { field: 'nb_report', headerName: t("postPage.nbReport") },
  ];

  const addFields = [
    { field: 'user_id', headerName: t("postPage.userID") },
    { field: 'content', headerName: t("postPage.post") },
  ];

  return {
    posts: formattedPosts,
    loading: loadingPost,
    error: errorPost,
    periodTitle,
    setPeriodTitle,
    columns,
    addFields,
    addPost,
    removePost,
  };
};
