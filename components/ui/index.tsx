import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:scale-100';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
        danger: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white',
        ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50',
        outline: 'bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={loading || disabled}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}

const Eye = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);

const EyeOff = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({ label, error, helperText, className = '', type, ...props }: InputProps) {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-sm font-medium text-slate-300 ml-1">{label}</label>}
            <div className="relative group">
                <input
                    type={inputType}
                    className={`w-full px-4 py-3 bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-800'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-sm ${isPassword ? 'pr-12' : ''} ${className}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            {helperText && !error && <p className="text-xs text-slate-500 ml-1">{helperText}</p>}
        </div>
    );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-sm font-medium text-slate-300 ml-1">{label}</label>}
            <textarea
                className={`w-full px-4 py-3 bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-800'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-sm min-h-[120px] ${className}`}
                {...props}
            />
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-sm font-medium text-slate-300 ml-1">{label}</label>}
            <select
                className={`w-full px-4 py-3 bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-800'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm appearance-none cursor-pointer ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
}

export function Badge({ children, variant = 'info' }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'info' | 'draft' | 'published' }) {
    const styles = {
        success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        error: 'bg-red-500/10 text-red-500 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
            {children}
        </span>
    );
}
