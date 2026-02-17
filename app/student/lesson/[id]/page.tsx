'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  description: string;
  panda_embed: string;
  video_url: string;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'file';
}

export default function StudentLessonPage() {
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    try {
      // Carregar aula
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson')
        .select('*')
        .eq('id', lessonId)
        .eq('status', 'published')
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Carregar módulo
      const { data: moduleData } = await supabase
        .from('module')
        .select('*')
        .eq('id', lessonData.module_id)
        .single();

      setModule(moduleData);

      // Carregar recursos
      const { data: resourcesData } = await supabase
        .from('resource')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at');

      setResources(resourcesData || []);
    } catch (error) {
      console.error('Erro ao carregar aula:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>;
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center">
          <p className="text-lg mb-4">Aula não encontrada</p>
          <Link
            href="/student/home"
            className="text-blue-400 hover:underline"
          >
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto">
          {module && (
            <Link
              href={`/student/course/${module.course_id}`}
              className="text-blue-400 hover:text-blue-300 mb-2 inline-block"
            >
              ← Voltar
            </Link>
          )}
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {module && (
            <p className="text-slate-400 mt-1">Módulo: {module.title}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Video Player */}
        {lesson.panda_embed ? (
          <div className="bg-slate-800 rounded-lg overflow-hidden mb-8">
            <div
              dangerouslySetInnerHTML={{ __html: lesson.panda_embed }}
              className="w-full"
            />
          </div>
        ) : lesson.video_url ? (
          <div className="bg-slate-800 rounded-lg overflow-hidden mb-8 aspect-video">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400 mb-8">
            <p>Nenhum vídeo disponível para esta aula</p>
          </div>
        )}

        {/* Description */}
        {lesson.description && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 text-white">
            <h2 className="font-bold text-lg mb-4">Sobre esta aula</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{lesson.description}</p>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 text-white">
            <h2 className="font-bold text-lg mb-4">Materiais da Aula</h2>
            <div className="space-y-3">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-700 rounded hover:bg-slate-600 transition"
                >
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {resource.type === 'file' ? '📄 Arquivo' : '🔗 Link'}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
