'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';

interface Module {
    id: string;
    title: string;
    order_index: number;
    course_id: string;
}

interface Course {
    id: string;
    title: string;
}

export default function CourseModulesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: courseId } = use(params);
    const supabase = createClient();
    const router = useRouter();
    const { school, loading: schoolLoading } = useSchool();
    const { showToast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [moduleTitle, setModuleTitle] = useState('');

    useEffect(() => {
        if (!schoolLoading && school) {
            loadData();
        }
    }, [courseId, school, schoolLoading]);

    const loadData = async () => {
        if (!school) return;
        try {
            // 1. Load Course and verify ownership/tenant
            const { data: courseData, error: courseError } = await supabase
                .from('course')
                .select('id, title')
                .eq('id', courseId)
                .eq('school_id', school.id)
                .single();

            if (courseError || !courseData) {
                showToast('Curso não encontrado ou sem permissão', 'error');
                router.push('/teacher/courses');
                return;
            }
            setCourse(courseData);

            // 2. Load Modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('module')
                .select('*')
                .eq('course_id', courseId)
                .eq('school_id', school.id)
                .order('order_index', { ascending: true });

            if (modulesError) throw modulesError;
            setModules(modulesData || []);
        } catch (error: any) {
            console.error('Erro ao carregar módulos:', error);
            showToast('Erro ao carregar dados', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !moduleTitle.trim()) return;

        setIsSaving(true);
        try {
            if (editingModule) {
                // Update
                const { error } = await supabase
                    .from('module')
                    .update({ title: moduleTitle.trim() })
                    .eq('id', editingModule.id)
                    .eq('school_id', school.id);

                if (error) throw error;
                showToast('Módulo atualizado com sucesso');
            } else {
                // Create
                const { error } = await supabase
                    .from('module')
                    .insert([{
                        title: moduleTitle.trim(),
                        course_id: courseId,
                        school_id: school.id,
                        order_index: modules.length > 0 ? Math.max(...modules.map(m => m.order_index)) + 1 : 0
                    }]);

                if (error) throw error;
                showToast('Módulo criado com sucesso');
            }

            setModuleTitle('');
            setEditingModule(null);
            setShowForm(false);
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas vinculadas também serão removidas.')) return;

        try {
            const { error } = await supabase
                .from('module')
                .delete()
                .eq('id', moduleId)
                .eq('school_id', school?.id);

            if (error) throw error;
            showToast('Módulo excluído');
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const moveModule = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === modules.length - 1) return;

        const newModules = [...modules];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        const temp = newModules[index].order_index;
        newModules[index].order_index = newModules[targetIndex].order_index;
        newModules[targetIndex].order_index = temp;

        setModules([...newModules].sort((a, b) => a.order_index - b.order_index));

        try {
            // Update both in DB
            const updates = [
                supabase.from('module').update({ order_index: newModules[index].order_index }).eq('id', newModules[index].id).eq('school_id', school?.id),
                supabase.from('module').update({ order_index: newModules[targetIndex].order_index }).eq('id', newModules[targetIndex].id).eq('school_id', school?.id)
            ];
            await Promise.all(updates);
        } catch (error: any) {
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
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest">
                        <Link href="/teacher/courses" className="hover:text-blue-400 transition-colors">Cursos</Link>
                        <span>/</span>
                        <span className="text-slate-300">{course?.title}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Gerenciar Módulos</h1>
                </div>
                <Button
                    onClick={() => {
                        setEditingModule(null);
                        setModuleTitle('');
                        setShowForm(true);
                    }}
                    className="rounded-full shadow-lg shadow-blue-500/20"
                >
                    ＋ Adicionar Módulo
                </Button>
            </div>

            {/* Form Overlay/Modal (Simple) */}
            {showForm && (
                <div className="bg-slate-900/60 border border-slate-700/50 p-8 rounded-[2rem] backdrop-blur-xl animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        {editingModule ? '📝 Editar Módulo' : '🆕 Novo Módulo'}
                    </h3>
                    <form onSubmit={handleSaveModule} className="flex flex-col md:flex-row gap-4">
                        <Input
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                            placeholder="Ex: Introdução ao Mercado"
                            className="bg-slate-950/50 border-slate-800 rounded-2xl flex-1 text-lg py-6"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSaving} className="rounded-2xl px-8 h-auto font-bold">
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-2xl px-6 h-auto">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
                {modules.length === 0 ? (
                    <div className="bg-slate-900/20 border border-dashed border-slate-800 p-20 rounded-[3rem] text-center space-y-4">
                        <div className="text-6xl opacity-10">🧩</div>
                        <h3 className="text-xl font-bold text-slate-400">Nenhum módulo criado</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Comece organizando seu conteúdo em módulos para facilitar o aprendizado dos seus alunos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {modules.map((module, index) => (
                            <div key={module.id} className="group bg-slate-900/40 border border-slate-800/50 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-blue-500/5">
                                {/* Order / Handle */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-lg font-black text-slate-500 border border-slate-700/50 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveModule(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                                            title="Subir"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => moveModule(index, 'down')}
                                            disabled={index === modules.length - 1}
                                            className="p-1 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                                            title="Descer"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{module.title}</h3>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            📦 ID: <span className="text-slate-600 overflow-hidden text-ellipsis w-16 whitespace-nowrap">{module.id}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <Link href={`/teacher/courses/${courseId}/modules/${module.id}/lessons`}>
                                        <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700 rounded-xl px-4 font-bold hover:bg-blue-600 hover:text-white transition-all">
                                            📖 Gerenciar Aulas
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingModule(module);
                                            setModuleTitle(module.title);
                                            setShowForm(true);
                                        }}
                                        className="rounded-xl hover:bg-slate-800"
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteModule(module.id)}
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
