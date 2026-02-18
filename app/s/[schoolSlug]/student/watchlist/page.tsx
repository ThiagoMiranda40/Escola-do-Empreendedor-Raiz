'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { StudentCourseCard } from '@/components/StudentCourseCard';

interface Course {
    id: string;
    title: string;
    description: string;
    thumb_url: string;
    category_id: string;
    access_model?: string;
    course_tier?: string;
}

export default function WatchlistPage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug } = params;
    const supabase = createClient();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWatchlist = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/s/${schoolSlug}/student`);
                    return;
                }

                // 1. Fetch items in watchlist for this user/school
                const { data: watchlistData } = await supabase
                    .from('course_watchlist')
                    .select('course_id')
                    .eq('user_id', session.user.id);

                if (!watchlistData || watchlistData.length === 0) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                const courseIds = watchlistData.map(item => item.course_id);

                // 2. Fetch course details
                const { data: coursesData } = await supabase
                    .from('course')
                    .select('*')
                    .in('id', courseIds)
                    .eq('status', 'published');

                setCourses(coursesData || []);
            } catch (error) {
                console.error('Error loading watchlist:', error);
            } finally {
                setLoading(false);
            }
        };

        loadWatchlist();
    }, [schoolSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] py-12 px-8 md:px-16 space-y-12">
            <header className="space-y-4">
                <h1 className="text-4xl font-black text-white tracking-tight">Minha Lista</h1>
                <p className="text-slate-500 max-w-2xl text-lg">
                    Conteúdos que você salvou para assistir mais tarde. Curadoria personalizada feita por você.
                </p>
            </header>

            {courses.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {courses.map(course => (
                        <StudentCourseCard key={course.id} course={course} schoolSlug={schoolSlug as string} />
                    ))}
                </div>
            ) : (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
                    <div className="text-6xl">➕</div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Sua lista está vazia</h2>
                        <p className="text-slate-500">Navegue pelos cursos e clique no botão "+" para salvar conteúdos aqui.</p>
                    </div>
                    <button
                        onClick={() => router.push(`/s/${schoolSlug}/student/home`)}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-500/10"
                    >
                        Explorar Cursos
                    </button>
                </div>
            )}
        </div>
    );
}
