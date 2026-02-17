import { createClient } from '@/lib/supabase-client';

export type SchoolInfo = {
    id: string;
    slug: string;
    name: string;
};

export async function getCurrentSchool(slug: string): Promise<SchoolInfo | null> {
    const supabase = createClient();

    const { data: school, error } = await supabase
        .from('schools')
        .select('id, slug, name')
        .eq('slug', slug)
        .single();

    if (error || !school) {
        console.error('Error fetching school:', error);
        return null;
    }

    return school;
}

// Client-side hook for getting school context from URL or storage
// Since this is a server/client hybrid approach, for client components we might extract slug from params
// For now, this function is primarily for server components or async data fetching functions
