"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cognitoService } from "../../../services/cognito";

export function VerifyForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("No email address found. Please try signing up again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await cognitoService.confirmSignUp(email, code);
      router.push("/auth/signin?verified=true");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await cognitoService.resendConfirmationCode(email);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification code to {email}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter the code from your email"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8B6B4A] hover:bg-[#6B4A2A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B6B4A] disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-sm text-[#8B6B4A] hover:text-[#6B4A2A] disabled:opacity-50"
              >
                Didn't receive a code? Click here to resend
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
