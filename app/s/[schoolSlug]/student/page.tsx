'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import BrandLogo from '@/components/BrandLogo';

export default function StudentLoginPage() {
    const router = useRouter();
    const params = useParams();
    const { schoolSlug } = params;
    const { showToast } = useToast();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign in
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Validate school & role
            const { data: schoolData, error: schoolError } = await supabase
                .from('schools')
                .select('id')
                .eq('slug', schoolSlug)
                .single();

            if (schoolError || !schoolData) throw new Error('Escola não encontrada');

            const { data: memberData, error: memberError } = await supabase
                .from('school_members')
                .select('role')
                .eq('school_id', schoolData.id)
                .eq('user_id', authData.user.id)
                .single();

            if (memberError || !memberData) {
                // Not a member of THIS school
                await supabase.auth.signOut();
                throw new Error('Você não tem acesso a esta escola. Entre em contato com o suporte.');
            }

            if (memberData.role !== 'STUDENT' && memberData.role !== 'ADMIN' && memberData.role !== 'TEACHER') {
                await supabase.auth.signOut();
                throw new Error('Acesso negado: Perfil inválido.');
            }

            showToast('Bem-vindo!', 'success');
            router.push(`/s/${schoolSlug}/student/home`);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col items-center gap-4">
                    <BrandLogo />
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Área do Aluno</h1>
                        <p className="text-slate-500 text-sm mt-1">Acesse seus cursos e conteúdos</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-xl">
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                    />
                    <Input
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-4"
                    >
                        Entrar na Plataforma
                    </Button>
                </form>

                <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest font-black">
                    Campus Online &copy; 2026
                </p>
            </div>
        </div>
    );
}
