"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/api";
import type { UserProfile } from "@/services/api";

// Hook for fetching user profile
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
