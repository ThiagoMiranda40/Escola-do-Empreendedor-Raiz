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
    userRole: 'ADMIN' | 'TEACHER' | 'STUDENT' | null;
    loading: boolean;
}

const SchoolContext = createContext<SchoolContextType>({
    school: null,
    userRole: null,
    loading: true,
});

export function SchoolProvider({ children }: { children: React.ReactNode }) {
    const [school, setSchool] = useState<School | null>(null);
    const [userRole, setUserRole] = useState<'ADMIN' | 'TEACHER' | 'STUDENT' | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const { data: memberData } = await supabase
                        .from('school_members')
                        .select('role, school_id, schools(id, slug, name)')
                        .eq('user_id', session.user.id)
                        .single();

                    if (memberData?.schools) {
                        setSchool(memberData.schools as any);
                        setUserRole(memberData.role as any);
                        setLoading(false);
                        return;
                    }
                }

                // Fallback
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
        <SchoolContext.Provider value={{ school, userRole, loading }}>
            {children}
        </SchoolContext.Provider>
    );
}

export const useSchool = () => useContext(SchoolContext);
