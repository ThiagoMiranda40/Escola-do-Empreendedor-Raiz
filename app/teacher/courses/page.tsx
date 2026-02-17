'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Select, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchool } from '@/lib/school-context-provider';

interface Course {
    id: string;
    title: string;
    slug: string;
    thumb_url: string | null;
    status: 'draft' | 'published';
    category: {
        name: string;
    };
}

export default function CoursesPage() {
    const supabase = createClient();
    const { school, loading: schoolLoading } = useSchool();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const { showToast } = useToast();

    useEffect(() => {
        if (!schoolLoading && school) {
            loadData();
        }
    }, [school, schoolLoading]);

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

            // Load Courses
            const { data, error } = await supabase
                .from('course')
                .select(`
          id, title, slug, thumb_url, status,
          category ( name )
        `)
                .eq('teacher_id', session.user.id)
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCourses(data as any || []);
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar cursos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (courseId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
        try {
            const { error } = await supabase
                .from('course')
                .update({ status: newStatus })
                .eq('id', courseId);

            if (error) throw error;
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
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="group bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col">
                            <div className="relative aspect-video bg-slate-800 overflow-hidden">
                                {course.thumb_url ? (
                                    <img src={course.thumb_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-lg italic">
                                        Sem Imagem
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <Badge variant={course.status}>{course.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">{course.category?.name || 'Sem Categoria'}</div>
                                <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{course.title}</h3>

                                <div className="mt-auto grid grid-cols-2 gap-2">
                                    <Link href={`/teacher/courses/${course.id}`} className="block">
                                        <Button variant="secondary" size="sm" className="w-full">Gerenciar</Button>
                                    </Link>
                                    <Link href={`/teacher/courses/${course.id}/edit`} className="block">
                                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleStatus(course.id, course.status)}
                                        className="col-span-1 bg-slate-800/50 hover:bg-slate-800 font-medium"
                                    >
                                        {course.status === 'published' ? '💿 Pausar' : '🚀 Publicar'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(course.id)}
                                        className="col-span-1 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                        🗑️ Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
