import './globals.css';
import SessionProviderWrapper from './SessionProviderWrapper';

// This app is entirely session/auth-driven (every page needs a live request
// context to resolve the signed-in user), so static prerendering at build
// time must be disabled globally — otherwise Next.js tries to build pages
// with no request/session available and crashes with "Invalid URL".
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Navashiksha — Weekly Assessment' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ns-cream text-gray-900">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
