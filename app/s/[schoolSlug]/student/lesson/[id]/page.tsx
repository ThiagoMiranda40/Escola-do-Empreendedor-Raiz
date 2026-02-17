'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button, Badge } from '@/components/ui';

interface Lesson {
    id: string;
    title: string;
    description: string;
    video_url: string;
    panda_embed: string;
    course_id: string;
}

interface Resource {
    id: string;
    title: string;
    type: 'LINK' | 'FILE';
    url?: string;
    file_path?: string;
}

export default function StudentLessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug, id: lessonId } = params;
    const supabase = createClient();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLessonData = async () => {
            try {
                // 1. Load Lesson (ensure it's published)
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lesson')
                    .select('*')
                    .eq('id', lessonId)
                    .eq('status', 'published')
                    .single();

                if (lessonError || !lessonData) {
                    router.push(`/s/${schoolSlug}/student/home`);
                    return;
                }
                setLesson(lessonData);

                // 2. Load Resources
                const { data: resourcesData } = await supabase
                    .from('resource')
                    .select('*')
                    .eq('lesson_id', lessonId)
                    .order('order_index', { ascending: true });

                setResources(resourcesData || []);
            } catch (error) {
                console.error('Error loading lesson player:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLessonData();
    }, [lessonId, schoolSlug]);

    if (loading) return (
        <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
            <div className="aspect-video w-full bg-slate-900 rounded-[2.5rem]"></div>
            <div className="h-10 w-1/2 bg-slate-900 rounded-lg"></div>
            <div className="h-4 w-1/4 bg-slate-900 rounded-lg"></div>
        </div>
    );

    if (!lesson) return null;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    onClick={() => router.push(`/s/${schoolSlug}/student/course/${lesson.course_id}`)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                >
                    ← Voltar para o Curso
                </Button>
                <Badge variant="info">Assistindo</Badge>
            </div>

            {/* Video Player Section */}
            <div className="aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl shadow-blue-500/5 relative group">
                {(() => {
                    const embedCode = lesson.panda_embed;
                    const videoUrl = lesson.video_url;

                    if (embedCode && embedCode.includes('<iframe')) {
                        return <div className="w-full h-full" dangerouslySetInnerHTML={{
                            __html: embedCode.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"')
                        }} />;
                    }

                    if (videoUrl) {
                        let embedUrl = '';
                        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                            const match = videoUrl.match(regExp);
                            if (match && match[2].length === 11) {
                                embedUrl = `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
                            }
                        } else if (videoUrl.includes('vimeo.com')) {
                            const vimeoId = videoUrl.split('/').pop();
                            embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
                        }

                        if (embedUrl) {
                            return (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            );
                        }
                    }

                    return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 gap-4 p-20 text-center">
                            <span className="text-6xl opacity-20">🎥</span>
                            <div>
                                <h3 className="text-xl font-bold opacity-40">Vídeo não disponível</h3>
                                <p className="text-sm opacity-30 mt-1 italic">O conteúdo está sendo processado ou o link é inválido.</p>
                            </div>
                        </div>
                    );
                })()}

                {/* Glass decoration */}
                <div className="absolute inset-0 pointer-events-none border-t border-white/5 rounded-[2.5rem]"></div>
            </div>

            {/* Context & Description */}
            <div className="flex flex-col md:flex-row gap-12 mt-8">
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white leading-tight">{lesson.title}</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">{lesson.description || 'Sem descrição adicional para esta aula.'}</p>
                    </div>
                </div>

                {/* Sidebar: Materials */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] space-y-6 backdrop-blur-sm">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            📦 Materiais Complementares
                        </h4>

                        <div className="space-y-3">
                            {resources.map(res => (
                                <a
                                    key={res.id}
                                    href={res.type === 'LINK' ? res.url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesson-resources/${res.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-4 bg-slate-950/50 hover:bg-blue-600/10 border border-slate-800 group hover:border-blue-500/30 rounded-2xl transition-all"
                                >
                                    <span className="text-xl">{res.type === 'LINK' ? '🔗' : '📄'}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{res.title}</span>
                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{res.type === 'LINK' ? 'Link Externo' : 'Download'}</span>
                                    </div>
                                </a>
                            ))}

                            {resources.length === 0 && (
                                <div className="text-center py-10 opacity-30 italic">
                                    <p className="text-sm text-slate-500 font-bold">Em breve</p>
                                    <p className="text-[10px] uppercase tracking-tighter">Nenhum material anexo até o momento.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[2rem] text-center">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Suporte ao Aluno</p>
                        <p className="text-xs text-slate-500 mb-4">Dúvidas sobre o conteúdo?</p>
                        <Button variant="ghost" size="sm" className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold">
                            Chamar Professor
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
