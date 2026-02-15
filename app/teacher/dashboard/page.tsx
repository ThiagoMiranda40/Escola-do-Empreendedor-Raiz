'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const loadStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Total courses
        const { count: totalCount } = await supabase
          .from('course')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', session.user.id);

        // Published courses
        const { count: publishedCount } = await supabase
          .from('course')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', session.user.id)
          .eq('status', 'published');

        // Draft courses
        const { count: draftCount } = await supabase
          .from('course')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', session.user.id)
          .eq('status', 'draft');

        setStats({
          totalCourses: totalCount || 0,
          publishedCourses: publishedCount || 0,
          draftCourses: draftCount || 0,
          totalStudents: 0,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Professor</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Aqui está o resumo da sua plataforma hoje.</p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="px-6 py-3 bg-white text-[#020617] rounded-xl font-bold hover:bg-blue-50 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Criar Novo Conteúdo
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <StatCard
          label="Total de Cursos"
          value={stats.totalCourses}
          icon="📚"
          gradient="from-blue-600/20 to-indigo-600/20"
          border="border-blue-500/20"
        />
        <StatCard
          label="Publicados"
          value={stats.publishedCourses}
          icon="🚀"
          gradient="from-emerald-600/20 to-teal-600/20"
          border="border-emerald-500/20"
        />
        <StatCard
          label="Rascunhos"
          value={stats.draftCourses}
          icon="📝"
          gradient="from-amber-600/20 to-orange-600/20"
          border="border-amber-500/20"
        />
        <StatCard
          label="Alunos Ativos"
          value={stats.totalStudents}
          icon="👥"
          gradient="from-purple-600/20 to-pink-600/20"
          border="border-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              href="/teacher/categories"
              icon="📂"
              title="Gerenciar Categorias"
              description="Organize seu conteúdo por nichos e temas"
              color="blue"
            />
            <QuickActionCard
              href="/teacher/courses"
              icon="🛠️"
              title="Editor de Cursos"
              description="Modifique aulas, módulos e materiais"
              color="emerald"
            />
          </div>
        </div>

        {/* Recent Activity / Tip */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Dica do Dia</h2>
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
            <p className="text-slate-300 leading-relaxed italic relative z-10">
              "Cursos com mais de 5 módulos e materiais complementares em PDF costumam ter 40% mais engajamento dos alunos."
            </p>
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-bold relative z-10">
              <span className="w-4 h-4">💡</span>
              Sugestão de Performance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, gradient, border }: { label: string; value: number; icon: string; gradient: string; border: string }) {
  return (
    <div className={`bg-slate-950 border ${border} rounded-[2rem] p-8 relative overflow-hidden group hover:scale-[1.02] transition-all`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
      <div className="relative z-10">
        <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{icon}</div>
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-5xl font-extrabold text-white mt-1 drop-shadow-2xl">{value}</div>
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description, color }: { href: string; icon: string; title: string; description: string; color: string }) {
  const colorMap: any = {
    blue: 'hover:border-blue-500/40 hover:bg-blue-500/5',
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/5'
  };

  return (
    <Link
      href={href}
      className={`block p-6 bg-slate-900/30 border border-slate-800 rounded-3xl transition-all duration-300 ${colorMap[color] || ''}`}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </Link>
  );
}
