'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui';

interface UserProfile {
    name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
}

interface DiagnosticResult {
    onboarding_completed: boolean;
    top_categories: string[];
}

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug } = params;
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form States
    const [newName, setNewName] = useState('');
    const [newBio, setNewBio] = useState('');

    const profileMap: Record<string, { label: string; icon: string; description: string }> = {
        'marketing': { label: 'Growth & Vendas', icon: '📈', description: 'Foco em escalar resultados e domínio de funis.' },
        'gestão': { label: 'Estratega de Gestão', icon: '📊', description: 'Visão sistêmica e eficiência operacional.' },
        'ia': { label: 'Visionário Tech & IA', icon: '🤖', description: 'Pioneiro na implementação de tecnologias disruptivas.' },
        'vendas': { label: 'Closer de Vendas', icon: '💰', description: 'Especialista em negociação e alta conversão.' },
        'branding': { label: 'Especialista em Marca', icon: '🎨', description: 'Construção de autoridade e valor percebido.' },
        'liderança': { label: 'Líder de Pessoas', icon: '🤝', description: 'Desenvolvimento de talentos e cultura de alto nível.' },
        'equipes': { label: 'Líder de Pessoas', icon: '🤝', description: 'Desenvolvimento de talentos e cultura de alto nível.' },
    };

    const loadProfileData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/s/${schoolSlug}/student`);
                return;
            }

            const { data: schoolData } = await supabase
                .from('schools')
                .select('id')
                .eq('slug', schoolSlug)
                .single();

            if (!schoolData) return;

            // Load Profile
            const { data: profileData, error: profileError } = await supabase
                .from('users_profile')
                .select('name, avatar_url, bio')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.warn('Profile not found, using session defaults');
            }

            setProfile({
                name: profileData?.name || session.user.email?.split('@')[0] || 'Aluno',
                email: session.user.email || '',
                avatar_url: profileData?.avatar_url,
                bio: profileData?.bio
            });
            setNewName(profileData?.name || '');
            setNewBio(profileData?.bio || '');

            // Load Diagnostic
            const { data: diagData } = await supabase
                .from('user_diagnostic_results')
                .select('onboarding_completed, top_categories')
                .eq('user_id', session.user.id)
                .eq('school_id', schoolData.id)
                .maybeSingle();

            setDiagnostic(diagData);

        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [schoolSlug, supabase, router]);

    const handleUpdateProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('users_profile')
            .upsert({
                id: session.user.id,
                name: newName,
                bio: newBio,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Update error:', error);
            alert(`Erro ao salvar: ${error.message}`);
        } else {
            setProfile(prev => prev ? { ...prev, name: newName, bio: newBio } : null);
            setIsEditing(false);
            window.location.reload();
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB.');
                return;
            }

            setUploading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                if ('status' in uploadError && uploadError.status === 404) {
                    throw new Error('O sistema de armazenamento (bucket "avatars") ainda não foi criado no Supabase.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('users_profile')
                .upsert({
                    id: session.user.id,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                });

            if (updateError) throw updateError;

            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
            window.location.reload();
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert(error.message || 'Erro ao carregar imagem.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const mainCategory = diagnostic?.top_categories?.[0]?.toLowerCase() || '';
    const userRole = profileMap[mainCategory] || { label: 'Membro Campus', icon: '🎓', description: 'Em busca de evolução contínua.' };

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20">
            {/* Header / Hero Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
                <div className="absolute inset-0 backdrop-blur-3xl"></div>

                <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
                        {/* Avatar - FULL CLICKABLE AREA */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative group cursor-pointer"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-black border-4 border-white/10 shadow-2xl shadow-blue-500/20 overflow-hidden transition-transform duration-500 group-hover:scale-105 active:scale-95">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    profile?.name?.charAt(0).toUpperCase()
                                )}

                                {/* Centered Camera Overlay */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <span className="text-3xl">📷</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">Editar Foto</span>
                                </div>

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-2">{profile?.name}</h1>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">{profile?.email}</p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="h-10 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-slate-950 hover:bg-white/90 transition-all shadow-xl active:scale-95 flex items-center justify-center"
                                >
                                    Editar Perfil
                                </button>

                                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    <span className="text-blue-500">💎</span> Aluno Premium
                                </div>

                                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                                    Membro desde 2026
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-6 relative z-20">
                {/* Profile Settings Card */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bio Section */}
                    {!isEditing && profile?.bio && (
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-lg animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 ml-1">Sobre mim</h3>
                            <p className="text-xl text-slate-300 font-medium leading-relaxed italic">
                                "{profile.bio}"
                            </p>
                        </div>
                    )}

                    {isEditing && (
                        <div id="edit-form" className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in slide-in-from-top-4 duration-500 scroll-mt-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black">Configurações do Perfil</h3>
                                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest">Fechar</button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nome de Exibição</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                                        placeholder="Como quer ser chamado?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Sua Bio (Apresentação)</label>
                                    <textarea
                                        value={newBio}
                                        onChange={(e) => setNewBio(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg focus:outline-none focus:border-blue-500/50 transition-all font-bold min-h-[140px] resize-none"
                                        placeholder="Conte um pouco sobre sua jornada e objetivos..."
                                    />
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-2">Sua bio ajuda outros alunos a te conhecerem melhor.</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleUpdateProfile} className="flex-1 h-14 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Salvar Alterações</Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)} className="px-8 h-14 rounded-2xl font-black text-lg border-white/10 hover:bg-white/5 transition-all">Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnostic / Persona Card */}
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="relative">
                                <div className="text-7xl md:text-8xl">{userRole.icon}</div>
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1.5 shadow-lg">
                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <p className="text-blue-500 font-black uppercase tracking-widest text-[10px] mb-1 ml-1">Seu Perfil de Aluno</p>
                                    <h2 className="text-3xl md:text-5xl font-black">{userRole.label}</h2>
                                </div>
                                <p className="text-slate-400 text-base md:text-xl font-medium leading-relaxed max-w-lg">
                                    {userRole.description}
                                </p>
                                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                                    <Button
                                        onClick={() => router.push(`/s/${schoolSlug}/student/discovery`)}
                                        className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest border border-white/10 hover:border-blue-500/50 bg-transparent text-white w-full sm:w-auto transition-all"
                                    >
                                        Refazer Diagnóstico
                                    </Button>
                                    <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                                        Sincronizado com seu momento atual
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Placeholders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-3xl">📚</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progresso</span>
                            </div>
                            <div>
                                <h4 className="text-4xl font-black">12</h4>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Aulas concluídas</p>
                            </div>
                        </div>
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-3xl">⏱️</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foco</span>
                            </div>
                            <div>
                                <h4 className="text-4xl font-black">48h</h4>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tempo de estudo</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="space-y-8">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 space-y-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Preferências</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group/pref cursor-pointer">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm group-hover:text-white transition-colors">Notificações</p>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">E-mails e novidades</p>
                                </div>
                                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                                    <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between group/pref cursor-pointer">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm group-hover:text-white transition-colors">Perfil Público</p>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Visível na comunidade</p>
                                </div>
                                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                                    <div className="absolute left-1 top-0.5 w-4 h-4 bg-slate-500 rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <Button variant="outline" className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 border-red-500/10 hover:border-red-500/30 transition-all">
                                Redefinir Dados
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-white/10 rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">💡</span>
                            <h4 className="font-black text-xs uppercase tracking-widest">Networking</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Mantenha sua bio atualizada para atrair conexões que buscam os mesmos objetivos que você.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
