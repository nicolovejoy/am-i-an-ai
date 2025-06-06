"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignUpFormData, AuthError } from "../../types/auth";
import { cognitoService } from "../../services/cognito";
import { useRouter } from "next/navigation";
import { FormField } from "../forms/FormField";
import { PasswordInput } from "../forms/PasswordInput";
import { ButtonLoader } from "../LoadingSpinner";
import { useToastContext } from "../../contexts/ToastContext";

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();
  const { success, error: showError } = useToastContext();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await cognitoService.signUp(data);
      success(
        "Account created successfully!", 
        "Please check your email for verification instructions."
      );
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      showError("Sign up failed", authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField 
          label="Email" 
          error={errors.email}
          required
          helpText="We'll send you a verification email"
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
          <PasswordInput
            {...register("password")}
            placeholder="Enter a strong password"
            showStrength={true}
            value={password || ""}
          />
        </FormField>

        <FormField 
          label="Confirm Password" 
          error={errors.confirmPassword}
          required
          helpText="Enter the same password again"
        >
          <input
            type="password"
            {...register("confirmPassword")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Confirm your password"
          />
        </FormField>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8B6B4A] hover:bg-[#6B4A2A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B6B4A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <ButtonLoader />
              <span>Creating account...</span>
            </>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>
    </div>
  );
};
