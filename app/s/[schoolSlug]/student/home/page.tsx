'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui';
import { StudentCourseCard } from '@/components/StudentCourseCard';
import { WatchlistButton } from '@/components/WatchlistButton';

interface Course {
    id: string;
    title: string;
    description: string;
    thumb_url: string;
    category_id: string;
}

interface Category {
    id: string;
    name: string;
}

function StudentHomeContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const { schoolSlug } = params;
    const supabase = createClient();

    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [diagnostic, setDiagnostic] = useState<{ top_categories: string[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeHeroIdx, setActiveHeroIdx] = useState(0);

    const loadData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: schoolData } = await supabase.from('schools').select('id').eq('slug', schoolSlug).single();
            if (!schoolData || !session) return;

            const [catRes, diagRes, coursesRes] = await Promise.all([
                supabase.from('category').select('*').eq('school_id', schoolData.id),
                supabase.from('user_diagnostic_results')
                    .select('top_categories')
                    .eq('user_id', session.user.id)
                    .eq('school_id', schoolData.id)
                    .maybeSingle(),
                supabase.from('course').select('*').eq('school_id', schoolData.id).eq('status', 'published').order('created_at', { ascending: false })
            ]);

            setCategories(catRes.data || []);
            setDiagnostic(diagRes.data);
            setCourses(coursesRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [schoolSlug, supabase]);

    useEffect(() => { loadData(); }, [loadData]);

    const featuredCourses = courses.slice(0, 5);
    const searchResults = query ? courses.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase())) : [];

    const nextSlide = useCallback(() => {
        if (featuredCourses.length === 0) return;
        setActiveHeroIdx(prev => (prev + 1) % featuredCourses.length);
    }, [featuredCourses.length]);

    const prevSlide = useCallback(() => {
        if (featuredCourses.length === 0) return;
        setActiveHeroIdx(prev => (prev - 1 + featuredCourses.length) % featuredCourses.length);
    }, [featuredCourses.length]);

    useEffect(() => {
        if (featuredCourses.length <= 1) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [nextSlide, featuredCourses.length]);

    if (loading) return (
        <div className="min-h-screen bg-[#050505] p-20 flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Preparando sua experiência...</p>
        </div>
    );

    const recommendedCourses = courses.filter(course => {
        if (!diagnostic?.top_categories?.length) return false;
        const cat = categories.find(c => c.id === course.category_id);
        if (!cat) return false;
        return diagnostic.top_categories.some(tag =>
            cat.name.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(cat.name.toLowerCase())
        );
    }).slice(0, 5);

    const finalRecommended = recommendedCourses.length > 0 ? recommendedCourses : courses.slice(0, 5);

    const coursesByCategory = categories.map(cat => ({
        ...cat,
        courses: courses.filter(c => c.category_id === cat.id)
    })).filter(g => g.courses.length > 0);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            {!query && featuredCourses.length > 0 && (
                <section className="relative h-[92vh] w-full overflow-hidden group/hero">
                    {featuredCourses.map((course, idx) => (
                        <div key={course.id} className={`absolute inset-0 transition-opacity duration-[1500ms] ${idx === activeHeroIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                            <img
                                src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2000'}
                                alt={course.title}
                                className={`w-full h-full object-cover transition-transform duration-[10000ms] ${idx === activeHeroIdx ? 'scale-110' : 'scale-100'}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent"></div>
                            <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-20 max-w-5xl space-y-6">
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                                    <span className="w-8 h-[2px] bg-blue-600"></span>
                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Destaque da semana</span>
                                </div>
                                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-left-6 duration-1000 delay-500">{course.title}</h1>
                                <p className="text-lg md:text-xl text-slate-300 line-clamp-3 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-700">{course.description || "Inicie sua jornada de aprendizado hoje mesmo."}</p>
                                <div className="flex items-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[900ms]">
                                    <Button variant="white" onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)} className="h-14 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/10 active:scale-95 transition-all">▶ Assista agora</Button>
                                    <WatchlistButton courseId={course.id} schoolSlug={schoolSlug as string} variant="hero" />

                                    <button
                                        onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)}
                                        className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 transition-all active:scale-95"
                                        title="Mais Informações"
                                    >
                                        ⓘ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Navigation Arrows */}
                    <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl opacity-0 group-hover/hero:opacity-100 transition-all border border-white/10">‹</button>
                    <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl opacity-0 group-hover/hero:opacity-100 transition-all border border-white/10">›</button>

                    {/* Slider Indicators - Restored Dots/Lines */}
                    <div className="flex gap-3 absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
                        {featuredCourses.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveHeroIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-700 ease-out ${i === activeHeroIdx ? 'w-12 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'w-3 bg-white/20 hover:bg-white/50'}`}
                                aria-label={`Ir para slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* CONTENT ROWS - Perfectly balanced spacing */}
            <div className={`px-10 md:px-20 space-y-20 pb-20 ${query ? 'pt-10' : 'relative z-20 pt-10 -mt-12 md:-mt-16'}`}>
                {query && (
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col gap-2">
                            <button onClick={() => router.push(`/s/${schoolSlug}/student/home`)} className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors w-fit">← Limpar Busca</button>
                            <h2 className="text-4xl font-black">Resultados para: <span className="text-blue-500">"{query}"</span></h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {searchResults.map(c => <StudentCourseCard key={c.id} course={c} schoolSlug={schoolSlug as string} />)}
                        </div>
                        {searchResults.length === 0 && <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-white/10">Nenhum resultado encontrado.</div>}
                    </section>
                )}

                {!query && (
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black tracking-tight">{diagnostic ? 'Sua Trilha Recomendada' : 'Recomendados para Você'}</h2>
                            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                                {diagnostic ? '🎯 Personalizado' : '🔥 Em Alta'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {finalRecommended.map(c => <StudentCourseCard key={c.id} course={c} schoolSlug={schoolSlug as string} />)}
                        </div>
                    </section>
                )}

                {!query && coursesByCategory.map(group => (
                    <section key={group.id} className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight">{group.name}</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors">Ver todos →</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {group.courses.map(c => <StudentCourseCard key={c.id} course={c} schoolSlug={schoolSlug as string} />)}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

export default function StudentHomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] p-20 flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Iniciando Campus...</p>
        </div>}>
            <StudentHomeContent />
        </Suspense>
    );
}
