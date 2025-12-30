// src/components/hooks/useProfilePreferences.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PlatformDTO,
  CreatorDTO,
  UserPlatformsReplaceCommand,
  AddUserCreatorCommand,
  PaginatedResponse,
} from "@/types";
import { toast } from "sonner";

/**
 * Custom hook for managing profile preferences (platforms and creators)
 * Uses TanStack Query for data fetching, caching, and optimistic updates
 */
export function useProfilePreferences() {
  const queryClient = useQueryClient();

  // Fetch all available platforms
  const {
    data: allPlatforms = [],
    isLoading: isLoadingAllPlatforms,
    error: allPlatformsError,
  } = useQuery<PlatformDTO[]>({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await fetch("/api/platforms");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać listy platform");
      }
      return response.json();
    },
  });

  // Fetch user's selected platforms
  const {
    data: userPlatforms = [],
    isLoading: isLoadingUserPlatforms,
    error: userPlatformsError,
  } = useQuery<PlatformDTO[]>({
    queryKey: ["me", "platforms"],
    queryFn: async () => {
      const response = await fetch("/api/me/platforms");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać Twoich platform");
      }
      return response.json();
    },
  });

  // Fetch user's favorite creators
  const {
    data: userCreatorsResponse,
    isLoading: isLoadingUserCreators,
    error: userCreatorsError,
  } = useQuery<PaginatedResponse<CreatorDTO>>({
    queryKey: ["me", "creators"],
    queryFn: async () => {
      const response = await fetch("/api/me/creators");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać Twoich twórców");
      }
      return response.json();
    },
  });

  // Extract data from paginated response
  const userCreators = userCreatorsResponse?.data || [];

  // Update user platforms mutation with optimistic updates
  const updatePlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      const payload: UserPlatformsReplaceCommand = {
        platform_ids: platformIds,
      };

      const response = await fetch("/api/me/platforms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Nie udało się zaktualizować platform");
      }

      return response.json();
    },
    onMutate: async (newPlatformIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["me", "platforms"] });

      // Snapshot previous value
      const previousPlatforms = queryClient.getQueryData<PlatformDTO[]>(["me", "platforms"]);

      // Optimistically update to the new value
      const allPlatformsData = queryClient.getQueryData<PlatformDTO[]>(["platforms"]) || [];
      const optimisticPlatforms = allPlatformsData.filter((p) => newPlatformIds.includes(p.id));
      queryClient.setQueryData(["me", "platforms"], optimisticPlatforms);

      return { previousPlatforms };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPlatforms) {
        queryClient.setQueryData(["me", "platforms"], context.previousPlatforms);
      }
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać zmian");
    },
    onSuccess: () => {
      // Invalidate recommendations cache as platform changes affect recommendations
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["me", "platforms"] });
    },
  });

  // Add creator mutation with optimistic updates
  const addCreatorMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const payload: AddUserCreatorCommand = {
        creator_id: creatorId,
      };

      const response = await fetch("/api/me/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          // Conflict - creator already added
          toast.info("Ten twórca jest już na Twojej liście");
          throw new Error("CONFLICT");
        }
        throw new Error(error.message || "Nie udało się dodać twórcy");
      }

      return response.json();
    },
    onMutate: async (creatorId) => {
      await queryClient.cancelQueries({ queryKey: ["me", "creators"] });

      const previousResponse = queryClient.getQueryData<PaginatedResponse<CreatorDTO>>(["me", "creators"]);

      // Find creator from search results or cache
      const searchResults = queryClient.getQueryData<CreatorDTO[]>(["creators", "search"]);
      const creator = searchResults?.find((c) => c.id === creatorId);

      if (creator && previousResponse) {
        queryClient.setQueryData<PaginatedResponse<CreatorDTO>>(["me", "creators"], {
          data: [...previousResponse.data, creator],
          next_cursor: previousResponse.next_cursor,
        });
      }

      return { previousResponse };
    },
    onError: (error, _variables, context) => {
      if (error instanceof Error && error.message === "CONFLICT") {
        // Silent handling for conflicts
        return;
      }

      if (context?.previousResponse) {
        queryClient.setQueryData(["me", "creators"], context.previousResponse);
      }
      toast.error(error instanceof Error ? error.message : "Nie udało się dodać twórcy");
    },
    onSuccess: () => {
      // Invalidate recommendations cache
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Twórca został dodany");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "creators"] });
    },
  });

  // Remove creator mutation with optimistic updates
  const removeCreatorMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const response = await fetch(`/api/me/creators/${creatorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Nie udało się usunąć twórcy");
      }

      return { success: true };
    },
    onMutate: async (creatorId) => {
      await queryClient.cancelQueries({ queryKey: ["me", "creators"] });

      const previousResponse = queryClient.getQueryData<PaginatedResponse<CreatorDTO>>(["me", "creators"]);

      // Optimistically remove creator
      if (previousResponse) {
        const updatedData = previousResponse.data.filter((c) => c.id !== creatorId);
        queryClient.setQueryData<PaginatedResponse<CreatorDTO>>(["me", "creators"], {
          data: updatedData,
          next_cursor: previousResponse.next_cursor,
        });
      }

      return { previousResponse };
    },
    onError: (error, _variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(["me", "creators"], context.previousResponse);
      }
      toast.error(error instanceof Error ? error.message : "Nie udało się usunąć twórcy");
    },
    onSuccess: () => {
      // Invalidate recommendations cache
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Twórca został usunięty");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "creators"] });
    },
  });

  return {
    // Data
    allPlatforms,
    userPlatforms,
    userCreators,

    // Loading states
    isLoading: isLoadingAllPlatforms || isLoadingUserPlatforms || isLoadingUserCreators,
    isLoadingPlatforms: isLoadingAllPlatforms || isLoadingUserPlatforms,
    isLoadingCreators: isLoadingUserCreators,

    // Errors
    error: allPlatformsError || userPlatformsError || userCreatorsError,

    // Mutations
    updatePlatforms: updatePlatformsMutation.mutate,
    addCreator: addCreatorMutation.mutate,
    removeCreator: removeCreatorMutation.mutate,

    // Mutation states
    isUpdatingPlatforms: updatePlatformsMutation.isPending,
    isAddingCreator: addCreatorMutation.isPending,
    isRemovingCreator: removeCreatorMutation.isPending,
  };
}
