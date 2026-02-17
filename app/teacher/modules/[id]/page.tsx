'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSchool } from '@/lib/school-context-provider';

interface Lesson {
  id: string;
  title: string;
  description: string;
  panda_embed: string;
  status: 'draft' | 'published';
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

export default function ModuleEditPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const { school, loading: schoolLoading } = useSchool();

  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    panda_embed: '',
  });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolLoading && school) {
      loadModule();
    }
  }, [school, schoolLoading]);

  const loadModule = async () => {
    if (!school) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Carregar módulo
      const { data: moduleData, error: moduleError } = await supabase
        .from('module')
        .select(`
          *,
          course:course_id (teacher_id)
        `)
        .eq('id', moduleId)
        .eq('school_id', school.id) // Ensure scoping
        .single();

      if (moduleError) throw moduleError;

      // Verificar se o professor é o dono
      if (moduleData.course.teacher_id !== session.user.id) {
        router.push('/teacher/courses');
        return;
      }

      setModule(moduleData);

      // Carregar aulas
      const { data: lessonsData } = await supabase
        .from('lesson')
        .select('*')
        .eq('module_id', moduleId)
        .eq('school_id', school.id) // Ensure scoping
        .order('sort_order');

      setLessons(lessonsData || []);
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
      router.push('/teacher/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) {
      alert('Escola não identificada');
      return;
    }

    if (!lessonForm.title) {
      alert('Título é obrigatório');
      return;
    }

    try {
      if (editingLessonId) {
        // Atualizar
        const { error } = await supabase
          .from('lesson')
          .update(lessonForm)
          .eq('id', editingLessonId)
          .eq('school_id', school.id); // Ensure scoping

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('lesson')
          .insert([
            {
              ...lessonForm,
              module_id: moduleId,
              sort_order: lessons.length,
              status: 'draft',
              school_id: school.id // Add school_id
            },
          ]);

        if (error) throw error;
      }

      setLessonForm({ title: '', description: '', panda_embed: '' });
      setEditingLessonId(null);
      setShowLessonForm(false);
      loadModule();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Erro ao salvar aula');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      panda_embed: lesson.panda_embed,
    });
    setEditingLessonId(lesson.id);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return;
    if (!school) return;

    try {
      const { error } = await supabase
        .from('lesson')
        .delete()
        .eq('id', lessonId)
        .eq('school_id', school.id); // Ensure scoping

      if (error) throw error;
      loadModule();
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      alert('Erro ao deletar aula');
    }
  };

  const handleToggleLessonStatus = async (lessonId: string, currentStatus: string) => {
    if (!school) return;
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';

    try {
      const { error } = await supabase
        .from('lesson')
        .update({ status: newStatus })
        .eq('id', lessonId)
        .eq('school_id', school.id); // Ensure scoping

      if (error) throw error;
      loadModule();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleCancel = () => {
    setLessonForm({ title: '', description: '', panda_embed: '' });
    setEditingLessonId(null);
    setShowLessonForm(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!module) {
    return <div>Módulo não encontrado</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/courses/${module.course_id}`}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{module.title}</h1>
            <p className="text-slate-400 text-sm mt-1">Gerencie as aulas e o conteúdo deste módulo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full text-xs font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          {lessons.length} Aulas publicadas
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lessons List */}
        <div className="lg:col-span-12">
          {!showLessonForm && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Todas as Aulas</h2>
              <button
                onClick={() => setShowLessonForm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                ＋ Nova Aula
              </button>
            </div>
          )}

          {/* Form para nova aula / editar aula */}
          {showLessonForm && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm animate-in zoom-in-95 duration-300 mb-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                  {editingLessonId ? 'Editar Aula' : 'Nova Aula'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Título da Aula *</label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all font-medium"
                    placeholder="Ex: Introdução ao Módulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Descrição do Conteúdo</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all min-h-[120px] resize-none"
                    placeholder="O que será abordado nesta aula?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Código de Embed (YouTube / Panda)</label>
                  <textarea
                    value={lessonForm.panda_embed}
                    onChange={(e) => setLessonForm({ ...lessonForm, panda_embed: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono text-xs transition-all min-h-[80px]"
                    placeholder='<iframe src="..." ...></iframe>'
                  />
                  <p className="text-[10px] text-slate-500 ml-1 italic">Cole o código iframe completo fornecido pelo seu provedor de vídeo.</p>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-transparent border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    {editingLessonId ? 'Salvar Alterações' : 'Criar Aula'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de aulas em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl text-center">
                <p className="text-slate-500 italic">Este módulo ainda não possui aulas. Clique em "Nova Aula" para começar.</p>
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} className="group bg-slate-900/30 border border-slate-800/60 p-6 rounded-3xl hover:border-blue-500/30 transition-all flex flex-col">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg border border-slate-700 font-bold text-slate-300">
                        {lesson.sort_order + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{lesson.title}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${lesson.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {lesson.status === 'published' ? '● Publicada' : '○ Rascunho'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {lesson.panda_embed && (
                    <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/50 mb-4 group-hover:border-blue-500/20 transition-all relative">
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.panda_embed }}
                        className="w-full h-full scale-[0.6] origin-center opacity-40 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 flex items-center justify-center pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                      <span className="absolute bottom-3 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">🎥 Conteúdo em Vídeo</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1 italic">
                    {lesson.description || 'Sem descrição definida para esta aula.'}
                  </p>

                  <div className="flex gap-2 pt-6 border-t border-slate-800/50">
                    <button
                      onClick={() => handleEditLesson(lesson)}
                      className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
                    >
                      Editar Aula
                    </button>
                    <button
                      onClick={() => handleToggleLessonStatus(lesson.id, lesson.status)}
                      className={`p-2 rounded-xl border border-slate-800 transition-all ${lesson.status === 'draft' ? 'text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30' : 'text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/30'
                        }`}
                      title={lesson.status === 'draft' ? 'Publicar' : 'Rascunho'}
                    >
                      {lesson.status === 'draft' ? '🚀' : '📥'}
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
