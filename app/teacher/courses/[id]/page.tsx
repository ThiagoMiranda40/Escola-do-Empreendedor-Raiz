'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';
import { createClient } from '@/lib/supabase-client';
import CurriculumBuilder from './curriculum-builder';
import CourseForm from '../course-form';
import { triggerSuccessConfetti } from '@/lib/confetti';
import { useSearchParams, useRouter } from 'next/navigation';

const GET_READINESS = (course: any) => {
    if (course.status === 'published') return { label: 'Publicado', color: 'bg-emerald-500' };
    if (course.module_count === 0) return { label: 'Sem conteúdo', color: 'bg-slate-700' };
    if (course.published_lesson_count === 0) return { label: 'Incompleto', color: 'bg-amber-700' };
    return { label: 'Pronto para publicar', color: 'bg-blue-600' };
};

export default function ManageCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const router = useRouter();
    const { school, loading: schoolLoading } = useSchool();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { showToast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'curriculum', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

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
                category ( name ),
                module!course_id(count),
                lesson!course_id(count)
            `)
            .eq('id', id)
            .eq('school_id', school.id)
            .eq('lesson.status', 'published')
            .single();

        if (data) {
            setCourse({
                ...data,
                module_count: data.module?.[0]?.count || 0,
                published_lesson_count: data.lesson?.[0]?.count || 0
            });
        }
        setLoading(false);
    };

    const handleToggleStatus = async () => {
        if (!school || !course) return;
        const newStatus = course.status === 'draft' ? 'published' : 'draft';

        if (newStatus === 'published') {
            const readiness = GET_READINESS(course);
            if (readiness.label !== 'Pronto para publicar') {
                showToast(
                    `Opa! Faltam requisitos para publicar:\n${readiness.label === 'Sem conteúdo' ? 'Adicione ao menos 1 módulo.' : 'Publique ao menos 1 aula.'}`,
                    'error'
                );
                return;
            }
        }
        // ... (existing toggle logic)

        try {
            const { error } = await supabase
                .from('course')
                .update({ status: newStatus })
                .eq('id', id)
                .eq('school_id', school.id);

            if (error) throw error;
            if (newStatus === 'published') triggerSuccessConfetti();
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
        <div className="space-y-6 pb-12">
            <Link href="/teacher/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors group">
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                <span className="font-bold text-sm uppercase tracking-widest">Voltar para Meus Cursos</span>
            </Link>

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
                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shadow-lg text-white border border-white/10 ${GET_READINESS(course).color}`}>
                                {GET_READINESS(course).label}
                            </div>
                            <Badge variant="info">{course.category?.name}</Badge>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">{course.title}</h1>

                        <p className="text-slate-400 text-lg line-clamp-2 max-w-2xl">{course.description || 'Sem descrição cadastrada.'}</p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button
                                onClick={() => setActiveTab('curriculum')}
                                className="rounded-2xl px-8"
                            >
                                📚 Gerenciar Aulas
                            </Button>

                            <Button
                                variant="secondary"
                                className="rounded-2xl border-slate-700 bg-slate-800/50"
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
                        <StatsMiniCard label="Total de Módulos" value={course.module_count.toString()} icon="📚" />
                        <StatsMiniCard label="Aulas Publicadas" value={course.published_lesson_count.toString()} icon="📺" />
                        <StatsMiniCard label="Status do Curso" value={course.status === 'published' ? 'No Ar' : 'Rascunho'} icon="🚀" />

                        <div className="md:col-span-3 bg-slate-900/30 border border-slate-800 p-8 rounded-[2rem]">
                            <h3 className="text-xl font-bold text-white mb-4">Sobre este curso</h3>
                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {course.description || 'Nenhuma descrição detalhada fornecida.'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {school && <CurriculumBuilder courseId={id} schoolId={school.id} onUpdate={loadCourse} />}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CourseForm
                            initialData={course}
                            isEditing={true}
                            onSuccess={() => {
                                loadCourse();
                                setActiveTab('overview');
                            }}
                        />

                        <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                            <h3 className="text-xl font-bold text-white">Configurações Avançadas</h3>
                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <p className="font-bold text-red-500 text-lg">Zona de Perigo</p>
                                    <p className="text-slate-400 text-sm">Excluir este curso removerá permanentemente todas as suas aulas e dados associados.</p>
                                </div>
                                <Button
                                    variant="danger"
                                    className="shrink-0"
                                    onClick={async () => {
                                        if (confirm('Tem certeza que deseja excluir este curso permanentemente? Esta ação não pode ser desfeita.')) {
                                            try {
                                                const { error } = await supabase
                                                    .from('course')
                                                    .delete()
                                                    .eq('id', id)
                                                    .eq('school_id', school?.id);

                                                if (error) throw error;

                                                showToast('Curso excluído com sucesso');
                                                router.push('/teacher/courses');
                                            } catch (err: any) {
                                                showToast(err.message, 'error');
                                            }
                                        }
                                    }}
                                >
                                    Excluir Curso
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-8 mt-12 border-t border-slate-800/50 flex justify-center">
                <Link href="/teacher/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors group">
                    <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="font-bold text-sm uppercase tracking-widest">Voltar para Meus Cursos</span>
                </Link>
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
