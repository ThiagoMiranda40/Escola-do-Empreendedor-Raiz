'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { schoolSlug } = params;
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState('');
    const [user, setUser] = useState<any>(null);

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
                setSchoolName(schoolData.name);

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
                setUser(session.user);

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

                setLoading(false);
            } catch (error) {
                console.error('Auth error:', error);
                if (!isLoginPage) router.push(`/s/${schoolSlug}/student`);
            }
        };

        checkAuth();
    }, [schoolSlug, isLoginPage]);

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
            {/* Student Topbar - Streaming Style */}
            <header className="h-16 bg-[#050505]/80 backdrop-blur-2xl fixed top-0 left-0 right-0 z-50 px-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-8">
                    <div className="transform scale-75 origin-left cursor-pointer transition-transform hover:scale-[0.8]" onClick={() => router.push(`/s/${schoolSlug}/student/home`)}>
                        <BrandLogo variant="png" size="md" />
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href={`/s/${schoolSlug}/student/home`} className={`text-sm font-bold transition-colors ${pathname.includes('/home') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Início</Link>
                        <span className="text-sm font-bold text-slate-600 cursor-not-allowed">Meus Cursos</span>
                        <span className="text-sm font-bold text-slate-600 cursor-not-allowed">Planos</span>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Aluno</span>
                        <span className="text-xs font-bold text-white leading-none whitespace-nowrap">{user?.email?.split('@')[0]}</span>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black border border-white/10 shadow-lg" title={schoolName}>
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="ml-2 p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                        title="Sair"
                    >
                        🚪
                    </button>
                </div>
            </header>

            <main className="flex-1 pt-16 bg-[#050505]">
                {children}
            </main>
        </div>
    );
}
