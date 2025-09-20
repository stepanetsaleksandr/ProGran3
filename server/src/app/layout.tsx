import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProGran3 Tracking Server',
  description: 'Server for tracking ProGran3 plugin activity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
