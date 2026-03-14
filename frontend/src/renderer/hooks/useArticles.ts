import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Article } from '../types';

export function useArticles(feedId?: number) {
  return useQuery({
    queryKey: ['articles', feedId],
    queryFn: async () => {
      return (await window.electronAPI.db.getArticles(feedId)) as Article[];
    },
  });
}

export function useAddArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (article: Omit<Article, 'id'>) => {
      await window.electronAPI.db.addArticle(article);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
