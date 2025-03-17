"use client";

import React, { useState, useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  // Clear error when form fields change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [name, email, password, error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ name, email, password });
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (error) {
        clearError();
      }
      setter(e.target.value);
    };

  return (
    <div className="terminal p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-neon-purple mb-6 font-mono">
        CREATE NEW ACCOUNT
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
            htmlFor="name"
            className="block text-neon-green mb-1 font-mono"
          >
            NAME
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleChange(setName)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 bg-dark-blue border border-neon-blue focus:border-neon-green outline-none"
            required
            disabled={isLoading}
          />
        </div>

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
            onChange={handleChange(setEmail)}
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
            onChange={handleChange(setPassword)}
            placeholder="Create a password"
            className="w-full px-3 py-2 bg-dark-blue border border-neon-blue focus:border-neon-green outline-none"
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="sci-fi-button w-full"
          disabled={isLoading}
        >
          {isLoading ? "CREATING ACCOUNT..." : "REGISTER"}
        </button>
      </form>
    </div>
  );
}
