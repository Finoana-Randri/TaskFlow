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
      <body className="min-h-screen bg-[#f5f0e7] text-[#17181b] font-sans antialiased flex flex-col selection:bg-[#ef6b54] selection:text-white">
        {/*
          THESIS: TaskFlow is a studio instrument for work in motion, not a technical demo or a generic SaaS hero.
          OWN-WORLD: ink, warm ivory, walnut neutrals, measured marks, and coral signal accents carry the meter-bridge grammar.
          STORY: visitors understand that projects can adopt their own flow and keep their documents attached to the work.
          FIRST VIEWPORT: a dark instrument panel pairs the promise and CTA on the left with a living multi-column task meter on the right.
          FORM: a studio vu-meter bridge, direction 3 of the grounded list, seed key 6cdde138.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <ApolloProvider client={client}>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-[#f5f0e7]">
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
