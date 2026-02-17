'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  status: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumb_url: string;
  category_id: string;
}

export default function StudentCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      // Carregar curso
      const { data: courseData, error: courseError } = await supabase
        .from('course')
        .select('*')
        .eq('id', courseId)
        .eq('status', 'published')
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Carregar módulos
      const { data: modulesData } = await supabase
        .from('module')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      // Carregar aulas para cada módulo
      if (modulesData) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module) => {
            const { data: lessonsData } = await supabase
              .from('lesson')
              .select('*')
              .eq('module_id', module.id)
              .eq('status', 'published')
              .order('order_index');

            return {
              ...module,
              lessons: lessonsData || [],
            };
          })
        );

        setModules(modulesWithLessons);
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>;
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center">
          <p className="text-lg mb-4">Curso não encontrado</p>
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/student/home"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Voltar
          </Link>
          <div className="flex gap-6">
            {course.thumb_url && (
              <img
                src={course.thumb_url}
                alt={course.title}
                className="w-48 h-48 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-blue-100 mb-4">{course.description}</p>
              )}
              <p className="text-sm text-blue-200">{modules.length} módulo(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {modules.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-300">
            <p>Nenhum módulo disponível neste curso</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="bg-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-700 transition text-white"
                >
                  <h2 className="font-bold text-lg">{module.title}</h2>
                  <span className="text-sm text-slate-400">
                    {module.lessons.length} aula(s) {expandedModules.has(module.id) ? '▼' : '▶'}
                  </span>
                </button>

                {expandedModules.has(module.id) && (
                  <div className="border-t border-slate-700 p-6 space-y-3">
                    {module.lessons.length === 0 ? (
                      <p className="text-slate-400 text-sm">Nenhuma aula publicada</p>
                    ) : (
                      module.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/student/lesson/${lesson.id}`}
                          className="block p-4 bg-slate-700 rounded hover:bg-slate-600 transition text-white"
                        >
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-xs text-slate-400 mt-1">Aula {lesson.order_index + 1}</p>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
