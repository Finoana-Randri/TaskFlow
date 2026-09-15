'use client';

import './globals.css';
import { ApolloProvider } from '@apollo/client';
import client from './lib/apollo-client';
import { AuthProvider } from './lib/auth-context';
import Navbar from './components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <ApolloProvider client={client}>
          <AuthProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
