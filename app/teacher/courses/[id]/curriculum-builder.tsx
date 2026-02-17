'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button, Input, Badge, TextArea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

// DND Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Resource {
    id: string;
    lesson_id: string;
    title: string;
    type: 'LINK' | 'FILE';
    url?: string;
    file_path?: string;
    order_index: number;
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'published';
    order_index: number;
    video_url: string;
    panda_embed: string;
    module_id: string;
}

interface Module {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

interface CurriculumBuilderProps {
    courseId: string;
    schoolId: string;
    onUpdate?: () => void;
}

// --- Sortable Lesson Item Component ---
function SortableLessonItem({
    lesson,
    index,
    module,
    onEdit,
    onDelete,
    moveLesson
}: {
    lesson: Lesson,
    index: number,
    module: Module,
    onEdit: (l: Lesson) => void,
    onDelete: (id: string) => void,
    moveLesson: (mId: string, idx: number, dir: 'up' | 'down') => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:border-blue-500/30 group transition-all ${isDragging ? 'shadow-2xl border-blue-500/50' : ''}`}
        >
            <div className="flex items-center gap-3 flex-1">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-700 hover:text-blue-500 transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
                    </svg>
                </div>

                <div className="flex flex-col items-center gap-1 mr-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); moveLesson(module.id, index, 'up'); }}
                        disabled={index === 0}
                        className="text-[10px] text-slate-700 hover:text-blue-500 disabled:opacity-0 transition-all"
                    >▲</button>
                    <button
                        onClick={(e) => { e.stopPropagation(); moveLesson(module.id, index, 'down'); }}
                        disabled={index === module.lessons.length - 1}
                        className="text-[10px] text-slate-700 hover:text-blue-500 disabled:opacity-0 transition-all"
                    >▼</button>
                </div>

                <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => onEdit(lesson)}
                >
                    <div className="text-[10px] font-black text-slate-600 w-5">{index + 1}.</div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{lesson.title}</span>
                        <div className="flex gap-2 items-center mt-1">
                            <Badge variant={lesson.status}>{lesson.status === 'published' ? 'Ativa' : 'Rascunho'}</Badge>
                            {lesson.video_url || lesson.panda_embed ? (
                                <span className="text-[8px] font-bold text-blue-500/60 uppercase tracking-widest">🎥 Vídeo</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => onEdit(lesson)}>✏️</Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(lesson.id)} className="text-red-500">🗑️</Button>
            </div>
        </div>
    );
}

// --- Sortable Module Item Component ---
function SortableModuleItem({
    module,
    index,
    total,
    isExpanded,
    toggleExpand,
    onEdit,
    onDelete,
    moveModule,
    children
}: {
    module: Module,
    index: number,
    total: number,
    isExpanded: boolean,
    toggleExpand: (id: string) => void,
    onEdit: (m: Module) => void,
    onDelete: (id: string) => void,
    moveModule: (idx: number, dir: 'up' | 'down') => void,
    children: React.ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.7 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-slate-900/20 border border-slate-800 rounded-[2.5rem] overflow-hidden transition-all ${isDragging ? 'shadow-2xl border-blue-500 ring-2 ring-blue-500/20' : ''}`}
        >
            {/* Module Header */}
            <div className={`p-5 flex items-center justify-between group cursor-pointer hover:bg-slate-800/30 transition-colors ${isExpanded ? 'bg-slate-800/20 border-b border-slate-800' : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                    {/* Module Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 text-slate-700 hover:text-blue-500 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="9" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" />
                            <circle cx="15" cy="5" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                        </svg>
                    </div>

                    <div className="flex flex-col items-center gap-1 mr-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }}
                            disabled={index === 0}
                            className="text-slate-600 hover:text-blue-500 disabled:opacity-0 transition-all text-xs"
                        >▲</button>
                        <button
                            onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }}
                            disabled={index === total - 1}
                            className="text-slate-600 hover:text-blue-500 disabled:opacity-0 transition-all text-xs"
                        >▼</button>
                    </div>

                    <div onClick={() => toggleExpand(module.id)} className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:text-blue-400 transition-colors">
                            {index + 1}
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{module.title}</h4>
                        <Badge variant="info">{module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(module)}>✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(module.id)} className="text-red-500">🗑️</Button>
                    <button onClick={() => toggleExpand(module.id)} className={`p-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </button>
                </div>
            </div>

            {/* Lessons List Area */}
            {isExpanded && (
                <div className="p-6 space-y-3 bg-slate-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
}

// --- MAIN BUILDER ---
export default function CurriculumBuilder({ courseId, schoolId, onUpdate }: CurriculumBuilderProps) {
    const supabase = createClient();
    const { showToast } = useToast();
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // UI States
    const [isSaving, setIsSaving] = useState(false);
    const [activeModuleForm, setActiveModuleForm] = useState<{ id?: string, title: string } | null>(null);
    const [activeLessonForm, setActiveLessonForm] = useState<{ moduleId: string, lesson?: Lesson } | null>(null);
    const [lessonResources, setLessonResources] = useState<Resource[]>([]);
    const [isResourceLoading, setIsResourceLoading] = useState(false);

    // Resource Form State
    const [newResource, setNewResource] = useState({ title: '', url: '', type: 'LINK' as 'LINK' | 'FILE' });
    const [resourceFile, setResourceFile] = useState<File | null>(null);

    // DND Sensors Configuration
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        loadData();
    }, [courseId, schoolId]);

    useEffect(() => {
        if (activeLessonForm?.lesson?.id) {
            loadResources(activeLessonForm.lesson.id);
        } else {
            setLessonResources([]);
        }
    }, [activeLessonForm]);

    const loadResources = async (lessonId: string) => {
        setIsResourceLoading(true);
        try {
            const { data, error } = await supabase
                .from('resource')
                .select('*')
                .eq('lesson_id', lessonId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setLessonResources(data || []);
        } catch (error) {
            console.error('Error loading resources:', error);
        } finally {
            setIsResourceLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: modulesData, error: modulesError } = await supabase
                .from('module')
                .select('*')
                .eq('course_id', courseId)
                .eq('school_id', schoolId)
                .order('order_index', { ascending: true });

            if (modulesError) throw modulesError;

            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lesson')
                .select('*')
                .eq('course_id', courseId)
                .eq('school_id', schoolId)
                .order('order_index', { ascending: true });

            if (lessonsError) throw lessonsError;

            const modulesWithLessons = (modulesData || []).map(m => ({
                ...m,
                lessons: (lessonsData || []).filter(l => l.module_id === m.id)
            }));

            setModules(modulesWithLessons);
        } catch (error: any) {
            showToast('Erro ao carregar currículo: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeModuleForm?.title.trim()) return;

        setIsSaving(true);
        try {
            if (activeModuleForm.id) {
                const { error } = await supabase
                    .from('module')
                    .update({ title: activeModuleForm.title.trim() })
                    .eq('id', activeModuleForm.id)
                    .eq('school_id', schoolId);
                if (error) throw error;
                showToast('Módulo atualizado');
            } else {
                const { error } = await supabase
                    .from('module')
                    .insert([{
                        title: activeModuleForm.title.trim(),
                        course_id: courseId,
                        school_id: schoolId,
                        order_index: modules.length
                    }]);
                if (error) throw error;
                showToast('Módulo criado');
            }
            setActiveModuleForm(null);
            loadData();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const moveModule = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === modules.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const newModules = arrayMove(modules, index, targetIndex);

        // Re-calculate order indexes
        const updatedModules = newModules.map((m, i) => ({ ...m, order_index: i }));
        setModules(updatedModules);

        try {
            await Promise.all(
                updatedModules.map(m =>
                    supabase.from('module').update({ order_index: m.order_index }).eq('id', m.id).eq('school_id', schoolId)
                )
            );
            if (onUpdate) onUpdate();
        } catch (error) {
            showToast('Erro ao reordenar', 'error');
            loadData();
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
        try {
            const { error } = await supabase
                .from('module')
                .delete()
                .eq('id', moduleId)
                .eq('school_id', schoolId);
            if (error) throw error;
            showToast('Módulo removido');
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleSaveLesson = async (e?: React.FormEvent, closeAfterSave = true) => {
        if (e) e.preventDefault();
        if (!activeLessonForm || !activeLessonForm.lesson?.title.trim()) {
            showToast('Dê um título para a aula antes de salvar.', 'error');
            return null;
        }

        setIsSaving(true);
        const { lesson, moduleId } = activeLessonForm;

        try {
            if (lesson.id) {
                const { error } = await supabase
                    .from('lesson')
                    .update({
                        title: lesson.title,
                        description: lesson.description,
                        video_url: lesson.video_url,
                        panda_embed: lesson.panda_embed,
                        status: lesson.status
                    })
                    .eq('id', lesson.id)
                    .eq('school_id', schoolId);
                if (error) throw error;
                showToast('Aula atualizada');
                if (closeAfterSave) setActiveLessonForm(null);
                loadData();
                return lesson.id;
            } else {
                const moduleLessons = modules.find(m => m.id === moduleId)?.lessons || [];
                const { id: _, ...lessonData } = lesson;

                const { data, error } = await supabase
                    .from('lesson')
                    .insert([{
                        ...lessonData,
                        module_id: moduleId,
                        course_id: courseId,
                        school_id: schoolId,
                        order_index: moduleLessons.length
                    }])
                    .select()
                    .single();

                if (error) throw error;
                showToast('Aula criada');

                if (closeAfterSave) {
                    setActiveLessonForm(null);
                } else {
                    // Update current form with new ID so resources can be added
                    setActiveLessonForm({ moduleId, lesson: data as Lesson });
                }

                loadData();
                if (onUpdate) onUpdate();
                return data.id as string;
            }
        } catch (error: any) {
            showToast(error.message, 'error');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const moveLesson = async (moduleId: string, index: number, direction: 'up' | 'down') => {
        const moduleIdx = modules.findIndex(m => m.id === moduleId);
        if (moduleIdx === -1) return;

        const lessons = modules[moduleIdx].lessons;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === lessons.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const newLessons = arrayMove(lessons, index, targetIndex);

        // Optimistic update
        const updatedModules = [...modules];
        updatedModules[moduleIdx] = {
            ...updatedModules[moduleIdx],
            lessons: newLessons.map((l, i) => ({ ...l, order_index: i }))
        };
        setModules(updatedModules);

        try {
            await Promise.all(
                updatedModules[moduleIdx].lessons.map(l =>
                    supabase.from('lesson').update({ order_index: l.order_index }).eq('id', l.id).eq('school_id', schoolId)
                )
            );
            if (onUpdate) onUpdate();
        } catch (error) {
            showToast('Erro ao reordenar aula', 'error');
            loadData();
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Excluir esta aula?')) return;
        try {
            const { error } = await supabase
                .from('lesson')
                .delete()
                .eq('id', lessonId)
                .eq('school_id', schoolId);
            if (error) throw error;
            showToast('Aula removida');
            loadData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleAddResource = async () => {
        if (!activeLessonForm || !newResource.title) return;

        let lessonId = activeLessonForm.lesson?.id;

        // If it's a new lesson, save it first to get an ID
        if (!lessonId) {
            lessonId = await handleSaveLesson(undefined, false) || undefined;
            if (!lessonId) return; // Save failed or title missing
        }

        setIsSaving(true);
        try {
            let finalUrl = newResource.url;
            let filePath = '';

            if (newResource.type === 'FILE' && resourceFile) {
                const fileExt = resourceFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                filePath = `${schoolId}/${lessonId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('lesson-resources')
                    .upload(filePath, resourceFile);

                if (uploadError) throw uploadError;
                finalUrl = '';
            }

            const { error } = await supabase
                .from('resource')
                .insert([{
                    lesson_id: lessonId,
                    school_id: schoolId,
                    title: newResource.title,
                    type: newResource.type,
                    url: finalUrl,
                    file_path: filePath,
                    order_index: lessonResources.length
                }]);

            if (error) throw error;
            showToast('Material adicionado');
            setNewResource({ title: '', url: '', type: 'LINK' });
            setResourceFile(null);
            loadResources(lessonId);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteResource = async (resource: Resource) => {
        if (!confirm('Excluir este material?')) return;
        try {
            if (resource.type === 'FILE' && resource.file_path) {
                await supabase.storage.from('lesson-resources').remove([resource.file_path]);
            }

            const { error } = await supabase
                .from('resource')
                .delete()
                .eq('id', resource.id)
                .eq('school_id', schoolId);

            if (error) throw error;
            showToast('Material removido');
            if (activeLessonForm?.lesson?.id) loadResources(activeLessonForm.lesson.id);
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const moveResource = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === lessonResources.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const newResources = arrayMove(lessonResources, index, targetIndex);
        const updatedResources = newResources.map((r, i) => ({ ...r, order_index: i }));

        setLessonResources(updatedResources);

        try {
            await Promise.all(
                updatedResources.map(r =>
                    supabase.from('resource').update({ order_index: r.order_index }).eq('id', r.id).eq('school_id', schoolId)
                )
            );
        } catch (error) {
            showToast('Erro ao reordenar material', 'error');
            if (activeLessonForm?.lesson?.id) loadResources(activeLessonForm.lesson.id);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Check if we are dragging a module or a lesson
        const activeModule = modules.find(m => m.id === active.id);
        const overModule = modules.find(m => m.id === over.id);

        if (activeModule && overModule) {
            // Reordering Modules
            const oldIndex = modules.findIndex(m => m.id === active.id);
            const newIndex = modules.findIndex(m => m.id === over.id);

            const newModules = arrayMove(modules, oldIndex, newIndex);
            const updatedModules = newModules.map((m, i) => ({ ...m, order_index: i }));
            setModules(updatedModules);

            try {
                // Update all modules order in DB
                await Promise.all(updatedModules.map(m =>
                    supabase.from('module').update({ order_index: m.order_index }).eq('id', m.id).eq('school_id', schoolId)
                ));
                if (onUpdate) onUpdate();
            } catch (error) {
                showToast('Erro ao salvar nova ordem dos módulos', 'error');
                loadData();
            }
            return;
        }

        // Reordering Lessons within the same module
        let activeLesson: Lesson | undefined;
        let activeModuleId: string | undefined;

        modules.forEach(m => {
            const found = m.lessons.find(l => l.id === active.id);
            if (found) {
                activeLesson = found;
                activeModuleId = m.id;
            }
        });

        if (activeLesson && activeModuleId) {
            const currentModule = modules.find(m => m.id === activeModuleId)!;
            const oldIndex = currentModule.lessons.findIndex(l => l.id === active.id);
            const newIndex = currentModule.lessons.findIndex(l => l.id === over.id);

            if (newIndex === -1) return; // Dropped outside the same module

            const newLessons = arrayMove(currentModule.lessons, oldIndex, newIndex);
            const updatedLessons = newLessons.map((l, i) => ({ ...l, order_index: i }));

            const updatedModules = modules.map(m => m.id === activeModuleId ? { ...m, lessons: updatedLessons } : m);
            setModules(updatedModules);

            try {
                await Promise.all(updatedLessons.map(l =>
                    supabase.from('lesson').update({ order_index: l.order_index }).eq('id', l.id).eq('school_id', schoolId)
                ));
                if (onUpdate) onUpdate();
            } catch (error) {
                showToast('Erro ao salvar nova ordem das aulas', 'error');
                loadData();
            }
        }
    };

    if (loading) return <div className="text-center py-10 opacity-50">Carregando currículo...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
                <div>
                    <h3 className="text-xl font-bold text-white">Estrutura do Curso</h3>
                    <p className="text-slate-500 text-sm">Organize seus módulos e aulas de forma hierárquica.</p>
                </div>
                <Button onClick={() => setActiveModuleForm({ title: '' })} size="sm">＋ Adicionar Módulo</Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <div className="space-y-4">
                    <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                        {modules.map((module, mIdx) => (
                            <SortableModuleItem
                                key={module.id}
                                module={module}
                                index={mIdx}
                                total={modules.length}
                                isExpanded={!!expandedModules[module.id]}
                                toggleExpand={toggleModule}
                                onEdit={(m) => setActiveModuleForm({ id: m.id, title: m.title })}
                                onDelete={(id) => handleDeleteModule(id)}
                                moveModule={moveModule}
                            >
                                <div className="space-y-3">
                                    <SortableContext items={module.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        {module.lessons.map((lesson, lIdx) => (
                                            <SortableLessonItem
                                                key={lesson.id}
                                                lesson={lesson}
                                                index={lIdx}
                                                module={module}
                                                onEdit={(l) => setActiveLessonForm({ moduleId: module.id, lesson: { ...l } })}
                                                onDelete={(id) => handleDeleteLesson(id)}
                                                moveLesson={moveLesson}
                                            />
                                        ))}
                                    </SortableContext>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-dashed border-slate-800 bg-transparent hover:bg-blue-600/5 hover:border-blue-500/30 text-slate-500 hover:text-blue-400"
                                        onClick={() => setActiveLessonForm({
                                            moduleId: module.id,
                                            lesson: { id: '', title: '', description: '', status: 'draft', video_url: '', panda_embed: '', order_index: module.lessons.length, module_id: module.id }
                                        })}
                                    >
                                        ＋ Adicionar Aula neste Módulo
                                    </Button>
                                </div>
                            </SortableModuleItem>
                        ))}
                    </SortableContext>

                    {modules.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-[3rem]">
                            <p className="text-slate-500">Nenhum módulo cadastrado para este curso.</p>
                            <Button onClick={() => setActiveModuleForm({ title: '' })} variant="ghost" className="mt-2">Começar a criar estrutura</Button>
                        </div>
                    )}
                </div>
            </DndContext>

            {/* Modals remain the same */}
            {activeModuleForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 underline decoration-blue-500 decoration-4 underline-offset-8">
                            {activeModuleForm.id ? 'Editar Módulo' : 'Novo Módulo'}
                        </h3>
                        <form onSubmit={handleSaveModule} className="space-y-6">
                            <Input
                                label="Título do Módulo"
                                value={activeModuleForm.title}
                                onChange={e => setActiveModuleForm({ ...activeModuleForm, title: e.target.value })}
                                placeholder="Ex: Fundamentos de IA"
                                autoFocus
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setActiveModuleForm(null)}>Cancelar</Button>
                                <Button type="submit" loading={isSaving}>{activeModuleForm.id ? 'Salvar Alterações' : 'Criar Módulo'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeLessonForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold text-white mb-6 underline decoration-indigo-500 decoration-4 underline-offset-8">
                            {activeLessonForm.lesson?.id ? 'Editar Aula' : 'Nova Aula'}
                        </h3>
                        <form onSubmit={handleSaveLesson} className="space-y-6">
                            <Input
                                label="Título da Aula"
                                value={activeLessonForm.lesson?.title}
                                onChange={e => setActiveLessonForm({
                                    ...activeLessonForm,
                                    lesson: { ...activeLessonForm.lesson!, title: e.target.value }
                                })}
                                placeholder="Ex: O que é o ChatGPT?"
                                required
                            />
                            <TextArea
                                label="Descrição"
                                value={activeLessonForm.lesson?.description}
                                onChange={e => setActiveLessonForm({
                                    ...activeLessonForm,
                                    lesson: { ...activeLessonForm.lesson!, description: e.target.value }
                                })}
                                placeholder="O que o aluno vai aprender nesta aula..."
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="URL do Vídeo (Opcional)"
                                    value={activeLessonForm.lesson?.video_url}
                                    onChange={e => setActiveLessonForm({
                                        ...activeLessonForm,
                                        lesson: { ...activeLessonForm.lesson!, video_url: e.target.value }
                                    })}
                                    placeholder="Link YouTube ou Vimeo"
                                />
                                <Input
                                    label="Embed Code (Panda/YouTube)"
                                    value={activeLessonForm.lesson?.panda_embed}
                                    onChange={e => setActiveLessonForm({
                                        ...activeLessonForm,
                                        lesson: { ...activeLessonForm.lesson!, panda_embed: e.target.value }
                                    })}
                                    placeholder="<iframe>...</iframe>"
                                />
                            </div>

                            {/* Video Preview Section */}
                            {(activeLessonForm.lesson?.video_url || activeLessonForm.lesson?.panda_embed) && (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            Prévia do Conteúdo
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-600 italic">Identificado automaticamente</span>
                                    </div>
                                    <div className="aspect-video w-full bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative group">
                                        {(() => {
                                            const embedCode = activeLessonForm.lesson?.panda_embed;
                                            const videoUrl = activeLessonForm.lesson?.video_url;

                                            if (embedCode && embedCode.includes('<iframe')) {
                                                return <div className="w-full h-full" dangerouslySetInnerHTML={{
                                                    __html: embedCode.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"')
                                                }} />;
                                            }

                                            if (videoUrl) {
                                                let embedUrl = '';
                                                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                                                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                                    const match = videoUrl.match(regExp);
                                                    if (match && match[2].length === 11) {
                                                        embedUrl = `https://www.youtube.com/embed/${match[2]}`;
                                                    }
                                                }
                                                else if (videoUrl.includes('vimeo.com')) {
                                                    const vimeoId = videoUrl.split('/').pop();
                                                    embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
                                                }

                                                if (embedUrl) {
                                                    return (
                                                        <iframe
                                                            src={embedUrl}
                                                            className="w-full h-full border-0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    );
                                                }
                                            }

                                            return (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 p-10 text-center">
                                                    <span className="text-4xl opacity-20">🎥</span>
                                                    <p className="text-sm font-bold opacity-40 italic">Link ou código inválido para prévia.</p>
                                                </div>
                                            );
                                        })()}
                                        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/0 group-hover:border-blue-500/20 transition-all rounded-3xl"></div>
                                    </div>
                                </div>
                            )}

                            {/* Materials Section - Always visible now */}
                            <div className="pt-6 border-t border-slate-800 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                        📦 Materiais da Aula
                                        <Badge variant="draft">{lessonResources.length}</Badge>
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/40 rounded-3xl border border-slate-800/50">
                                    <div className="space-y-3">
                                        <Input
                                            label="Título do Material/Link"
                                            value={newResource.title}
                                            onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                                            placeholder="Ex: Apostila PDF ou Link Útil"
                                        />
                                        {newResource.type === 'LINK' ? (
                                            <Input
                                                label="URL do Link"
                                                value={newResource.url}
                                                onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        ) : (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arquivo (PDF/Imagem)</label>
                                                <input
                                                    type="file"
                                                    onChange={e => setResourceFile(e.target.files?.[0] || null)}
                                                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-end gap-2">
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewResource({ ...newResource, type: 'LINK' })}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${newResource.type === 'LINK' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-500 border border-transparent'}`}
                                            >🔗 Link</button>
                                            <button
                                                type="button"
                                                onClick={() => setNewResource({ ...newResource, type: 'FILE' })}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${newResource.type === 'FILE' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-500 border border-transparent'}`}
                                            >📁 Arquivo</button>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            disabled={isSaving || !newResource.title || (newResource.type === 'LINK' ? !newResource.url : !resourceFile)}
                                            onClick={handleAddResource}
                                        >
                                            {isSaving ? '⌛...' : '＋ Anexar Material'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {lessonResources.map((res, index) => (
                                        <div key={res.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <button type="button" onClick={() => moveResource(index, 'up')} disabled={index === 0} className="text-[8px] text-slate-700 hover:text-blue-500 disabled:opacity-0 active:scale-125 transition-all">▲</button>
                                                    <button type="button" onClick={() => moveResource(index, 'down')} disabled={index === lessonResources.length - 1} className="text-[8px] text-slate-700 hover:text-blue-500 disabled:opacity-0 active:scale-125 transition-all">▼</button>
                                                </div>
                                                <span className="text-xl">{res.type === 'LINK' ? '🔗' : '📄'}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200">{res.title}</span>
                                                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{res.type === 'LINK' ? res.url : 'Arquivo anexado'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={res.type === 'LINK' ? res.url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesson-resources/${res.file_path}`} target="_blank" rel="noreferrer">
                                                    <Button type="button" variant="ghost" size="sm">👁️</Button>
                                                </a>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteResource(res)} className="text-red-500">🗑️</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {lessonResources.length === 0 && !isResourceLoading && (
                                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Nenhum material anexo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Status:</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveLessonForm({
                                            ...activeLessonForm,
                                            lesson: { ...activeLessonForm.lesson!, status: 'draft' }
                                        })}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeLessonForm.lesson?.status === 'draft' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                                    >
                                        Rascunho
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLessonForm({
                                            ...activeLessonForm,
                                            lesson: { ...activeLessonForm.lesson!, status: 'published' }
                                        })}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeLessonForm.lesson?.status === 'published' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                                    >
                                        Publicado
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={() => setActiveLessonForm(null)}>Cancelar</Button>
                                <Button type="submit" loading={isSaving}>{activeLessonForm.lesson?.id ? 'Salvar Alterações' : 'Criar Aula'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
