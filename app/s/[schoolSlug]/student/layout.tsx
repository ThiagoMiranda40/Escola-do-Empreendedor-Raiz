'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { schoolSlug } = params;
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState('');
    const [userProfile, setUserProfile] = useState<{ name: string; email: string; avatar_url?: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasDiagnostic, setHasDiagnostic] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Don't protect the login page itself
    const isLoginPage = pathname === `/s/${schoolSlug}/student`;

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 1. Fetch School Info
                const { data: schoolData, error: schoolError } = await supabase
                    .from('schools')
                    .select('id, name')
                    .eq('slug', schoolSlug)
                    .single();

                if (schoolError || !schoolData) {
                    if (!isLoginPage) router.push('/');
                    return;
                }
                setSchoolName(schoolName || schoolData.name);

                if (isLoginPage) {
                    setLoading(false);
                    return;
                }

                // 2. Check Auth Session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/s/${schoolSlug}/student`);
                    return;
                }

                // 3. Check Membership
                const { data: memberData } = await supabase
                    .from('school_members')
                    .select('role')
                    .eq('school_id', schoolData.id)
                    .eq('user_id', session.user.id)
                    .single();

                if (!memberData) {
                    await supabase.auth.signOut();
                    router.push(`/s/${schoolSlug}/student`);
                    return;
                }

                // 4. Fetch Profile Data (Name + Avatar)
                const { data: profile } = await supabase
                    .from('users_profile')
                    .select('name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                setUserProfile({
                    name: profile?.name || session.user.email?.split('@')[0] || 'Aluno',
                    email: session.user.email || '',
                    avatar_url: profile?.avatar_url
                });

                // 5. Check Diagnostic Status
                const { data: diagData } = await supabase
                    .from('user_diagnostic_results')
                    .select('onboarding_completed')
                    .eq('school_id', schoolData.id)
                    .eq('user_id', session.user.id)
                    .single();

                if (diagData?.onboarding_completed) {
                    setHasDiagnostic(true);
                }

                setLoading(false);
            } catch (error) {
                console.error('Auth error:', error);
                if (!isLoginPage) router.push(`/s/${schoolSlug}/student`);
            }
        };

        checkAuth();
    }, [schoolSlug, isLoginPage]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/s/${schoolSlug}/student`);
    };

    if (loading && !isLoginPage) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Autenticando Aluno...</p>
                </div>
            </div>
        );
    }

    if (isLoginPage) return <>{children}</>;

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col selection:bg-blue-600/40 text-slate-200">
            {/* Student Topbar - Premium Glassmorphism Style */}
            <header className="h-20 bg-[#050505]/40 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 px-6 md:px-16 flex items-center justify-between border-b border-white/[0.05] transition-all duration-300">
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    <div className="transform scale-[0.65] md:scale-75 origin-left cursor-pointer transition-transform hover:scale-[0.7] md:hover:scale-[0.8]" onClick={() => router.push(`/s/${schoolSlug}/student/home`)}>
                        <BrandLogo variant="png" size="md" />
                    </div>

                    <nav className="hidden md:flex items-center gap-6 whitespace-nowrap">
                        <Link href={`/s/${schoolSlug}/student/home`} className={`text-sm font-bold transition-colors ${pathname.includes('/home') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Início</Link>
                        <Link href={`/s/${schoolSlug}/student/watchlist`} className={`text-sm font-bold transition-colors ${pathname.includes('/watchlist') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Minha Lista</Link>
                        <Link
                            href={`/s/${schoolSlug}/student/discovery`}
                            title={hasDiagnostic ? "Personalize sua jornada de estudos" : "Descubra sua trilha ideal"}
                            className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                        >
                            {hasDiagnostic ? 'Trilha Personalizada ✨' : 'Descobrir Trilha ✨'}
                        </Link>
                        <span className="text-sm font-bold text-slate-600 cursor-not-allowed">Meus Cursos</span>
                        <span className="text-sm font-bold text-slate-600 cursor-not-allowed">Planos</span>
                    </nav>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    {/* Search Trigger Button - Fixed Premium UI Icon-only */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90"
                        title="Buscar"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative group py-4" title={schoolName}>
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black border border-white/10 shadow-lg shadow-blue-500/10 transition-transform group-hover:scale-110 overflow-hidden">
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} alt={userProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                    userProfile?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <span className="text-slate-400 group-hover:text-white transition-colors text-xs hidden lg:block">▼</span>
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full right-0 w-64 bg-[#0c0c0ced] backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-2xl opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50">
                            <div className="space-y-4">
                                <div className="border-b border-white/5 pb-4">
                                    <p className="text-sm font-black text-white truncate">{userProfile?.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-600/20 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md">Aluno Premium</span>
                                </div>

                                <nav className="space-y-1">
                                    <Link
                                        href={`/s/${schoolSlug}/student/profile`}
                                        className="block w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Meu Perfil
                                    </Link>
                                    <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">Minhas Assinaturas</button>
                                    <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">Certificados</button>
                                </nav>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all group/logout"
                                >
                                    <span className="text-xs font-black uppercase tracking-widest">Sair da Conta</span>
                                    <span className="transition-transform group-hover/logout:translate-x-1">🚪</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="fixed top-0 bottom-0 left-0 w-72 bg-[#050505]/95 backdrop-blur-2xl border-r border-white/5 z-[70] p-6 flex flex-col md:hidden animate-in slide-in-from-left duration-300 shadow-2xl">
                        <div className="flex items-center justify-between mb-10">
                            <div className="transform scale-[0.6] origin-left">
                                <BrandLogo variant="png" size="md" />
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white p-1">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <nav className="flex-1 space-y-2">
                            <Link
                                href={`/s/${schoolSlug}/student/home`}
                                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${pathname.includes('/home') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className="text-xl">🏠</span> Início
                            </Link>
                            <Link
                                href={`/s/${schoolSlug}/student/watchlist`}
                                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${pathname.includes('/watchlist') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className="text-xl">➕</span> Minha Lista
                            </Link>
                            <div className="p-4 text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-3">
                                <span>📚</span> Meus Cursos <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-500">EM BREVE</span>
                            </div>
                            <div className="p-4 text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-3">
                                <span>💎</span> Planos <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-500">EM BREVE</span>
                            </div>
                        </nav>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3 p-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black border border-white/10 overflow-hidden">
                                    {userProfile?.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt={userProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        userProfile?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm text-white truncate">{userProfile?.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
                            >
                                <span className="group-hover:translate-x-1 transition-transform">🚪</span> Sair da conta
                            </button>
                        </div>
                    </aside>
                </>
            )}

            {/* Search Overlay - Prime Video Style */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center pt-32 px-6 bg-[#050505]/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white transition-colors"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div className="w-full max-w-3xl space-y-4">
                        <div className="relative flex items-center group">
                            <div className="absolute left-6 text-slate-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="O que você quer aprender hoje?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        setIsSearchOpen(false);
                                        router.push(`/s/${schoolSlug}/student/home?q=${encodeURIComponent(searchQuery)}`);
                                    }
                                }}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-3xl py-6 pl-16 pr-8 text-2xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <p className="text-slate-500 text-sm px-6">Pressione <span className="text-slate-300 font-bold">Enter</span> para buscar.</p>
                    </div>
                </div>
            )}

            <main className="flex-1 pt-20 bg-[#050505]">
                {children}
            </main>
        </div>
    );
}
