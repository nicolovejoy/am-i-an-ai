"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignInFormData, AuthError } from "../../types/auth";
import { cognitoService } from "../../services/cognito";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ButtonLoader } from "../LoadingSpinner";
import { useToastContext } from "../../contexts/ToastContext";
import { FormField } from "../forms/FormField";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { checkAuth } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await cognitoService.signIn(data);
      await checkAuth();
      success("Welcome back!", "You have been successfully signed in.");
      router.push("/");
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      showError("Sign in failed", authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded" role="alert">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" role="form">
        <FormField 
          label="Email" 
          error={errors.email}
          required
        >
          <input
            type="email"
            {...register("email")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </FormField>

        <FormField 
          label="Password" 
          error={errors.password}
          required
        >
          <input
            type="password"
            {...register("password")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </FormField>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <ButtonLoader />
              <span>Signing in...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
};
