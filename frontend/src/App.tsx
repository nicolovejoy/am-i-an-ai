import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { Navigation } from './components/Navigation';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MatchPage from './pages/MatchPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import HistoryPage from './pages/HistoryPage';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import VerifyPage from './pages/auth/VerifyPage';
import './globals.css';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="antialiased">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/match" element={<MatchPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
              <Route path="/auth/verify" element={<VerifyPage />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App
