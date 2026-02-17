'use client';

import React from 'react';

interface BrandLogoProps {
    variant?: 'auto' | 'light' | 'dark' | 'png' | 'vertical';
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export default function BrandLogo({
    variant = 'auto',
    className = '',
    size = 'md'
}: BrandLogoProps) {

    const getDimensions = () => {
        if (typeof size === 'number') return { width: size * 4, height: size };

        if (variant === 'vertical') {
            switch (size) {
                case 'sm': return { width: 60, height: 80 };
                case 'lg': return { width: 200, height: 260 };
                case 'xl': return { width: 350, height: 450 };
                default: return { width: 150, height: 200 };
            }
        }

        switch (size) {
            case 'sm': return { width: 120, height: 40 }; // Aumentei de 30 para 40
            case 'lg': return { width: 300, height: 75 };
            case 'xl': return { width: 500, height: 125 };
            default: return { width: 200, height: 60 }; // Aumentei de 50 para 60
        }
    };

    const { width, height } = getDimensions();

    // Priorizando o SVG Vertical conforme solicitado
    const isVertical = variant === 'vertical';
    const logoSrc = isVertical
        ? '/brand/Logo Campus Online  Principal Vertical.svg'
        : '/brand/Logo Campus Online Principal Horizontal PNG.png';

    return (
        <div className={`relative flex items-center justify-center [isolation:isolate] group ${className}`}>
            {/* 3. Zona de Respiro (Spotlight Radial no fundo) */}
            {isVertical && (
                <div
                    className="absolute -inset-[150px] -z-10 rounded-full blur-[34px] opacity-85 pointer-events-none transition-opacity duration-500"
                    style={{
                        mixBlendMode: 'screen',
                        background: `
                            radial-gradient(circle at 50% 44%,
                                rgba(45,120,255,.18) 0%,
                                rgba(45,120,255,.10) 30%,
                                rgba(0,0,0,0) 72%),
                            radial-gradient(circle at 56% 36%,
                                rgba(40,220,140,.07) 0%,
                                rgba(40,220,140,.04) 26%,
                                rgba(0,0,0,0) 70%)
                        `,
                    }}
                />
            )}

            <img
                src={logoSrc}
                alt="Campus Online"
                width={width}
                height={height}
                className="block [transform:translateZ(0)] [will-change:filter,transform] transition-all duration-300 group-hover:-translate-y-[1px]"
                style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    /* Ajustes de profundidade e luz ambiente */
                    filter: `
                        saturate(.80) 
                        brightness(.99) 
                        contrast(1.06)
                        /* contato (mais perto e mais escuro) */
                        drop-shadow(0 14px 18px rgba(0,0,0,.62))
                        /* elevação (mais longo) */
                        drop-shadow(0 40px 90px rgba(0,0,0,.62))
                        /* glow mais discreto */
                        drop-shadow(0 0 30px rgba(45,120,255,.12))
                        drop-shadow(0 0 22px rgba(40,220,140,.06))
                    `
                }}
            />
        </div>
    );
}
