'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';

interface Lesson {
    id: string;
    title: string;
    description: string;
    video_url: string;
    panda_embed: string;
    status: 'draft' | 'published';
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    course_id: string;
}

interface Course {
    id: string;
    title: string;
}

export default function ModuleLessonsPage({ params }: { params: Promise<{ id: string, moduleId: string }> }) {
    const { id: courseId, moduleId } = use(params);
    const supabase = createClient();
    const { school, loading: schoolLoading } = useSchool();
    const { showToast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [module, setModule] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        video_url: '',
        panda_embed: '',
        status: 'draft' as 'draft' | 'published'
    });

    useEffect(() => {
        if (!schoolLoading && school) {
            loadData();
        }
    }, [courseId, moduleId, school, schoolLoading]);

    const loadData = async () => {
        if (!school) return;
        try {
            console.log('[Lessons] Loading data for:', { courseId, moduleId, schoolId: school.id });

            // 1. Carregar curso e validar escola
            const { data: courseData, error: courseError } = await supabase
                .from('course')
                .select('id, title, school_id')
                .eq('id', courseId)
                .single();

            if (courseError || !courseData) {
                console.error('[Lessons] Course lookup failed:', courseError);
                throw new Error(`Curso não encontrado nesta escola (ID: ${courseId})`);
            }

            if (courseData.school_id !== school.id) {
                throw new Error('Este curso pertence a outro tenant/escola.');
            }
            setCourse(courseData);

            // 2. Carregar módulo e validar relação com curso
            const { data: moduleData, error: moduleError } = await supabase
                .from('module')
                .select('id, title, course_id, school_id')
                .eq('id', moduleId)
                .single();

            if (moduleError || !moduleData) {
                console.error('[Lessons] Module lookup failed:', moduleError);
                throw new Error(`Módulo não encontrado (ID: ${moduleId})`);
            }

            if (moduleData.course_id !== courseId) {
                throw new Error('Este módulo não pertence ao curso informado.');
            }
            setModule(moduleData);

            // 3. Carregar aulas
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lesson')
                .select('*')
                .eq('module_id', moduleId)
                .order('order_index', { ascending: true });

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);

        } catch (error: any) {
            console.error('[Lessons] Fatal error:', error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !formData.title.trim()) return;

        setIsSaving(true);
        try {
            if (editingLesson) {
                const { error } = await supabase
                    .from('lesson')
                    .update({
                        title: formData.title.trim(),
                        description: formData.description,
                        video_url: formData.video_url,
                        panda_embed: formData.panda_embed,
                        status: formData.status
                    })
                    .eq('id', editingLesson.id)
                    .eq('school_id', school.id);

                if (error) throw error;
                showToast('Aula atualizada');
            } else {
                const { error } = await supabase
                    .from('lesson')
                    .insert([{
                        ...formData,
                        module_id: moduleId,
                        course_id: courseId,
                        school_id: school.id,
                        order_index: lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 0
                    }]);

                if (error) throw error;
                showToast('Aula criada com sucesso');
            }

            resetForm();
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            video_url: '',
            panda_embed: '',
            status: 'draft'
        });
        setEditingLesson(null);
        setShowForm(false);
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula?')) return;

        try {
            const { error } = await supabase
                .from('lesson')
                .delete()
                .eq('id', lessonId)
                .eq('school_id', school?.id);

            if (error) throw error;
            showToast('Aula excluída');
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const toggleLessonStatus = async (lesson: Lesson) => {
        const newStatus = lesson.status === 'published' ? 'draft' : 'published';
        try {
            const { error } = await supabase
                .from('lesson')
                .update({ status: newStatus })
                .eq('id', lesson.id)
                .eq('school_id', school?.id);

            if (error) throw error;
            showToast(`Aula ${newStatus === 'published' ? 'publicada' : 'em rascunho'}`);
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const moveLesson = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === lessons.length - 1) return;

        const newLessons = [...lessons];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const tempIndex = newLessons[index].order_index;
        newLessons[index].order_index = newLessons[targetIndex].order_index;
        newLessons[targetIndex].order_index = tempIndex;

        setLessons([...newLessons].sort((a, b) => a.order_index - b.order_index));

        try {
            await Promise.all([
                supabase.from('lesson').update({ order_index: newLessons[index].order_index }).eq('id', newLessons[index].id).eq('school_id', school?.id),
                supabase.from('lesson').update({ order_index: newLessons[targetIndex].order_index }).eq('id', newLessons[targetIndex].id).eq('school_id', school?.id)
            ]);
        } catch (error) {
            showToast('Erro ao reordenar', 'error');
            loadData();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <Link href="/teacher/courses" className="hover:text-blue-400 transition-colors">Cursos</Link>
                        <span>/</span>
                        <Link href={`/teacher/courses/${courseId}/modules`} className="hover:text-blue-400 transition-colors max-w-[150px] truncate">{course?.title}</Link>
                        <span>/</span>
                        <span className="text-slate-300">{module?.title}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Gerenciar Aulas</h1>
                </div>
                <Button onClick={() => setShowForm(true)} className="rounded-full shadow-lg shadow-blue-500/20">＋ Nova Aula</Button>
            </div>

            {/* Form Overlay */}
            {showForm && (
                <div className="bg-slate-900/60 border border-slate-700/50 p-8 rounded-[2rem] backdrop-blur-xl animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <h3 className="text-xl font-bold text-white mb-6">
                        {editingLesson ? '📝 Editar Aula' : '🆕 Criar Nova Aula'}
                    </h3>
                    <form onSubmit={handleSaveLesson} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Título da Aula</label>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="bg-slate-950/50 border-slate-800 rounded-2xl"
                                        placeholder="Ex: Introdução ao Mercado"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px]"
                                        placeholder="Breve resumo do que será ensinado..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">URL do Vídeo (Opcional)</label>
                                    <Input
                                        value={formData.video_url}
                                        onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                        className="bg-slate-950/50 border-slate-800 rounded-2xl"
                                        placeholder="Link direto ou YouTube"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Embed Code (Panda/YouTube)</label>
                                    <Input
                                        value={formData.panda_embed}
                                        onChange={e => setFormData({ ...formData, panda_embed: e.target.value })}
                                        className="bg-slate-950/50 border-slate-800 rounded-2xl font-mono text-xs"
                                        placeholder='<iframe src="..."></iframe>'
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status:</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: 'draft' })}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${formData.status === 'draft' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Rascunho
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: 'published' })}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${formData.status === 'published' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Publicado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4 justify-end">
                            <Button type="button" variant="ghost" onClick={resetForm} className="rounded-2xl px-6 h-12">Cancelar</Button>
                            <Button type="submit" disabled={isSaving} className="rounded-2xl px-12 h-12 font-bold shadow-xl shadow-blue-500/20">
                                {isSaving ? 'Salvando...' : 'Salvar Aula'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lessons List */}
            <div className="space-y-4">
                {lessons.length === 0 ? (
                    <div className="bg-slate-900/20 border border-dashed border-slate-800 p-20 rounded-[3rem] text-center space-y-4">
                        <div className="text-6xl opacity-10">🎬</div>
                        <h3 className="text-xl font-bold text-slate-400">Nenhuma aula cadastrada</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Módulos vazios não aparecem para os alunos. Adicione sua primeira aula agora!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {lessons.map((lesson, index) => (
                            <div key={lesson.id} className="group bg-slate-900/40 border border-slate-800/50 p-5 rounded-[1.5rem] hover:border-blue-500/30 transition-all flex flex-col md:flex-row items-center gap-6">
                                {/* Order Controls */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => moveLesson(index, 'up')} disabled={index === 0} className="p-0.5 hover:text-blue-500 disabled:opacity-30">▲</button>
                                        <button onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1} className="p-0.5 hover:text-blue-500 disabled:opacity-30">▼</button>
                                    </div>
                                </div>

                                {/* Lesson Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{lesson.title}</h3>
                                        <Badge variant={lesson.status}>{lesson.status === 'published' ? 'Ativa' : 'Rascunho'}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1 italic">{lesson.description || 'Sem descrição.'}</p>
                                </div>

                                {/* Visual Indicator of Content */}
                                <div className="flex gap-2 shrink-0">
                                    {lesson.video_url || lesson.panda_embed ? (
                                        <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">🎥 Vídeo Ok</div>
                                    ) : (
                                        <div className="px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-500 uppercase tracking-widest">⚠️ Sem Vídeo</div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleLessonStatus(lesson)}
                                        className={`rounded-xl px-4 font-bold ${lesson.status === 'published' ? 'hover:bg-amber-500/10 hover:text-amber-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                                    >
                                        {lesson.status === 'published' ? '💿 Pausar' : '🚀 Publicar'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingLesson(lesson);
                                            setFormData({
                                                title: lesson.title,
                                                description: lesson.description || '',
                                                video_url: lesson.video_url || '',
                                                panda_embed: lesson.panda_embed || '',
                                                status: lesson.status
                                            });
                                            setShowForm(true);
                                        }}
                                        className="rounded-xl hover:bg-slate-800"
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="rounded-xl text-red-500 hover:bg-red-500/10"
                                    >
                                        🗑️
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
