"use client";

import React, { useState } from "react";
import useAuthStore from "@/store/useAuthStore";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="terminal p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-neon-blue mb-6 font-mono">
        SYSTEM LOGIN
      </h2>

      {error && (
        <div className="mb-4 p-3 border border-neon-pink bg-dark-purple bg-opacity-30 text-neon-pink">
          {error}
          <button onClick={clearError} className="ml-2 text-xs underline">
            DISMISS
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-neon-green mb-1 font-mono"
          >
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-dark-blue border border-neon-blue focus:border-neon-green outline-none"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-neon-green mb-1 font-mono"
          >
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 bg-dark-blue border border-neon-blue focus:border-neon-green outline-none"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="sci-fi-button w-full"
          disabled={isLoading}
        >
          {isLoading ? "AUTHENTICATING..." : "LOGIN"}
        </button>

        <div className="text-xs text-gray-400 text-center mt-4">
          <p>Demo credentials: demo@example.com / password</p>
        </div>
      </form>
    </div>
  );
}
