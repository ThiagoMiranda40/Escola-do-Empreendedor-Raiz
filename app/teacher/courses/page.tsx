'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateCoursePublication } from '@/lib/course-publishing';
import { triggerSuccessConfetti } from '@/lib/confetti';

interface Course {
    id: string;
    title: string;
    slug: string;
    thumb_url: string | null;
    status: 'draft' | 'published';
    category: {
        name: string;
    };
    module_count: number;
    published_lesson_count: number;
    access_model: 'OPEN' | 'ENTITLEMENT_REQUIRED';
    course_tier: string;
}

const GET_READINESS = (course: Course) => {
    if (course.status === 'published') return { label: 'Publicado', color: 'bg-emerald-500' };
    if (course.module_count === 0) return { label: 'Sem conteúdo', color: 'bg-slate-700' };
    if (course.published_lesson_count === 0) return { label: 'Incompleto', color: 'bg-amber-700' };
    return { label: 'Pronto para publicar', color: 'bg-blue-600' };
};

const GET_TIER_LABEL = (tier: string) => {
    const labels: Record<string, string> = {
        'TIER_1': 'Base',
        'TIER_2': 'Pro',
        'TIER_3': 'Certificação',
        'TIER_4': 'Formação',
        'TIER_5': 'Pós-graduação'
    };
    return labels[tier] || tier;
};

