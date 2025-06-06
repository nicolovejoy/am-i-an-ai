"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { cognitoService } from "../../services/cognito";
import { AuthError } from "../../types/auth";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { ButtonLoader } from "../../components/LoadingSpinner";
import { useToastContext } from "../../contexts/ToastContext";

const profileSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface ProfileFormData {
  email: string;
}

const ProfileContent = () => {
  const { user, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { success: showSuccess, error: showError } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await cognitoService.updateUserAttributes({ email: data.email });
      await checkAuth();
      showSuccess("Profile updated!", "Your profile has been updated successfully.");
      setIsEditing(false);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      showError("Profile update failed", authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    reset({ email: user?.email || "" });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    reset({ email: user?.email || "" });
  };

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
            {error.message}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <p className="mt-1 text-gray-900 font-mono text-sm">{user?.sub}</p>
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