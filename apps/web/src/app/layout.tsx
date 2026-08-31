import type { Metadata } from 'next';
import { Nav } from '@/components/layout/nav';
import './global.css';

export const metadata: Metadata = {
  title: 'ACME Compensation',
  description: 'Salary management and pay analytics for ACME',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
