'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

interface School {
    id: string;
    slug: string;
    name: string;
}

interface SchoolContextType {
    school: School | null;
    loading: boolean;
}

const SchoolContext = createContext<SchoolContextType>({
    school: null,
    loading: true,
});

export function SchoolProvider({ children }: { children: React.ReactNode }) {
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                // 1. Try to get school from user membership first (more secure/reliable for logged users)
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const { data: memberData } = await supabase
                        .from('school_members')
                        .select('school_id, schools(id, slug, name)')
                        .eq('user_id', session.user.id)
                        .single();

                    if (memberData?.schools) {
                        setSchool(memberData.schools as any);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Fallback: Try to get from URL (if public or not logged in yet) - not implemented here as this is mostly for teacher layout
                // or default to 'escola-raiz' for backward compatibility during migration
                // We'll just default to 'escola-raiz' if nothing else found for now, or handle as error
                const { data: defaultSchool } = await supabase
                    .from('schools')
                    .select('id, slug, name')
                    .eq('slug', 'escola-raiz')
                    .single();

                if (defaultSchool) {
                    setSchool(defaultSchool);
                }

            } catch (error) {
                console.error('Error fetching school context:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchool();
    }, []);

    return (
        <SchoolContext.Provider value={{ school, loading }}>
            {children}
        </SchoolContext.Provider>
    );
}

export const useSchool = () => useContext(SchoolContext);
