'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui';

interface Option {
    id: string;
    text: string;
    icon: string;
    mapped_categories: string[];
}

interface Question {
    id: string;
    text: string;
    description: string;
    options: Option[];
}

export default function StudentDiscoveryPage() {
    const params = useParams();
    const router = useRouter();
    const { schoolSlug } = params;
    const supabase = createClient();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(-1); // -1 is intro
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [hasExistingResult, setHasExistingResult] = useState(false);

    useEffect(() => {
        const loadDiagnostic = async () => {
            try {
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('slug', schoolSlug)
                    .single();

                if (!schoolData) return;

                const { data: qData } = await supabase
                    .from('diagnostic_questions')
                    .select(`
                        id, text, description, "order",
                        options:diagnostic_options(id, text, icon, mapped_categories, "order")
                    `)
                    .eq('school_id', schoolData.id)
                    .eq('is_active', true)
                    .order('order', { ascending: true });

                setQuestions(qData || []);

                // Check for existing result
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: result } = await supabase
                        .from('user_diagnostic_results')
                        .select('top_categories')
                        .eq('user_id', session.user.id)
                        .eq('school_id', schoolData.id)
                        .single();

                    if (result) {
                        setHasExistingResult(true);
                        setCompleted(true);
                        setCurrentIdx(999); // Skip Intro

                        // Recuperar o label do perfil das categorias salvas
                        const profileMap: Record<string, string> = {
                            'marketing': 'Growth & Vendas',
                            'gestão': 'Estratega de Gestão',
                            'ia': 'Visionário Tech & IA',
                            'vendas': 'Closer de Vendas',
                            'branding': 'Especialista em Marca',
                            'tecnologia': 'Líder em Tecnologia',
                            'liderança': 'Líder de Pessoas',
                            'equipes': 'Líder de Pessoas'
                        };

                        const topCat = result.top_categories?.[0]?.toLowerCase() || '';
                        const matched = Object.entries(profileMap).find(([key]) => topCat.includes(key));
                        setUserProfile(matched ? matched[1] : (topCat.charAt(0).toUpperCase() + topCat.slice(1) || 'Especialista'));
                    }
                }
            } catch (error) {
                console.error('Error loading diagnostic:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDiagnostic();
    }, [schoolSlug]);

    const handleStart = () => setCurrentIdx(0);

    const handleAnswer = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        if (currentIdx < questions.length - 1) {
            setTimeout(() => setCurrentIdx(prev => prev + 1), 300);
        } else {
            handleFinish();
        }
    };

    const [userProfile, setUserProfile] = useState<string>('Personalizado');

    const handleFinish = async () => {
        setSaving(true);
        setCurrentIdx(999); // Hide questions immediately

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: schoolData } = await supabase.from('schools').select('id').eq('slug', schoolSlug).single();

            if (!session || !schoolData) return;

            // WEIGHTED ALGORITHM: Q2 has triple weight
            const categoryWeights: Record<string, number> = {};

            Object.entries(answers).forEach(([qId, optionId]) => {
                const qOrder = questions.findIndex(q => q.id === qId);
                const weight = qOrder === 1 ? 4 : 1; // Priority (Q2) gets 4x more weight

                const opt = questions.flatMap(q => q.options).find(o => o.id === optionId);
                if (opt?.mapped_categories) {
                    opt.mapped_categories.forEach(cat => {
                        categoryWeights[cat] = (categoryWeights[cat] || 0) + weight;
                    });
                }
            });

            const sortedCategories = Object.entries(categoryWeights)
                .sort((a, b) => b[1] - a[1])
                .map(e => e[0]);

            const topCategories = sortedCategories.slice(0, 2);

            // Dynamic Profile Labeling
            const profileMap: Record<string, string> = {
                'liderança': 'Líder de Pessoas',
                'equipes': 'Líder de Pessoas',
                'gestão': 'Estratega de Gestão',
                'ia': 'Visionário Tech & IA',
                'marketing': 'Growth & Vendas',
                'vendas': 'Closer de Vendas',
                'branding': 'Especialista em Marca',
                'tecnologia': 'Líder em Tecnologia'
            };

            let finalLabel = 'Especialista em Negócios';
            if (topCategories.length > 0) {
                // Find first category that has a map entry
                for (const cat of topCategories) {
                    const matchedKey = Object.keys(profileMap).find(key => cat.toLowerCase().includes(key));
                    if (matchedKey) {
                        finalLabel = profileMap[matchedKey];
                        break;
                    }
                }
            }
            setUserProfile(finalLabel);

            await supabase.from('user_diagnostic_results').upsert({
                user_id: session.user.id,
                school_id: schoolData.id,
                top_categories: topCategories,
                onboarding_completed: true,
                last_completed_at: new Date(),
            });

            // Keep 'saving' true for 3 seconds of solid feedback
            setTimeout(() => {
                setCompleted(true);
                setSaving(false);
            }, 3000);

        } catch (err) {
            console.error(err);
            setSaving(false);
            setCurrentIdx(questions.length - 1); // Bring back if error
        }
    };

    const resetDiagnostic = () => {
        setCompleted(false);
        setHasExistingResult(false);
        setCurrentIdx(-1);
        setAnswers({});
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // EMPTY STATE GUARD
    if (!loading && questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-40 px-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="text-6xl">🚧</div>
                    <h2 className="text-2xl font-black text-white px-2">Nenhum diagnóstico configurado para esta escola.</h2>
                    <p className="text-slate-500 text-sm">O administrador ainda não definiu as perguntas para a trilha de sucesso.</p>
                    <Button variant="outline" onClick={() => router.push(`/s/${schoolSlug}/student/home`)}>Voltar ao Início</Button>
                </div>
            </div>
        );
    }

    // INTRO SCREEN (Only if not completed)
    if (currentIdx === -1 && !completed) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-[10vh] px-6 text-center">
                <div className="max-w-xl space-y-8 animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            Experiência Personalizada
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                            Vamos montar sua <span className="text-blue-500">Trilha de Sucesso</span>
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
                            Responda {questions.length} perguntas rápidas para que nosso algoritmo recomende os melhores conteúdos para o seu momento atual.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Button
                            variant="primary"
                            className="h-14 px-10 rounded-xl text-base font-black bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-2xl shadow-blue-500/20"
                            onClick={handleStart}
                        >
                            Começar Diagnóstico →
                        </Button>
                        <button
                            className="h-14 px-8 rounded-xl text-slate-500 text-sm font-bold hover:text-white transition-colors"
                            onClick={() => router.back()}
                        >
                            Agora não
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // CALCULATION / FINISH / DASHBOARD SCREEN
    if (saving || completed || currentIdx === 999) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-8 md:pt-12 px-6 text-center space-y-8">
                {saving || !completed ? (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-3 bg-blue-600 rounded-full flex items-center justify-center text-3xl animate-pulse">🤖</div>
                        </div>
                        <h2 className="text-2xl font-black text-white">Analisando seu perfil...</h2>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Nosso algoritmo está cruzando suas respostas com as centenas de aulas disponíveis na plataforma.</p>
                    </div>
                ) : (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-xl">
                        <div className="relative inline-block mx-auto">
                            <div className="text-7xl mb-4">🏆</div>
                            <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black animate-bounce">✓</div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                {hasExistingResult ? 'Seu Perfil de Aluno' : 'Sua Trilha está Pronta!'}
                            </h2>
                            <p className="text-slate-400 text-lg">
                                Identificamos que você tem foco em <span className="text-blue-500 font-bold">{userProfile}</span>.
                            </p>
                        </div>

                        {/* Journey Summary / "Tabuleiro" UI */}
                        <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Jornada de Aprendizado</span>
                                <span className="text-[10px] font-black text-blue-500 uppercase">15% Concluído</span>
                            </div>
                            <div className="flex justify-between items-center relative gap-2">
                                <div className="absolute left-0 right-0 h-1 bg-white/10 top-1/2 -translate-y-1/2 z-0"></div>
                                {[1, 2, 3, 4].map(step => (
                                    <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black z-10 border-2 transition-all ${step === 1 ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50' : 'bg-[#050505] border-white/10 text-slate-600'}`}>
                                        {step === 1 ? '📍' : step}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button
                                className="h-16 px-12 rounded-2xl text-lg font-black bg-white text-black hover:bg-slate-200 active:scale-95 transition-all shadow-2xl shadow-white/10"
                                onClick={() => router.push(`/s/${schoolSlug}/student/home`)}
                            >
                                <span className="text-black">Acessar Minha Trilha →</span>
                            </Button>

                            <button
                                onClick={resetDiagnostic}
                                className="text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors py-4 px-6"
                            >
                                Refazer Diagnóstico
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // QUESTIONS STEPPER
    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return null;

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-12 md:pt-20 pb-20 px-6 text-center">
            <div className="w-full max-w-4xl space-y-12">
                <div className="flex items-center gap-6">
                    {currentIdx > 0 && (
                        <button
                            onClick={() => setCurrentIdx(prev => prev - 1)}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            title="Voltar"
                        >
                            ←
                        </button>
                    )}
                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden flex">
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                className={`h-full transition-all duration-500 ${i <= currentIdx ? 'bg-blue-600 grow' : 'bg-transparent grow-0 w-0'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-3 animate-in slide-in-from-right-8 fade-in duration-500">
                    <span className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Pergunta {currentIdx + 1} de {questions.length}</span>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight px-2">
                        {currentQuestion.text}
                    </h2>
                    {currentQuestion.description && (
                        <p className="text-slate-500 text-base max-w-lg mx-auto px-4">{currentQuestion.description}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
                    {currentQuestion.options?.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleAnswer(currentQuestion.id, option.id)}
                            className={`flex items-center gap-5 p-6 rounded-3xl border-2 text-left transition-all duration-300 group ${answers[currentQuestion.id] === option.id
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20 translate-y-[-4px]'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-900 hover:text-white'
                                }`}
                        >
                            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{option.icon}</span>
                            <div className="space-y-0.5">
                                <span className="text-lg font-black block">{option.text}</span>
                                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold group-hover:opacity-100 transition-opacity">Selecionar</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