export default function CoursesPage() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { school, userRole, loading: schoolLoading } = useSchool();

    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const { showToast } = useToast();

    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam && (statusParam === 'published' || statusParam === 'draft')) {
            setFilterStatus(statusParam);
        }

        if (!schoolLoading && school && userRole) {
            loadData();
        }
    }, [school, schoolLoading, userRole, searchParams]);

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !school) return;

            // Load Categories for filter
            const { data: catData } = await supabase
                .from('category')
                .select('id, name')
                .eq('school_id', school.id)
                .order('name');
            setCategories(catData || []);

            // Load Courses with counts
            let query = supabase
                .from('course')
                .select(`
                    id, title, slug, thumb_url, status, access_model, course_tier, required_entitlement_key,
                    category ( name ),
                    module!course_id(count),
                    lesson!course_id(count)
                `)
                .eq('school_id', school.id)
                .eq('lesson.status', 'published') // This filters the nested lesson count
                .order('created_at', { ascending: false });

            // If not ADMIN, only see own courses
            if (userRole !== 'ADMIN') {
                query = query.eq('teacher_id', session.user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map and format results correctly
            const formattedCourses = (data as any[] || []).map(course => ({
                ...course,
                module_count: course.module?.[0]?.count || 0,
                published_lesson_count: course.lesson?.[0]?.count || 0,
                required_entitlement_key: (course as any).required_entitlement_key // Added to formatted object
            }));

            setCourses(formattedCourses);
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar cursos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (courseId: string, currentStatus: string) => {
        if (!school) return;
        const newStatus = currentStatus === 'draft' ? 'published' : 'draft';

        // MVP validation: only if trying to PUBLISH
        if (newStatus === 'published') {
            setIsProcessing(courseId);
            try {
                const validation = await validateCoursePublication(supabase, courseId, school.id);
                if (!validation.isValid) {
                    showToast(
                        `Para publicar, adicione ao menos 1 módulo e 1 aula publicada.\n\nFaltando: ${validation.errors.join(' ')}`,
                        'error',
                        {
                            label: '✏️ Editar Curso',
                            onClick: () => router.push(`/teacher/courses/${courseId}`)
                        }
                    );
                    return;
                }
            } catch (err) {
                showToast('Erro ao realizar validação técnica.', 'error');
                return;
            } finally {
                setIsProcessing(null);
            }
        }

        try {
            const { error } = await supabase
                .from('course')
                .update({ status: newStatus })
                .eq('id', courseId)
                .eq('school_id', school.id);

            if (error) throw error;
            if (newStatus === 'published') triggerSuccessConfetti();
            showToast(`Curso ${newStatus === 'published' ? 'publicado' : 'movido para rascunho'}!`);
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este curso? Esta ação é irreversível.')) return;

        try {
            const { error } = await supabase
                .from('course')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Curso excluído com sucesso');
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'all' || course.category?.name === categories.find(c => c.id === filterCategory)?.name;
        const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-48 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-10 w-32 bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Meus Cursos</h1>
                    <p className="text-slate-400 mt-1">Gerencie seu catálogo de cursos e aulas.</p>
                </div>
                <Link href="/teacher/courses/new">
                    <Button className="rounded-full">＋ Criar Novo Curso</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    placeholder="Buscar por título..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-slate-900/30 border-slate-800/50 rounded-2xl"
                />
                <Select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    options={[{ value: 'all', label: 'Todas as Categorias' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                    className="bg-slate-900/30 border-slate-800/50 rounded-2xl"
                />
                <Select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    options={[
                        { value: 'all', label: 'Todos os Status' },
                        { value: 'published', label: 'Publicados' },
                        { value: 'draft', label: 'Rascunhos' },
                    ]}
                    className="bg-slate-900/30 border-slate-800/50 rounded-2xl"
                />
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
                <div className="bg-slate-900/20 border border-dashed border-slate-800 p-20 rounded-3xl text-center space-y-4">
                    <div className="text-5xl opacity-20">📚</div>
                    <h3 className="text-xl font-bold text-slate-400">Nenhum curso encontrado</h3>
                    <p className="text-slate-500 text-sm">Ajuste os filtros ou crie seu primeiro curso agora mesmo.</p>
                    <Link href="/teacher/courses/new" className="inline-block pt-4">
                        <Button variant="outline">Começar a criar</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {filteredCourses.map((course) => {
                        const readiness = GET_READINESS(course);
                        const canPublish = readiness.label === 'Pronto para publicar';
                        const isPublished = course.status === 'published';

                        return (
                            <div key={course.id} className="group bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col">
                                <div className="relative aspect-video bg-slate-800 overflow-hidden">
                                    {course.thumb_url ? (
                                        <img src={course.thumb_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-lg italic">
                                            Sem Imagem
                                        </div>
                                    )}
                                    {/* Status Badge: Top-Left (Minimalist) */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shadow-xl text-white border border-white/10 ${readiness.color}`}>
                                            {readiness.label}
                                        </div>
                                    </div>

                                    {/* Business Badges: Top-Right (Compact) */}
                                    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
                                        <div className="px-2 py-1 bg-slate-950/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">
                                            🏆 {GET_TIER_LABEL(course.course_tier)}
                                        </div>
                                        {(course as any).required_entitlement_key?.startsWith('COURSE:') && (
                                            <div className="px-2 py-1 bg-slate-950/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20">
                                                🎯 Avulso
                                            </div>
                                        )}
                                        {course.access_model === 'OPEN' && (
                                            <div className="px-2 py-1 bg-slate-950/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                                                🔓 Grátis
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                                        {course.category?.name || 'Sem Categoria'}
                                        <span className="text-slate-600 mx-2">•</span>
                                        <span className="text-slate-500">{course.module_count} Módulos</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{course.title}</h3>

                                    <div className="mt-auto space-y-2">
                                        <Link href={`/teacher/courses/${course.id}`} className="block">
                                            <Button variant="secondary" size="md" className="w-full bg-slate-800 border-slate-700 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-lg">
                                                ✏️ Editar Curso
                                            </Button>
                                        </Link>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link href={`/teacher/courses/${course.id}?tab=settings`} className="block">
                                                <Button variant="outline" size="sm" className="w-full border-slate-800 hover:bg-slate-800/50">⚙️ Configurações</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(course.id, course.status)}
                                                disabled={isProcessing === course.id || (!isPublished && !canPublish)}
                                                className={`font-bold ${isPublished ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-slate-900/50 text-slate-500'}`}
                                            >
                                                {isProcessing === course.id ? '⌛...' : (isPublished ? '💿 Pausar' : '🚀 Publicar')}
                                            </Button>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(course.id)}
                                            className="w-full text-xs text-slate-600 hover:text-red-500 hover:bg-red-500/5"
                                        >
                                            🗑️ Excluir Curso
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
