import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProGran3 Tracking Server',
  description: 'Server for tracking ProGran3 plugin activity',
  keywords: ['ProGran3', 'SketchUp', 'Plugin', 'Tracking', 'Monitoring'],
  authors: [{ name: 'ProVis3D' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className="h-full">
      <body className="h-full bg-gray-50">
        {children}
      </body>
    </html>
  );
}
