'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Select, TextArea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

interface Category {
    id: string;
    name: string;
}

interface CourseFormProps {
    initialData?: any;
    isEditing?: boolean;
}

import { useSchool } from '@/lib/school-context-provider';

// ... (keep existing imports)

export default function CourseForm({ initialData, isEditing = false }: CourseFormProps) {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useToast();
    const { school, loading: schoolLoading } = useSchool(); // Use school context
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        category_id: initialData?.category_id || '',
        status: initialData?.status || 'draft',
        thumb_url: initialData?.thumb_url || ''
    });
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.thumb_url || null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadThumbnail = async (id: string) => {
        if (!thumbFile) return formData.thumb_url;

        const fileExt = thumbFile.name.split('.').pop();
        const fileName = `${id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('course-thumbnails')
            .upload(filePath, thumbFile);

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

            if (thumbFile) {
                thumb_url = await uploadThumbnail(courseId);
            }

            const coursePayload = {
                title: formData.title,
                slug,
                description: formData.description,
                category_id: formData.category_id,
                status: formData.status,
                thumb_url,
                teacher_id: session.user.id,
                school_id: school.id, // Add school_id
                updated_at: new Date()
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('course')
                    .update(coursePayload)
                    .eq('id', courseId)
                    .eq('school_id', school.id); // Ensure scoping
                if (error) throw error;
                showToast('Curso atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('course')
                    .insert([{ ...coursePayload, id: courseId }]);
                if (error) throw error;
                showToast('Curso criado com sucesso!');
            }

            router.push('/teacher/courses');
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
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Thumbnail */}
                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
                            Thumbnail
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
                                    <p className="text-xs font-bold uppercase tracking-widest">Clique para subir imagem</p>
                                    <p className="text-[10px] opacity-50 mt-1">Recomendado: 1280x720px</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-xl">Trocar Imagem</span>
                            </div>
                        </div>
                        <input
                            id="thumb-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
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
                        />
                        <p className="text-xs text-slate-500 italic">
                            {formData.status === 'published'
                                ? 'Este curso estará visível para todos os alunos na home.'
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
