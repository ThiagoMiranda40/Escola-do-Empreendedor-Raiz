'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WatchlistButton } from './WatchlistButton';

interface Course {
    id: string;
    title: string;
    description: string;
    thumb_url: string;
    category_id: string;
    access_model?: string;
    course_tier?: string;
}

export function StudentCourseCard({ course, schoolSlug }: { course: Course, schoolSlug: string }) {
    const router = useRouter();

    const [isHovered, setIsHovered] = useState(false);
    let hoverTimeout: any;

    const handleMouseEnter = () => {
        hoverTimeout = setTimeout(() => setIsHovered(true), 400);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeout);
        setIsHovered(false);
    };

    return (
        <div
            className="relative aspect-video"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Base Card (Always Visible) */}
            <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-white/5 transition-opacity duration-300">
                <img
                    src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600'}
                    className="w-full h-full object-cover"
                    alt={course.title}
                />
            </div>

            {/* Expanded Hover Card (Amazon Prime Style) */}
            {isHovered && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] z-[100] bg-[#0c0c0c] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 duration-200"
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Link href={`/s/${schoolSlug}/student/course/${course.id}`}>
                        <div className="aspect-video relative">
                            <img
                                src={course.thumb_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'}
                                className="w-full h-full object-cover"
                                alt={course.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent"></div>
                        </div>
                    </Link>

                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg"
                            >
                                <span className="text-sm">▶</span>
                            </button>
                            <WatchlistButton
                                courseId={course.id}
                                schoolSlug={schoolSlug}
                            />
                            <button
                                onClick={() => router.push(`/s/${schoolSlug}/student/course/${course.id}`)}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-all text-xs"
                            >
                                ⓘ
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-black text-white text-base leading-tight">{course.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <span className="text-emerald-400">98% Relevante</span>
                                <span className="text-slate-500 uppercase px-1 border border-slate-700 rounded-sm">HD</span>
                                <span className="text-slate-500">{course.course_tier === 'TIER_5' ? 'Pós-graduação' : 'Curso'}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {course.description || "Inicie sua jornada de aprendizado hoje mesmo com este conteúdo exclusivo preparado para você."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
