'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Input } from '@/components/ui';
import BrandLogo from '@/components/BrandLogo';

export default function SchoolSignupProfessorPage() {
    const router = useRouter();
    const params = useParams();
    const schoolSlug = params.schoolSlug as string;

    const supabase = createClient();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Validate School Slug
            const { data: school, error: schoolError } = await supabase
                .from('schools')
                .select('id')
                .eq('slug', schoolSlug)
                .single();

            if (schoolError || !school) {
                setError('Código da escola inválido. Verifique o link de acesso.');
                setLoading(false);
                return;
            }

            // 2. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'TEACHER',
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (!authData.user) {
                setError('Erro ao criar usuário');
                return;
            }

            // 3. Create School Membership
            const { error: memberError } = await supabase
                .from('school_members')
                .insert({
                    school_id: school.id,
                    user_id: authData.user.id,
                    role: 'TEACHER'
                });

            if (memberError) {
                console.error('Error creating membership:', memberError);
                // Non-blocking error for user, but should be logged. 
                // In a perfect world, we might want to rollback auth user creation or retry.
            }

            // 4. Handle Redirection / Confirmation
            if (authData.session) {
                router.push('/teacher/dashboard');
            } else {
                setError('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-blue-500/30 overflow-hidden">
            {/* Background Decorative Circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px]"></div>
            </div>

            <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <div className="flex flex-col items-center mb-10 text-center">
                    <BrandLogo size="md" className="mb-6" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Comece sua Jornada</h1>

                    <div className="mt-3 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-wide">
                            Escola: {schoolSlug || 'Carregando...'}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-3xl">
                    {error && (
                        <div className={`mb-6 p-4 rounded-xl text-sm ${error.includes('Cadastro realizado')
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200'
                            : 'bg-red-500/20 border border-red-400 text-red-200'
                            }`}>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSignup} className="space-y-5">
                        <Input
                            label="Nome Completo"
                            type="text"
                            placeholder="Ex: João Silva"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />

                        <Input
                            label="E-mail"
                            type="email"
                            placeholder="nome@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <Input
                                label="Confirmar Senha"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="flex items-center gap-3 py-2 px-1">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-5 h-5 rounded-lg border-slate-800 bg-slate-950/50 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                required
                            />
                            <label htmlFor="terms" className="text-xs text-slate-400">
                                Li e concordo com os <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors underline">Termos de Uso</a> e <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors underline">Políticas de Privacidade</a>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Criando sua conta...
                                    </>
                                ) : 'Começar a Ensinar Agora'}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-sm">
                            Já possui uma conta?{' '}
                            <Link
                                href={`/s/${schoolSlug}/login`}
                                className="text-white font-bold hover:text-indigo-400 transition-colors underline underline-offset-4"
                            >
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-600 text-[10px] tracking-widest uppercase italic">
                    Campus Online — Powering the next generation of educators
                </p>
            </div>
        </div>
    );
}
