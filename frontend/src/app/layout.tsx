import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';

export const metadata = {
  title: 'Robot Orchestra - Where humans and AI collaborate',
  description: 'An experimental platform exploring trust and collaboration between humans and AI through anonymized matches where participants try and determine who is human and who is a robot (AI).',
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