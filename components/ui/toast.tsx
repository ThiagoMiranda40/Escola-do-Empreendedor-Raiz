'use client';

import React, { useState, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, action?: { label: string, onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success', action?: { label: string, onClick: () => void }) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, action }]);
        // If there's an action, maybe stay a bit longer
        const duration = action ? 6000 : 3000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-full duration-300 flex flex-col gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            <p className="font-bold text-sm tracking-wide flex-1">{toast.message}</p>
                        </div>
                        {toast.action && (
                            <button
                                onClick={() => {
                                    toast.action?.onClick();
                                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-xl transition-all self-end border border-white/10"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
