'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Select, TextArea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { validateCoursePublication } from '@/lib/course-publishing';
import { triggerSuccessConfetti } from '@/lib/confetti';

interface Category {
    id: string;
    name: string;
}

interface CourseFormProps {
    initialData?: any;
    isEditing?: boolean;
    onSuccess?: () => void;
}

import { useSchool } from '@/lib/school-context-provider';

// ... (keep existing imports)

export default function CourseForm({ initialData, isEditing = false, onSuccess }: CourseFormProps) {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useToast();
    const { school, userRole, loading: schoolLoading } = useSchool(); // Use school context
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        category_id: initialData?.category_id || '',
        status: initialData?.status || 'draft',
        thumb_url: initialData?.thumb_url || '',
        thumb_vertical_url: initialData?.thumb_vertical_url || '',
        // New Access Fields
        access_model: initialData?.access_model || 'OPEN',
        course_tier: initialData?.course_tier || 'TIER_1',
        required_entitlement_key: initialData?.required_entitlement_key || ''
    });
    const [showAdvancedKey, setShowAdvancedKey] = useState(false);
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.thumb_url || null);
    const [thumbVerticalFile, setThumbVerticalFile] = useState<File | null>(null);
    const [previewVerticalUrl, setPreviewVerticalUrl] = useState<string | null>(initialData?.thumb_vertical_url || null);

    useEffect(() => {
        if (!schoolLoading && school) {
            loadCategories();
        }
    }, [school, schoolLoading]);

    const loadCategories = async () => {
        if (!school) return;
        const { data } = await supabase
            .from('category')
            .select('id, name')
            .eq('school_id', school.id)
            .order('name');
        if (data) setCategories(data);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'horizontal' | 'vertical' = 'horizontal') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'horizontal') {
                setThumbFile(file);
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setThumbVerticalFile(file);
                setPreviewVerticalUrl(URL.createObjectURL(file));
            }
        }
    };

    const uploadThumbnail = async (id: string, file: File | null, existingUrl: string) => {
        if (!file) return existingUrl;

        const fileExt = file.name.split('.').pop();
        const fileName = `${id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('course-thumbnails')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Erro no upload:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course-thumbnails')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.category_id) {
            showToast('Título e Categoria são obrigatórios', 'error');
            return;
        }
        if (!school) {
            showToast('Escola não identificada.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Não autenticado');

            const slug = formData.slug || generateSlug(formData.title);
            let thumb_url = formData.thumb_url;

            const courseId = isEditing ? initialData.id : crypto.randomUUID();

            // IMPORTANT: Validation if status is PUBLISHED
            if (formData.status === 'published') {
                if (!isEditing) {
                    showToast('Um curso novo deve começar como Rascunho. Adicione módulos e aulas antes de publicar.', 'error');
                    setLoading(false);
                    return;
                }

                const validation = await validateCoursePublication(supabase, courseId, school.id);
                if (!validation.isValid) {
                    showToast(
                        `Opa! Requisitos faltando para publicar:\n${validation.errors.join(' ')}`,
                        'error'
                    );
                    setLoading(false);
                    return;
                }
            }

            if (thumbFile) {
                thumb_url = await uploadThumbnail(courseId, thumbFile, formData.thumb_url);
            }

            let thumb_vertical_url = formData.thumb_vertical_url;
            if (thumbVerticalFile) {
                thumb_vertical_url = await uploadThumbnail(courseId, thumbVerticalFile, formData.thumb_vertical_url);
            }

            const coursePayload = {
                title: formData.title,
                slug,
                description: formData.description,
                category_id: formData.category_id,
                status: formData.status,
                thumb_url,
                thumb_vertical_url,
                // Only set teacher_id on creation
                ...(!isEditing ? { teacher_id: session.user.id } : {}),
                school_id: school.id,
                updated_at: new Date(),
                // Only include access fields if the user is an ADMIN
                ...(userRole === 'ADMIN' ? {
                    access_model: formData.access_model,
                    course_tier: formData.course_tier,
                    required_entitlement_key: formData.required_entitlement_key || null
                } : {})
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('course')
                    .update(coursePayload)
                    .eq('id', courseId)
                    .eq('school_id', school.id); // Ensure scoping
                if (error) throw error;
                if (formData.status === 'published') triggerSuccessConfetti();
                showToast('Curso atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('course')
                    .insert([{ ...coursePayload, id: courseId }]);
                if (error) throw error;
                if (formData.status === 'published') triggerSuccessConfetti();
                showToast('Curso criado com sucesso!');
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/teacher/courses');
            }
        } catch (error: any) {
            console.error('Erro ao salvar curso:', error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                            Informações Básicas
                        </h2>

                        <Input
                            label="Título do Curso"
                            value={formData.title}
                            onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value });
                                if (!isEditing) setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                            }}
                            placeholder="Ex: Do Zero ao Milhão com Tráfego Pago"
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="URL Slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="slug-do-curso"
                                className="font-mono text-xs"
                            />
                            <Select
                                label="Categoria"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                options={[
                                    { value: '', label: 'Selecione uma categoria' },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                                required
                            />
                        </div>

                        <TextArea
                            label="Descrição Completa"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o que os alunos vão aprender, os benefícios e o público-alvo..."
                        />
                    </div>

                    {/* ADMIN ONLY: Access Control - Moved to Center */}
                    {userRole === 'ADMIN' && (
                        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-6 relative overflow-hidden group">
                            {/* Decorative badge - Fixed clipping and translated */}
                            <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-lg">Apenas Operações Administrativas</div>

                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
                                Acesso do Curso
                            </h2>

                            <div className="space-y-8">
                                {/* Guided Access Model - Radio Cards */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Modelo de Acesso</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Option A: Assinatura */}
                                        <div
                                            onClick={() => setFormData({
                                                ...formData,
                                                access_model: 'ENTITLEMENT_REQUIRED',
                                                required_entitlement_key: 'COMMUNITY_ANNUAL'
                                            })}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.access_model === 'ENTITLEMENT_REQUIRED' && formData.required_entitlement_key === 'COMMUNITY_ANNUAL'
                                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">💎</div>
                                            <h3 className="font-bold text-white text-sm">Assinatura</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Membros da Comunidade Anual</p>
                                        </div>

                                        {/* Option B: Avulso */}
                                        <div
                                            onClick={() => setFormData({
                                                ...formData,
                                                access_model: 'ENTITLEMENT_REQUIRED',
                                                required_entitlement_key: `COURSE:${isEditing ? initialData.id : 'NEW'}`
                                            })}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.access_model === 'ENTITLEMENT_REQUIRED' && formData.required_entitlement_key?.startsWith('COURSE:')
                                                ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">🎯</div>
                                            <h3 className="font-bold text-white text-sm">Compra Avulsa</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Vendido separadamente por curso</p>
                                        </div>

                                        {/* Option C: Aberto */}
                                        <div
                                            onClick={() => setFormData({
                                                ...formData,
                                                access_model: 'OPEN',
                                                required_entitlement_key: ''
                                            })}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.access_model === 'OPEN'
                                                ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">🔓</div>
                                            <h3 className="font-bold text-white text-sm">Aberto</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Sem restrição (Free/Lead Magnet)</p>
                                        </div>
                                    </div>

                                    {/* Smart Warnings */}
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                        {formData.access_model === 'ENTITLEMENT_REQUIRED' && formData.required_entitlement_key === 'COMMUNITY_ANNUAL' && ['TIER_3', 'TIER_4', 'TIER_5'].includes(formData.course_tier) && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-400 text-[10px] flex items-center gap-2">
                                                <span>⚠️</span>
                                                Cursos de Tier alto geralmente são vendidos como Compra Avulsa. Verifique se deseja realmente incluí-lo na assinatura.
                                            </div>
                                        )}
                                        {formData.access_model === 'ENTITLEMENT_REQUIRED' && formData.required_entitlement_key?.startsWith('COURSE:') && ['TIER_1', 'TIER_2'].includes(formData.course_tier) && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400 text-[10px] flex items-center gap-2">
                                                <span>ℹ️</span>
                                                Este curso é de Tier base. Geralmente estes cursos fazem parte da assinatura da comunidade.
                                            </div>
                                        )}
                                        {formData.access_model === 'OPEN' && ['TIER_3', 'TIER_4', 'TIER_5'].includes(formData.course_tier) && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] flex items-center gap-2">
                                                <span>🚨</span>
                                                Atenção: Curso de alto valor configurado como Aberto ao Público.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800/50">
                                    {/* Tier Selector */}
                                    <div className="space-y-4">
                                        <Select
                                            label="Tier (Classificação Estratégica)"
                                            value={formData.course_tier}
                                            onChange={(e) => {
                                                const newTier = e.target.value;
                                                // Auto-suggest logic
                                                let updates: any = { course_tier: newTier };
                                                if (['TIER_1', 'TIER_2'].includes(newTier) && formData.access_model === 'OPEN') {
                                                    // keep open
                                                } else if (['TIER_3', 'TIER_4', 'TIER_5'].includes(newTier)) {
                                                    // suggest buy alone if needed, but don't force
                                                }
                                                setFormData({ ...formData, ...updates });
                                            }}
                                            options={[
                                                { value: 'TIER_1', label: '⭐ Tier 1 — Base (Comunidade)' },
                                                { value: 'TIER_2', label: '⭐⭐ Tier 2 — Pro (Inclui T1)' },
                                                { value: 'TIER_3', label: '⭐⭐⭐ Tier 3 — Certificação (Avulso)' },
                                                { value: 'TIER_4', label: '⭐⭐⭐⭐ Tier 4 — Formação (Avulso)' },
                                                { value: 'TIER_5', label: '💎 Tier 5 — Pós-graduação (Avulso)' }
                                            ]}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1 italic">
                                            O Tier é uma classificação. O acesso real é definido pelos cards acima.
                                        </p>
                                    </div>

                                    {/* Entitlement Key Display */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Chave de Segurança</label>
                                        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between group">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase">
                                                    {formData.access_model === 'OPEN' ? 'Livre' : 'Chave Ativa'}
                                                </span>
                                                <code className="text-xs text-white opacity-80 mt-1">
                                                    {formData.required_entitlement_key || (formData.access_model === 'OPEN' ? 'public_access' : 'none')}
                                                </code>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedKey(!showAdvancedKey)}
                                                className="text-[9px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                                            >
                                                {showAdvancedKey ? 'Ocultar' : 'Avançado'}
                                            </button>
                                        </div>

                                        {showAdvancedKey && (
                                            <div className="animate-in zoom-in-95 duration-200">
                                                <Input
                                                    value={formData.required_entitlement_key}
                                                    onChange={(e) => setFormData({ ...formData, required_entitlement_key: e.target.value })}
                                                    placeholder="Chave customizada..."
                                                    className="font-mono text-xs mt-2"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Coming Soon: Bundle Logic */}
                                <div className="pt-6 border-t border-slate-800/50">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                        🎁 Bônus incluídos na compra <span className="text-[8px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">EM BREVE</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-40 grayscale pointer-events-none">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-4 h-4 border border-slate-700 rounded bg-slate-800"></div>
                                            Incluir Tier 1 e 2
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-4 h-4 border border-slate-700 rounded bg-slate-800"></div>
                                            Comunidade (12 meses)
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-4 h-4 border border-slate-700 rounded bg-slate-800"></div>
                                            Certificados Bônus
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-3 animate-pulse">Disponível quando integrarmos o gateway de pagamentos.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Thumbnail Management */}
                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-8">
                        {/* Horizontal Thumbnail */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
                                Thumbnail (Principal)
                            </h2>

                            <div
                                className="aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer"
                                onClick={() => document.getElementById('thumb-input')?.click()}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                                        <span className="text-3xl mb-2">🖼️</span>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Upload Horizontal</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-xl">Trocar Capa</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                    📐 Formato Ideal: <span className="text-slate-300">1280x720 (16:9)</span>
                                </p>
                                <p className="text-[9px] text-slate-600 italic leading-tight">Proporção wide para listagens e cabeçalhos principais.</p>
                            </div>
                            <input
                                id="thumb-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'horizontal')}
                                className="hidden"
                            />
                        </div>

                        <div className="h-px bg-slate-800/50"></div>

                        {/* Vertical Thumbnail */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-5 bg-purple-500 rounded-full inline-block"></span>
                                Capa Vertical (Destaques)
                            </h2>

                            <div
                                className="aspect-[3/4] max-w-[200px] mx-auto bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer"
                                onClick={() => document.getElementById('thumb-vertical-input')?.click()}
                            >
                                {previewVerticalUrl ? (
                                    <img src={previewVerticalUrl} alt="Preview Vertical" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                                        <span className="text-3xl mb-2">📱</span>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Upload Vertical</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-xl">Trocar Capa</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    📐 Formato Ideal: <span className="text-slate-300">1080x1440 (3:4)</span>
                                </p>
                                <p className="text-[9px] text-slate-600 italic leading-tight">Usada para banners verticais e visualização mobile "Netflix style".</p>
                            </div>
                            <input
                                id="thumb-vertical-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'vertical')}
                                className="hidden"
                            />
                        </div>
                    </div>


                    {/* Status */}
                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
                            Status
                        </h2>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            options={[
                                { value: 'draft', label: '📝 Rascunho' },
                                { value: 'published', label: '🚀 Publicado' }
                            ]}
                            disabled={!isEditing}
                        />
                        <p className="text-xs text-slate-500 italic">
                            {!isEditing
                                ? 'Cursos novos começam como Rascunho. Você poderá publicar após adicionar módulos e aulas.'
                                : formData.status === 'published'
                                    ? 'Este curso está visível para os alunos.'
                                    : 'Apenas você pode ver este curso enquanto ele estiver em rascunho.'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Button type="submit" size="lg" loading={loading} className="w-full">
                            {isEditing ? 'Salvar Alterações' : 'Criar Curso'}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={() => router.back()}>
                            Cancelar e Voltar
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
