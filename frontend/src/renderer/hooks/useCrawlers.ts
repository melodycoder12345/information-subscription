import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crawler } from '../types';

export function useCrawlers() {
  return useQuery({
    queryKey: ['crawlers'],
    queryFn: async () => {
      const crawlers = await window.electronAPI.db.getCrawlers();
      return crawlers.map((crawler: any) => ({
        ...crawler,
        enabled: !!crawler.enabled,
        is_default: !!crawler.is_default,
        filter_keywords: crawler.filter_keywords
          ? JSON.parse(crawler.filter_keywords)
          : [],
      })) as Crawler[];
    },
  });
}

export function useAddCrawler() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (crawler: Omit<Crawler, 'id'>) => {
      const crawlerToAdd = {
        ...crawler,
        filter_keywords: Array.isArray(crawler.filter_keywords)
          ? JSON.stringify(crawler.filter_keywords)
          : crawler.filter_keywords,
      };
      await window.electronAPI.db.addCrawler(crawlerToAdd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
    },
  });
}

export function useDeleteCrawler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await window.electronAPI.db.deleteCrawler(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
    },
  });
}

export function useUpdateCrawler() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, crawler }: { id: number; crawler: Partial<Crawler> }) => {
      const crawlerToUpdate = {
        ...crawler,
        filter_keywords: crawler.filter_keywords
          ? Array.isArray(crawler.filter_keywords)
            ? JSON.stringify(crawler.filter_keywords)
            : crawler.filter_keywords
          : undefined,
      };
      await window.electronAPI.db.updateCrawler(id, crawlerToUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
    },
  });
}
