'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button, Badge } from '@/components/ui';

interface Lesson {
    id: string;
    title: string;
    status: string;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    description: string;
    thumb_url: string;
}

export default function StudentCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug, id: courseId } = params;
    const supabase = createClient();

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCourseData = async () => {
            try {
                // 1. Load Course (ensure it's published)
                const { data: courseData, error: courseError } = await supabase
                    .from('course')
                    .select('*')
                    .eq('id', courseId)
                    .eq('status', 'published')
                    .single();

                if (courseError || !courseData) {
                    router.push(`/s/${schoolSlug}/student/home`);
                    return;
                }
                setCourse(courseData);

                // 2. Load Modules and Lessons
                const { data: modulesData } = await supabase
                    .from('module')
                    .select('*')
                    .eq('course_id', courseId)
                    .order('order_index', { ascending: true });

                const { data: lessonsData } = await supabase
                    .from('lesson')
                    .select('*')
                    .eq('course_id', courseId)
                    .eq('status', 'published') // Students only see published lessons
                    .order('order_index', { ascending: true });

                const groupedModules = (modulesData || [])
                    .map(m => ({
                        ...m,
                        lessons: (lessonsData || []).filter(l => l.module_id === m.id)
                    }))
                    .filter(m => m.lessons.length > 0); // Hide modules with no published lessons

                setModules(groupedModules);
            } catch (error) {
                console.error('Error loading course detail:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCourseData();
    }, [courseId, schoolSlug]);

    if (loading) return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
            <div className="h-64 bg-slate-900 rounded-[3rem]"></div>
            <div className="h-10 w-1/3 bg-slate-900 rounded-lg"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-900 rounded-2xl"></div>)}
            </div>
        </div>
    );

    if (!course) return null;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="relative h-[400px] w-full rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-2xl">
                <img
                    src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 flex flex-col items-start gap-4">
                    <Button onClick={() => router.push(`/s/${schoolSlug}/student/home`)} variant="ghost" size="sm" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-xl mb-4">
                        ← Voltar ao Catálogo
                    </Button>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">{course.title}</h1>
                    <p className="text-slate-300 max-w-2xl text-lg line-clamp-2">{course.description}</p>
                    <div className="flex gap-4 mt-2">
                        <Badge variant="published">Publicado</Badge>
                        <span className="text-slate-400 text-sm font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {modules.length} Módulos
                        </span>
                    </div>
                </div>
            </div>

            {/* Syllabus Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    Conteúdo do Curso
                    <span className="h-1 w-12 bg-blue-600 rounded-full"></span>
                </h2>

                <div className="space-y-6">
                    {modules.map((module, mIdx) => (
                        <div key={module.id} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-sm font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">Módulo {mIdx + 1}</span>
                                <h3 className="text-xl font-bold text-white">{module.title}</h3>
                            </div>

                            <div className="space-y-2">
                                {module.lessons.map((lesson, lIdx) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => router.push(`/s/${schoolSlug}/student/lesson/${lesson.id}`)}
                                        className="w-full flex items-center justify-between p-5 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 hover:border-blue-500/30 rounded-[1.5rem] group transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                                                {lIdx + 1}
                                            </div>
                                            <span className="font-bold text-slate-200 group-hover:text-white group-hover:translate-x-1 transition-all">
                                                {lesson.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">Assistir Agora</span>
                                            <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                                ▶
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {modules.length === 0 && (
                        <div className="p-10 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aguardando aulas serem publicadas...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
