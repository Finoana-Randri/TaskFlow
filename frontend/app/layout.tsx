'use client';

import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ApolloProvider } from '@apollo/client';
import client from './lib/apollo-client';
import { AuthProvider } from './lib/auth-context';
import Navbar from './components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
        <ApolloProvider client={client}>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">
              <Navbar />
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </div>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
