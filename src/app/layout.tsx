import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VNH Business Plan Tool',
  description: 'Business plan budgeting, costing and cashflow generator for VNH ED 2026 planning.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
