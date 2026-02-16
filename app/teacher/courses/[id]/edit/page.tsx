'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase-client';
import CourseForm from '../../course-form';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createClient();
    const { id } = use(params);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCourse = async () => {
            const { data } = await supabase
                .from('course')
                .select('*')
                .eq('id', id)
                .single();

            if (data) setCourse(data);
            setLoading(false);
        };

        loadCourse();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!course) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Curso não encontrado</h2>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Editar Curso</h1>
                <p className="text-slate-400 mt-1">Atualize as informações do seu curso.</p>
            </div>

            <CourseForm initialData={course} isEditing={true} />
        </div>
    );
}
