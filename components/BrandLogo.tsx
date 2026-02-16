'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
    variant?: 'auto' | 'light' | 'dark';
    className?: string;
    size?: 'sm' | 'md' | 'lg' | number;
}

export default function BrandLogo({
    variant = 'auto',
    className = '',
    size = 'md'
}: BrandLogoProps) {

    const getDimensions = () => {
        if (typeof size === 'number') return { width: size * 4, height: size };
        switch (size) {
            case 'sm': return { width: 120, height: 30 };
            case 'lg': return { width: 240, height: 60 };
            default: return { width: 180, height: 45 };
        }
    };

    const { width, height } = getDimensions();

    // No sistema atual, já que é majoritariamente dark, o 'auto' pode ser o dark por padrão
    // ou poderíamos usar media queries no futuro.
    const logoPath = variant === 'light' ? '/brand/logo.svg' : '/brand/logo-dark.svg';

    return (
        <div className={`relative flex items-center ${className}`}>
            <Image
                src={logoPath}
                alt="Campus Online Logo"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
        </div>
    );
}
