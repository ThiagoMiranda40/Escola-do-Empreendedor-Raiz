'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function Home() {

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden relative">
      <nav className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <BrandLogo size="lg" />
      </nav>

      {/* Luzes de fundo decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <div className="w-full max-w-4xl z-10 animate-in fade-in zoom-in duration-1000 mt-20">
        <div className="text-center space-y-8 mb-16">
          <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold tracking-wide uppercase mb-4 animate-pulse">
            Plataforma 2026 🚀
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Online</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Campus Online — Plataforma de Escolas Digitais para criar, gerenciar e escalar seus cursos com estética de nível mundial.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <Link
            href="/login"
            className="px-12 py-6 bg-white text-[#020617] rounded-2xl font-black text-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
          >
            Acessar Painel do Mestre
          </Link>
          <Link
            href="/signup-professor"
            className="px-12 py-6 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/20"
          >
            Criar Conta de Gestão
          </Link>
        </div>

        <div className="mt-24 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-slate-600 text-sm tracking-widest uppercase">
            © 2026 Triade Tecnologia & Soluções • Built with Passion
          </p>
        </div>
      </div>
    </div>
  );
}
