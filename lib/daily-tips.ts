export const DAILY_TIPS = [
    {
        text: "Cursos com mais de 5 módulos e materiais complementares em PDF costumam ter 40% mais engajamento dos alunos.",
        category: "Performance",
        icon: "💡"
    },
    {
        text: "Responder aos comentários dos alunos nas primeiras 24 horas aumenta em 60% a chance de recompra de novos cursos.",
        category: "Engajamento",
        icon: "💬"
    },
    {
        text: "Vídeos curtos de 5 a 8 minutos são ideais para retenção. Se a aula for longa, considere dividi-la em duas partes.",
        category: "Metodologia",
        icon: "🎥"
    },
    {
        text: "Títulos que prometem um 'resultado imediato' ou resolvem uma 'dor específica' atraem 3x mais cliques no catálogo.",
        category: "Marketing",
        icon: "🚀"
    },
    {
        text: "Oferecer um certificado personalizado ao final do curso aumenta a taxa de conclusão em quase 50%.",
        category: "Retenção",
        icon: "🎓"
    },
    {
        text: "A terça-feira às 19h é estatisticamente o horário com maior pico de visualizações em plataformas de ensino online.",
        category: "Audiência",
        icon: "📈"
    },
    {
        text: "Incluir um questionário rápido ao final de cada módulo ajuda a fixar o conteúdo e reduz pedidos de reembolso.",
        category: "Qualidade",
        icon: "📝"
    },
    {
        text: "Cursos com thumbnails (capas) que mostram o rosto do instrutor geram mais confiança e autoridade imediata.",
        category: "Autoridade",
        icon: "👤"
    },
    {
        text: "Lembre-se: O primeiro módulo deve ser focado em uma 'pequena vitória' para motivar o aluno a continuar.",
        category: "Estratégia",
        icon: "🎯"
    },
    {
        text: "Use a descrição do curso para listar exatamente o que o aluno será capaz de fazer após concluir as aulas.",
        category: "Vendas",
        icon: "💰"
    }
];

export function getDailyTip() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
