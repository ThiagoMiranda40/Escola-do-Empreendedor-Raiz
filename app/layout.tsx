import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Campus Online',
  description: 'Plataforma de Escolas Digitais - cursos, aulas e área de membros.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased bg-[#020617] text-white`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
