'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Verificar role TEACHER
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role, name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'TEACHER') {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-66' : 'w-20'
          } border-r border-slate-800 bg-[#020617] transition-all duration-300 flex flex-col z-20 shadow-2xl`}
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
            E
          </div>
          {sidebarOpen && (
            <span className="font-bold tracking-tight text-lg text-white">Escola Raiz</span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          <NavItem
            href="/teacher/dashboard"
            icon="📊"
            label="Dashboard"
            sidebarOpen={sidebarOpen}
          />
          <NavItem
            href="/teacher/categories"
            icon="📂"
            label="Categorias"
            sidebarOpen={sidebarOpen}
          />
          <NavItem
            href="/teacher/courses"
            icon="📚"
            label="Meus Cursos"
            sidebarOpen={sidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
          >
            {sidebarOpen ? '← Recolher' : '→'}
          </button>

          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span className="font-medium">Sair do Painel</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#020617] relative">
        {/* Top Header Placeholder */}
        <header className="h-16 border-b border-slate-800/30 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="text-sm text-slate-400">
            Escola do Empreendedor / <span className="text-white">Backoffice</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, sidebarOpen }: { href: string; icon: string; label: string; sidebarOpen: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 group relative"
    >
      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
      {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
      {!sidebarOpen && (
        <div className="absolute left-14 bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  );
}
