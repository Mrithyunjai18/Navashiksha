import './globals.css';
import SessionProviderWrapper from './SessionProviderWrapper';

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
