'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';

export default function ManageCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { school, loading: schoolLoading } = useSchool();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { showToast } = useToast();

    useEffect(() => {
        if (!schoolLoading && school) {
            loadCourse();
        }
    }, [id, school, schoolLoading]);

    const loadCourse = async () => {
        if (!school) return;
        const { data } = await supabase
            .from('course')
            .select(`
        *,
        category ( name )
      `)
            .eq('id', id)
            .eq('school_id', school.id)
            .single();

        if (data) setCourse(data);
        setLoading(false);
    };

    const handleToggleStatus = async () => {
        if (!school) return;
        const newStatus = course.status === 'draft' ? 'published' : 'draft';
        try {
            const { error } = await supabase
                .from('course')
                .update({ status: newStatus })
                .eq('id', id)
                .eq('school_id', school.id); // Ensure scoping

            if (error) throw error;
            showToast(`Curso ${newStatus === 'published' ? 'publicado' : 'movido para rascunho'}!`);
            loadCourse();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!course) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Curso não encontrado</h2>
            <Link href="/teacher/courses">
                <Button variant="ghost" className="mt-4">Voltar para lista</Button>
            </Link>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Course Header */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] -mr-48 -mt-48 pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>

                <div className="flex flex-col md:flex-row gap-10 relative z-10">
                    <div className="w-full md:w-80 shrink-0 aspect-video rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                        {course.thumb_url ? (
                            <img src={course.thumb_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold italic">Sem Thumbnail</div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant={course.status}>{course.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge>
                            <Badge variant="info">{course.category?.name}</Badge>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">{course.title}</h1>

                        <p className="text-slate-400 text-lg line-clamp-2 max-w-2xl">{course.description || 'Sem descrição cadastrada.'}</p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href={`/teacher/courses/${id}/edit`}>
                                <Button className="rounded-2xl">✏️ Editar Informações</Button>
                            </Link>
                            <Button
                                variant="secondary"
                                className="rounded-2xl border-slate-700 bg-slate-800"
                                onClick={handleToggleStatus}
                            >
                                {course.status === 'published' ? '💿 Pausar Curso' : '🚀 Publicar Agora'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex border-b border-slate-800 gap-8 overflow-x-auto no-scrollbar">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Visão Geral</TabButton>
                    <TabButton active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')}>Conteúdo (Módulos)</TabButton>
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>Configurações</TabButton>
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <StatsMiniCard label="Total de Aulas" value="0" icon="📺" />
                        <StatsMiniCard label="Minutos de Vídeo" value="0" icon="⏱️" />
                        <StatsMiniCard label="Materiais" value="0" icon="📎" />

                        <div className="md:col-span-3 bg-slate-900/30 border border-slate-800 p-8 rounded-[2rem]">
                            <h3 className="text-xl font-bold text-white mb-4">Sobre este curso</h3>
                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {course.description || 'Nenhuma descrição detalhada fornecida.'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div className="bg-slate-900/30 border border-slate-800 p-12 rounded-[2rem] text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-5xl opacity-20 mb-4">🛠️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Editor de Currículo</h3>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">Em breve você poderá gerenciar módulos e aulas diretamente por aqui.</p>
                        <Button variant="outline" disabled>Em breve</Button>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h3 className="text-xl font-bold text-white">Configurações Avançadas</h3>
                        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <p className="font-bold text-red-500 text-lg">Zona de Perigo</p>
                                <p className="text-slate-400 text-sm">Excluir este curso removerá permanentemente todas as suas aulas e dados associados.</p>
                            </div>
                            <Button variant="danger" className="shrink-0">Excluir Curso</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${active ? 'text-blue-500' : 'text-slate-500 hover:text-white'
                }`}
        >
            {children}
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full animate-in zoom-in duration-300"></div>}
        </button>
    );
}

function StatsMiniCard({ label, value, icon }: { label: string, value: string, icon: string }) {
    return (
        <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">{icon}</div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
        </div>
    );
}
