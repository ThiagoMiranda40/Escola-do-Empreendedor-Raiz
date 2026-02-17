'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import BrandLogo from '@/components/BrandLogo';

function NavItem({ href, icon, label, sidebarOpen, active }: { href: string; icon: string; label: string; sidebarOpen: boolean; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
    >
      <span className={`text-xl transition-all ${active ? '' : 'grayscale group-hover:grayscale-0'}`}>{icon}</span>
      {sidebarOpen && <span className="font-bold text-sm">{label}</span>}
      {!sidebarOpen && (
        <div className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl whitespace-nowrap z-50">
          {label}
        </div>
      )}
      {active && sidebarOpen && (
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
      )}
    </Link>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        const { data: profile } = await supabase
          .from('users_profile')
          .select('role, name')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'TEACHER') {
          router.push('/');
          return;
        }
        setUserProfile({
          name: profile?.name || 'Professor',
          email: session.user.email || ''
        });
      } catch (e) {
        console.error('Erro no checkAuth:', e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-white">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Autenticando...</p>
      </div>
    );
  }

  const menuItems = [
    { href: '/teacher/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/teacher/categories', icon: '📂', label: 'Categorias' },
    { href: '/teacher/courses', icon: '📚', label: 'Meus Cursos' },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} 
        border-r border-slate-800/50 bg-[#020617] transition-all duration-300 flex-col z-30 shadow-2xl relative`}
      >
        <div className={`h-24 flex items-center border-b border-slate-800/50 ${sidebarOpen ? 'justify-start pl-4' : 'justify-center px-2'}`}>
          {sidebarOpen ? (
            <div className="transform scale-[0.65] origin-left">
              <BrandLogo variant="png" size="md" />
            </div>
          ) : (
            <div className="transform scale-75">
              <BrandLogo variant="vertical" size="sm" />
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              sidebarOpen={sidebarOpen}
              active={pathname === item.href || pathname.startsWith(item.href)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white group"
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            <span className={`transform transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`}>
              ➔
            </span>
            {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Recolher menu lateral</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#020617] border-r border-slate-800 z-50 transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-24 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="transform scale-75 origin-left">
            <BrandLogo size="md" />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50"
          >
            ✕
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              sidebarOpen={true}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              {userProfile?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{userProfile?.name}</p>
              <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            🚪 Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-4 md:px-8 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-2"
            >
              ☰
            </button>
            <div className="hidden sm:block text-sm text-slate-400">
              Campus Online / <span className="text-white font-medium capitalize">
                {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-white">{userProfile?.name}</span>
              <span className="text-xs text-slate-500">{userProfile?.email}</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden md:block"></div>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <span>Sair</span>
              <span className="text-lg opacity-60">🚪</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shadow-inner">
              {userProfile?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-[#020617] scroll-smooth">
          <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
