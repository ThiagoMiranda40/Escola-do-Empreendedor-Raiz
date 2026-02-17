'use client';

import CourseForm from '../course-form';

export default function NewCoursePage() {
    return (
        <div className="space-y-8 pb-12">
            <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors group"
            >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                <span className="font-bold text-sm uppercase tracking-widest">Voltar</span>
            </button>

            <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Novo Curso</h1>
                <p className="text-slate-400 mt-1">Configure as informações básicas do seu novo conteúdo.</p>
            </div>

            <CourseForm />

            <div className="pt-8 mt-12 border-t border-slate-800/50 flex justify-center">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors group"
                >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="font-bold text-sm uppercase tracking-widest">Voltar para Cursos</span>
                </button>
            </div>
        </div>
    );
}
