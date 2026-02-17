'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { createClient } from '@/lib/supabase-client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [schoolSlug, setSchoolSlug] = useState('');
  const [schoolData, setSchoolData] = useState<{ name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleValidateSchool = async () => {
    if (!schoolSlug.trim()) {
      setError('Por favor, digite o código da escola.');
      return;
    }

    setLoading(true);
    setError(null);
    const slug = schoolSlug.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      // 1. Tenta buscar no Supabase se houver uma tabela válida
      // Mas antes, verifica se é um slug de teste para evitar erro desnecessário de 404/500 se o backend não estiver pronto
      if (slug === 'escola-raiz' || slug === 'demo') {
        // Simula delay de rede para parecer real
        await new Promise(resolve => setTimeout(resolve, 600));
        setSchoolData({ name: 'Escola Exemplo (Demo)', slug: slug });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('schools')
        .select('name, slug')
        .eq('slug', slug)
        .maybeSingle(); // Usa maybeSingle para evitar erro PGRST116 se não achar

      if (error) throw error;

      if (!data) {
        throw new Error('Código de escola inválido. Verifique com sua instituição.');
      }

      setSchoolData(data);
    } catch (err: any) {
      console.error('Validation error:', err);

      // Fallback: Se for erro de conexão ou tabela inexistente, mostra mensagem amigável
      // mas não falha silenciosamente.
      const msg = err.message || 'Erro ao validar escola.';

      // Se a mensagem for genérica de fetch failure, sugerimos verificar conexão
      if (msg.includes('Failed to fetch') || msg.includes('connection')) {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    if (!schoolData) return;
    router.push(`/s/${schoolData.slug}${path}`);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock de envio
    setRequestSent(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSent(false);
      setRequestName('');
      setRequestEmail('');
      alert('Solicitação recebida! Em breve entraremos em contato.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden relative">
      {/* Badge no topo */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20">
        <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold tracking-wide uppercase">
          Acessar minha escola 🏫
        </div>
      </div>

      {/* Luzes de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <div className="w-full max-w-4xl z-10 animate-in fade-in zoom-in duration-1000 mt-20 relative">

        {/* Header Branding */}
        <div className="text-center space-y-6 mb-12 flex flex-col items-center">
          <div className="animate-in slide-in-from-top-4 duration-1000">
            <BrandLogo variant="vertical" size="xl" className="transform scale-110" />
          </div>
        </div>

        {/* --- PASSO 1: Input de Código --- */}
        {!schoolData && (
          <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold text-white text-center mb-1">Acesse sua escola</h2>
              <p className="text-xs text-slate-400 text-center mb-6">Use o código fornecido pela sua instituição</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">
                    Código da Escola
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <input
                      type="text"
                      placeholder="Ex: escola-raiz"
                      value={schoolSlug}
                      onChange={(e) => setSchoolSlug(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateSchool()}
                      className="relative w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center text-lg font-medium placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleValidateSchool}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
                  onClick={() => alert('O código da escola é o identificador único fornecido pela sua instituição (ex: nome-da-escola).')}
                >
                  Onde encontro o código?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PASSO 2: Cards de Acesso (Escola Encontrada) --- */}
        {schoolData && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Feedback Escola Encontrada */}
            <div className="flex flex-col items-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Escola encontrada: <strong className="text-emerald-300">{schoolData.name}</strong>
              </div>
              <button
                onClick={() => { setSchoolData(null); setSchoolSlug(''); setError(null); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                (Alterar escola)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card Professor */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl flex flex-col h-full group hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-24 h-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>

                <div className="mb-8 relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Área do Professor</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Acesso ao portal de ensino, gestão de turmas e conteúdos.
                  </p>
                </div>

                <div className="mt-auto space-y-3 relative z-10">
                  <button
                    onClick={() => handleNavigate('/login')}
                    className="w-full py-3.5 bg-white text-[#020617] rounded-xl font-black text-base hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-white/5"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => handleNavigate('/signup-professor')}
                    className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-base hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
                  >
                    Criar conta de professor
                  </button>
                </div>
              </div>

              {/* Card Gestão */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-xl flex flex-col h-full group hover:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-24 h-24 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <div className="mb-8 relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Painel de Gestão</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Administração, financeiro e configurações institucionais.
                  </p>
                </div>

                <div className="mt-auto space-y-3 relative z-10">
                  <button
                    onClick={() => handleNavigate('/login')}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-base hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                  >
                    Entrar na Gestão
                  </button>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full py-3.5 bg-transparent text-slate-400 font-medium text-sm hover:text-white transition-colors border border-dashed border-slate-700 rounded-xl hover:border-slate-500"
                  >
                    Solicitar acesso administrativo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-24 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-slate-600 text-xs tracking-widest uppercase font-semibold italic">
            © 2026 Campus Online • Sustentado por Tecnologia de Elite
          </p>
        </div>
      </div>

      {/* --- Modal de Solicitação de Acesso --- */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRequestModal(false)}></div>
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Solicitar Acesso - Gestão</h3>
            <p className="text-slate-400 text-sm mb-6">
              O acesso administrativo é restrito. Preencha seus dados para análise da secretaria da escola <strong>{schoolData?.name}</strong>.
            </p>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Nome Completo</label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">E-mail Institucional</label>
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={requestSent}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                >
                  {requestSent ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
