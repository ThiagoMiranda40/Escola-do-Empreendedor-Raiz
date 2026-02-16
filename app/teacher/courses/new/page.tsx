'use client';

import CourseForm from '../course-form';

export default function NewCoursePage() {
    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Novo Curso</h1>
                <p className="text-slate-400 mt-1">Configure as informações básicas do seu novo conteúdo.</p>
            </div>

            <CourseForm />
        </div>
    );
}
