import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feed } from '../types';

export function useFeeds() {
  return useQuery({
    queryKey: ['feeds'],
    queryFn: async () => {
      const feeds = await window.electronAPI.db.getFeeds();
      return feeds.map((feed: any) => ({
        ...feed,
        enabled: !!feed.enabled,
        is_default: !!feed.is_default,
        filter_keywords: feed.filter_keywords
          ? JSON.parse(feed.filter_keywords)
          : [],
      })) as Feed[];
    },
  });
}

export function useAddFeed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (feed: Omit<Feed, 'id'>) => {
      const feedToAdd = {
        ...feed,
        filter_keywords: Array.isArray(feed.filter_keywords)
          ? JSON.stringify(feed.filter_keywords)
          : feed.filter_keywords,
      };
      await window.electronAPI.db.addFeed(feedToAdd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}

export function useUpdateFeed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, feed }: { id: number; feed: Partial<Feed> }) => {
      const feedToUpdate = {
        ...feed,
        filter_keywords: feed.filter_keywords
          ? Array.isArray(feed.filter_keywords)
            ? JSON.stringify(feed.filter_keywords)
            : feed.filter_keywords
          : undefined,
      };
      await window.electronAPI.db.updateFeed(id, feedToUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await window.electronAPI.db.deleteFeed(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}
