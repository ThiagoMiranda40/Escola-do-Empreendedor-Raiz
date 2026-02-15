'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
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
      alert('Nome é obrigatório');
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);

    try {
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('category')
          .update({ name: formData.name, slug })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('category')
          .insert([{ name: formData.name, slug }]);

        if (error) throw error;
      }

      setFormData({ name: '', slug: '' });
      setEditingId(null);
      setShowForm(false);
      loadCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, slug: category.slug });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('category')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      alert('Erro ao deletar categoria');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', slug: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Categorias</h1>
          <p className="text-slate-400 mt-1">Organize seus cursos por tópicos e facilite a busca dos alunos.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-300 ${showForm
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95'
            }`}
        >
          {showForm ? '✕ Cancelar' : '＋ Nova Categoria'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
            {editingId ? 'Editar Categoria' : 'Informações da Categoria'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Nome da Categoria</label>
              <input
                type="text"
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
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
                placeholder="Ex: Marketing Digital"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1 hover:text-blue-400 cursor-help transition-colors" title="Identificador único para a URL">URL Slug (amigável)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white font-mono text-sm tracking-tight"
                placeholder="marketing-digital"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 bg-transparent border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-medium"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-500/10 active:scale-95"
              >
                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Section */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
        {categories.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-3xl opacity-50 mb-4">📂</div>
            <h3 className="text-xl font-semibold text-slate-300">Sua lista está vazia</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">Crie sua primeira categoria para começar a organizar seus cursos e materiais.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-500 hover:text-blue-400 font-medium text-sm underline underline-offset-4"
            >
              Começar agora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/20 border-b border-slate-800">
                  <th className="px-8 py-5 text-sm font-semibold text-slate-400 uppercase tracking-wider uppercase">Nome</th>
                  <th className="px-8 py-5 text-sm font-semibold text-slate-400 uppercase tracking-wider uppercase">Slug</th>
                  <th className="px-8 py-5 text-right text-sm font-semibold text-slate-400 uppercase tracking-wider uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="group border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold group-hover:scale-110 transition-transform">
                          {category.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-100">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono">{category.slug}</code>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Excluir"
                        >
                          🗑️
                        </button>
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
