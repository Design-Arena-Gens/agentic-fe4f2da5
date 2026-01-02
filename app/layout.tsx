import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HandleCraft Agent',
  description: 'Generate bespoke social media usernames powered by DeepSeek.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
