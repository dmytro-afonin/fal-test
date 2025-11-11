import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Profile {
  id: string;
  email: string;
  credits: number;
  role?: string;
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      const profile: { user: Profile } = await res.json();
      return profile;
    },
  });
}

export function useUpdateUserCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCredits: number) => {
      // Optimistically update the cache
      queryClient.setQueryData<{ user: Profile }>(["user"], (old) => {
        if (!old?.user) return old;
        return {
          user: {
            ...old.user,
            credits: newCredits,
          },
        };
      });

      // Invalidate to refetch from server
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => {
      // On error, invalidate to refetch correct data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
