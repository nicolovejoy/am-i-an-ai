import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavMenu from './components/NavMenu';
import Home from './pages/Home';
import TextAnalysis from './pages/TextAnalysis';
import About from './pages/About';
import Donate from './pages/Donate';
import Account from './pages/Account';

function App() {
  // Simple login state - would be replaced with a proper auth system in a real app
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-blue text-white flex flex-col">
        {/* Grid background for sci-fi effect */}
        <div className="grid-background"></div>

        {/* NavMenu - always visible at the top */}
        <NavMenu isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/analysis" element={<TextAnalysis />} />
                <Route path="/about" element={<About />} />
                <Route path="/donate" element={<Donate />} />
                <Route
                  path="/account"
                  element={
                    isLoggedIn ? (
                      <Account />
                    ) : (
                      <div className="py-6 sm:py-8 text-center">
                        <div className="terminal max-w-md mx-auto">
                          <h2 className="text-xl sm:text-2xl font-semibold neon-text mb-4">
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

          <footer className="bg-opacity-90 bg-medium-blue mt-8 sm:mt-12 border-t border-neon-blue rounded-md">
            <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4">
              <div className="md:flex md:items-center md:justify-between">
                <div className="text-center md:text-left">
                  <p className="text-gray-400 text-sm sm:text-base">
                    &copy; 2025 Am I an AI? All rights reserved.
                  </p>
                </div>
                <div className="mt-4 flex justify-center md:mt-0 space-x-4 sm:space-x-6 text-sm sm:text-base">
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-neon-blue transition-colors"
                  >
                    <span className="sr-only">Privacy Policy</span>
                    Privacy
                  </a>
                  <a href="/terms" className="text-gray-400 hover:text-neon-blue transition-colors">
                    <span className="sr-only">Terms</span>
                    Terms
                  </a>
                  <a
                    href="/contact"
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
      </div>
    </Router>
  );
}

export default App;
