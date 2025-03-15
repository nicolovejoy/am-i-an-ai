"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  analyzeText,
  getPastAnalyses,
  getUserProfile,
  deleteAnalysis,
} from "@/services/api";
import type { AnalysisResult, PastAnalysis, UserProfile } from "@/services/api";

// Hook for analyzing text
export function useAnalyzeText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => analyzeText(text),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["pastAnalyses"] });
    },
  });
}

// Hook for fetching past analyses
export function usePastAnalyses() {
  return useQuery<PastAnalysis[]>({
    queryKey: ["pastAnalyses"],
    queryFn: () => getPastAnalyses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching user profile
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for deleting an analysis
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["pastAnalyses"] });
    },
  });
}
