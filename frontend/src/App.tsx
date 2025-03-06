import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavMenu from "./components/NavMenu";
import Home from "./pages/Home";
import About from "./pages/About";
import Donate from "./pages/Donate";
import Account from "./pages/Account";
import TextInput from "./components/TextInput";
import Results from "./components/Results";
import { analyzeText, AnalysisResult } from "./services/api";

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysisResult = await analyzeText(text);
      setResult(analysisResult);
    } catch (error) {
      console.error("Error analyzing text:", error);
      // Handle error state
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-blue text-white">
        <div className="grid-background"></div>

        <NavMenu
          isLoggedIn={isLoggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        <header className="bg-opacity-90 bg-medium-blue shadow border-b border-neon-blue">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold neon-text">Am I an AI?</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/donate" element={<Donate />} />
              <Route
                path="/account"
                element={
                  isLoggedIn ? (
                    <Account />
                  ) : (
                    <div className="py-8 px-4 sm:px-6 lg:px-8 text-center">
                      <div className="terminal max-w-md mx-auto">
                        <h2 className="text-2xl font-semibold neon-text mb-4">
                          ACCESS RESTRICTED
                        </h2>
                        <p className="mb-6 text-gray-300">
                          Authentication required to access secure terminal
                        </p>
                        <button onClick={handleLogin} className="sci-fi-button">
                          Login to System
                        </button>
                      </div>
                    </div>
                  )
                }
              />
            </Routes>
          </div>
        </main>

        <footer className="bg-opacity-90 bg-medium-blue mt-12 border-t border-neon-blue">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-gray-400">
                  &copy; 2025 Am I an AI? All rights reserved.
                </p>
              </div>
              <div className="mt-4 flex justify-center md:mt-0 space-x-6">
                <a
                  href="#"
                  className="text-gray-400 hover:text-neon-blue transition-colors"
                >
                  <span className="sr-only">Privacy Policy</span>
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-neon-blue transition-colors"
                >
                  <span className="sr-only">Terms</span>
                  Terms
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-neon-blue transition-colors"
                >
                  <span className="sr-only">Contact</span>
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
