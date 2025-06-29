"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { api } from "../../services/apiClient";
import { User, UserUpdate } from "../../types/users";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { ButtonLoader } from "../../components/LoadingSpinner";
import { useToastContext } from "../../contexts/ToastContext";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(30, "Display name must be less than 30 characters"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

interface ProfileFormData {
  displayName: string;
  bio?: string;
}

const ProfileContent = () => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
    },
  });

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await api.users.me();
        setUserProfile(response);
        reset({
          displayName: response.displayName || "",
          bio: response.bio || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (authUser) {
      loadProfile();
    }
  }, [authUser, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData: UserUpdate = {
        displayName: data.displayName,
        bio: data.bio || undefined,
      };
      
      await api.users.updateMe(updateData);
      
      // Reload profile to get updated data
      const response = await api.users.me();
      setUserProfile(response);
      
      showSuccess("Profile updated!", "Your profile has been updated successfully.");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Failed to update profile");
      showError("Profile update failed", "Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    reset({
      displayName: userProfile?.displayName || "",
      bio: userProfile?.bio || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    reset({
      displayName: userProfile?.displayName || "",
      bio: userProfile?.bio || "",
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                {...register("displayName")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                Bio <span className="text-gray-500">(optional, max 160 characters)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                {...register("bio")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Tell others about yourself..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <ButtonLoader />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <p className="mt-1 text-gray-900">
                  {userProfile?.displayName || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-gray-900">{userProfile?.email}</p>
              </div>
            </div>

            {userProfile?.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <p className="mt-1 text-gray-900">{userProfile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trust Score
                </label>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {userProfile?.trustScore}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Connections
                </label>
                <p className="mt-1 text-2xl font-semibold text-blue-600">
                  {userProfile?.connectionCount || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member Since
                </label>
                <p className="mt-1 text-gray-900">
                  {userProfile?.createdAt 
                    ? new Date(userProfile.createdAt).toLocaleDateString()
                    : "Unknown"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary
        fallback={
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                Profile Error
              </h2>
              <p className="text-gray-600 mb-4">
                We couldn't load your profile. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <ProfileContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}