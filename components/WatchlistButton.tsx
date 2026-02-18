'use client';

import { useWatchlist } from '@/lib/hooks/use-watchlist';

interface WatchlistButtonProps {
    courseId: string;
    schoolSlug: string;
    variant?: 'hero' | 'card';
}

export function WatchlistButton({ courseId, schoolSlug, variant = 'card' }: WatchlistButtonProps) {
    const { isListed, loading, toggleWatchlist } = useWatchlist(courseId, schoolSlug);

    if (variant === 'hero') {
        return (
            <button
                onClick={toggleWatchlist}
                disabled={loading}
                className={`group w-14 h-14 rounded-2xl backdrop-blur-xl border transition-all active:scale-95 flex items-center justify-center text-2xl ${isListed
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                title={isListed ? "Remover da minha lista" : "Adicionar à minha lista"}
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <span className={`transition-transform duration-300 ${!isListed ? 'group-hover:scale-125' : ''}`}>
                        {isListed ? '✓' : '+'}
                    </span>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={toggleWatchlist}
            disabled={loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all font-bold ${isListed
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
            title={isListed ? 'Remover da minha lista' : 'Adicionar à minha lista'}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (isListed ? '✓' : '+')}
        </button>
    );
}
