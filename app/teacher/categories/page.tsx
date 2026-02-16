'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, TextArea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showToast('Erro ao carregar categorias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      showToast('Nome é obrigatório', 'error');
      return;
    }

    setIsSubmitting(true);
    const slug = formData.slug || generateSlug(formData.name);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('category')
          .update({
            name: formData.name,
            slug,
            description: formData.description
          })
          .eq('id', editingId);

        if (error) throw error;
        showToast('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('category')
          .insert([{
            name: formData.name,
            slug,
            description: formData.description
          }]);

        if (error) throw error;
        showToast('Categoria criada com sucesso!');
      }

      setFormData({ name: '', slug: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      showToast(error.message || 'Erro ao salvar categoria', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setEditingId(category.id);
    setShowForm(true);
    // Scroll para o topo para ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria? Todos os cursos associados poderão ser afetados.')) return;

    try {
      const { error } = await supabase
        .from('category')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Categoria excluída!');
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      showToast(error.message || 'Erro ao deletar categoria', 'error');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', slug: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Categorias</h1>
          <p className="text-slate-400 mt-1">Organize seus cursos por tópicos e facilite a busca dos alunos.</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'secondary' : 'primary'}
          className="rounded-full"
        >
          {showForm ? '✕ Cancelar' : '＋ Nova Categoria'}
        </Button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm animate-in zoom-in-95 duration-300 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
            {editingId ? 'Editar Categoria' : 'Informações da Categoria'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome da Categoria"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingId) {
                    setFormData((prev) => ({
                      ...prev,
                      slug: generateSlug(e.target.value),
                    }));
                  }
                }}
                placeholder="Ex: Marketing Digital"
                required
              />

              <Input
                label="URL Slug (amigável)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="marketing-digital"
                className="font-mono"
                helperText="Identificador único para a URL"
              />
            </div>

            <TextArea
              label="Descrição (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva brevemente o que os alunos encontrarão nesta categoria..."
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Descartar
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List Search */}
      <div className="relative">
        <Input
          placeholder="Buscar categorias..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 bg-slate-900/30 border-slate-800/50 rounded-2xl"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
      </div>

      {/* List Section */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden shadow-sm backdrop-blur-md">
        {filteredCategories.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-3xl opacity-50 mb-4">📂</div>
            <h3 className="text-xl font-semibold text-slate-300">Nenhuma categoria encontrada</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">Tente outro termo de busca ou crie uma nova categoria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/20 border-b border-slate-800">
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Slug</th>
                  <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="group border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center text-blue-400 font-bold group-hover:scale-110 transition-transform">
                          {category.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 block">{category.name}</span>
                          {category.description && (
                            <span className="text-xs text-slate-500 line-clamp-1">{category.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <code className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded-lg font-mono tracking-tight">{category.slug}</code>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
