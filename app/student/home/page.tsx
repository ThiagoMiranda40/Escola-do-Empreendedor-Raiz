'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('category')
        .select('*')
        .order('sort_order');
      setCategories(categoriesData || []);

      // Carregar cursos publicados
      const { data: coursesData } = await supabase
        .from('course')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sem categoria';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Campus Online</h1>
          <p className="text-blue-100">Aprenda com os melhores cursos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-300">
            <p className="text-lg mb-4">Nenhum curso publicado ainda</p>
            <p className="text-sm">Volte em breve para ver novos cursos!</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Cursos Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/student/course/${course.id}`}
                  className="block bg-slate-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105"
                >
                  {course.thumb_url && (
                    <img
                      src={course.thumb_url}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-blue-400 mb-1">{getCategoryName(course.category_id)}</p>
                    <h3 className="font-bold text-white mb-2 line-clamp-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">{course.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
