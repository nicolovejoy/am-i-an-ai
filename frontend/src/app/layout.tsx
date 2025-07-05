import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';

export const metadata = {
  title: 'AmIAnAI v2 - 2H+2AI Conversations',
  description: 'Anonymous real-time conversations between 2 humans and 2 AIs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}