'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { Input } from '@/components/ui';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Forçar redirecionamento direto
            window.location.href = '/teacher/dashboard';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-blue-500/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-10">
                    <BrandLogo size="lg" className="mb-6 scale-125" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Portal do Professor</h1>
                    <p className="text-slate-400 mt-2">Gestão simplificada do seu Campus.</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl shadow-3xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                            label="E-mail de Acesso"
                            type="email"
                            placeholder="seu-email@escola.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-slate-300">Senha Secreta</label>
                                <a href="#" className="text-xs text-blue-500 hover:text-blue-400 font-medium tracking-tight">Recuperar acesso</a>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Validando credenciais...
                                </span>
                            ) : 'Acessar Área do Professor'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-sm">
                            Ainda não tem acesso?{' '}
                            <Link
                                href="/signup-professor"
                                className="text-white font-bold hover:text-blue-400 transition-colors underline underline-offset-4"
                            >
                                Criar conta de gestão
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-600 text-xs tracking-widest uppercase">
                    © 2026 Campus Online
                </p>
            </div>
        </div>
    );
}
