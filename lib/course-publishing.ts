import { SupabaseClient } from '@supabase/supabase-js';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates if a course can be published based on MVP rules:
 * 1. Must have at least 1 module
 * 2. Must have at least 1 published lesson (in any module)
 */
export async function validateCoursePublication(
    supabase: SupabaseClient,
    courseId: string,
    schoolId: string
): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1. Check for modules
    const { count: moduleCount, error: moduleError } = await supabase
        .from('module')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('school_id', schoolId);

    if (moduleError) {
        console.error('Error validation modules:', moduleError);
        return { isValid: false, errors: ['Erro ao validar módulos do curso.'] };
    }

    const hasModules = (moduleCount || 0) > 0;
    if (!hasModules) {
        errors.push('Faltam módulos (adicione ao menos 1 módulo).');
    }

    // 2. Check for published lessons
    const { count: lessonCount, error: lessonError } = await supabase
        .from('lesson')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('school_id', schoolId)
        .eq('status', 'published');

    if (lessonError) {
        console.error('Error validation lessons:', lessonError);
        return { isValid: false, errors: ['Erro ao validar aulas do curso.'] };
    }

    const hasPublishedLessons = (lessonCount || 0) > 0;
    if (!hasPublishedLessons) {
        errors.push('Faltam aulas publicadas (adicione ao menos 1 aula com status "Publicado").');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
