import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Campus Online',
  description: 'Plataforma de escolas digitais — cursos, aulas e área de membros.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
