'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui';

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

export default function StudentHomePage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug } = params;
    const supabase = createClient();

    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeHeroIdx, setActiveHeroIdx] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('slug', schoolSlug)
                    .single();

                if (!schoolData) return;

                const { data: catData } = await supabase
                    .from('category')
                    .select('*')
                    .eq('school_id', schoolData.id);
                setCategories(catData || []);

                const { data: coursesData } = await supabase
                    .from('course')
                    .select('*')
                    .eq('school_id', schoolData.id)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                setCourses(coursesData || []);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [schoolSlug]);

    const featuredCourses = courses.slice(0, 5);

    const nextSlide = useCallback(() => {
        if (featuredCourses.length === 0) return;
        setActiveHeroIdx(prev => (prev + 1) % featuredCourses.length);
    }, [featuredCourses.length]);

    const prevSlide = useCallback(() => {
        if (featuredCourses.length === 0) return;
        setActiveHeroIdx(prev => (prev - 1 + featuredCourses.length) % featuredCourses.length);
    }, [featuredCourses.length]);

    // Timer for auto-slide
    useEffect(() => {
        if (featuredCourses.length <= 1) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [nextSlide, featuredCourses.length]);

    if (loading) return (
        <div className="p-8 space-y-12 animate-pulse bg-[#050505] min-h-screen">
            <div className="h-[60vh] bg-slate-900 rounded-[3rem]"></div>
            <div className="space-y-4">
                <div className="h-8 w-48 bg-slate-900 rounded-lg"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-video bg-slate-900 rounded-2xl"></div>)}
                </div>
            </div>
        </div>
    );

    const coursesByCategory = categories.map(cat => ({
        ...cat,
        courses: courses.filter(c => c.category_id === cat.id)
    })).filter(group => group.courses.length > 0);

    const recentCourses = courses.slice(0, 10);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            {/* HERO BANNER - Streaming Style with Crossfade */}
            {featuredCourses.length > 0 && (
                <section className="relative h-[90vh] w-full overflow-hidden group/hero">
                    {featuredCourses.map((course, idx) => (
                        <div
                            key={course.id}
                            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${idx === activeHeroIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            {/* Background Image */}
                            <img
                                src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2000'}
                                alt={course.title}
                                className={`w-full h-full object-cover transition-transform duration-[10000ms] ${idx === activeHeroIdx ? 'scale-110' : 'scale-100'}`}
                            />

                            {/* Overlays for depth and text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent"></div>
                            {/* Bottom fade: increased height and blur effect */}
                            <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
                            <div className="absolute inset-x-0 bottom-0 h-40 backdrop-blur-[2px] mask-gradient"></div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 max-w-5xl space-y-6">
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                                    <span className="w-8 h-[2px] bg-blue-600"></span>
                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Destaque da semana</span>
                                </div>

                                <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter animate-in fade-in slide-in-from-left-6 duration-1000 delay-500">
                                    {course.title}
                                </h1>

                                <p className="text-lg md:text-xl text-slate-300 line-clamp-3 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-700">
                                    {course.description || "Inicie sua jornada de aprendizado hoje mesmo com este conteúdo exclusivo preparado para você."}
                                </p>

                                <div className="flex items-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[900ms]">
                                    <Button
                                        onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)}
                                        className="bg-white text-black hover:bg-white/90 h-14 px-10 rounded-2xl font-black text-lg flex items-center gap-3 active:scale-95 transition-all shadow-2xl shadow-blue-500/10"
                                    >
                                        <span className="text-xl">▶</span> Assista agora
                                    </Button>

                                    <button className="group w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-2xl hover:bg-white/20 transition-all active:scale-95" title="Adicionar à minha lista">
                                        <span className="group-hover:scale-125 transition-transform">+</span>
                                    </button>

                                    <button
                                        onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)}
                                        className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 transition-all active:scale-95"
                                        title="Informações"
                                    >
                                        ⓘ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-light text-white opacity-20 group-hover/hero:opacity-100 transition-all duration-300 border border-white/10 active:scale-90"
                    >
                        ‹
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-light text-white opacity-20 group-hover/hero:opacity-100 transition-all duration-300 border border-white/10 active:scale-90"
                    >
                        ›
                    </button>

                    {/* Slider Indicators - Clickable */}
                    <div className="flex gap-3 absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
                        {featuredCourses.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveHeroIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-700 ease-out shadow-lg ${i === activeHeroIdx ? 'w-12 bg-white' : 'w-3 bg-white/20 hover:bg-white/50'}`}
                                aria-label={`Ir para slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* CONTENT ROWS - Balanced spacing for smoother transition */}
            <div className="px-8 md:px-16 -mt-16 relative z-20 space-y-20">

                {/* RECENTLY ADDED */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white tracking-tight">Adicionados recentemente</h2>
                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors">Ver todos →</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                        {recentCourses.map(course => (
                            <Link
                                key={course.id}
                                href={`/s/${schoolSlug}/student/course/${course.id}`}
                                className="group relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 hover:scale-110 hover:z-30 transition-all duration-500 shadow-2xl"
                            >
                                <img
                                    src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000'}
                                    className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-500"
                                    alt={course.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <h3 className="font-black text-sm text-white line-clamp-1">{course.title}</h3>
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Acessar conteúdo</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* BY CATEGORY */}
                {coursesByCategory.map(group => (
                    <section key={group.id} className="space-y-6">
                        <h2 className="text-2xl font-black text-white tracking-tight">{group.name}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                            {group.courses.map(course => (
                                <Link
                                    key={course.id}
                                    href={`/s/${schoolSlug}/student/course/${course.id}`}
                                    className="group relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 hover:scale-110 hover:z-30 transition-all duration-500 shadow-2xl shadow-black"
                                >
                                    <img
                                        src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000'}
                                        className="w-full h-full object-cover group-hover:opacity-60 transition-opacity duration-500"
                                        alt={course.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <h3 className="font-black text-sm text-white line-clamp-1">{course.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-emerald-400 font-black">RECOMENDADO</span>
                                            <span className="text-[10px] text-white/40">⭐ 5.0</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}

                {courses.length === 0 && (
                    <div className="py-40 text-center space-y-4">
                        <span className="text-6xl opacity-10">🎬</span>
                        <h3 className="text-2xl font-black opacity-30">Nenhum conteúdo disponível ainda</h3>
                        <p className="text-slate-600">Sua escola está preparando os melhores materiais para você.</p>
                    </div>
                )}
            </div>

            <footer className="mt-40 border-t border-white/5 py-16 text-center">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.8em]">Campus Online Streaming &copy; 2026</p>
                <div className="mt-4 flex justify-center gap-6 opacity-20 hover:opacity-50 transition-opacity">
                    <span className="text-xs font-bold cursor-pointer">Termos de Uso</span>
                    <span className="text-xs font-bold cursor-pointer">Privacidade</span>
                    <span className="text-xs font-bold cursor-pointer">Ajuda</span>
                </div>
            </footer>

            <style jsx global>{`
                .mask-gradient {
                    mask-image: linear-gradient(to top, black, transparent);
                    -webkit-mask-image: linear-gradient(to top, black, transparent);
                }
            `}</style>
        </div>
    );
}
