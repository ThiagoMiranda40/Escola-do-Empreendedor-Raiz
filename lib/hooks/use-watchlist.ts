'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/toast';

export function useWatchlist(courseId: string, schoolSlug: string) {
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isListed, setIsListed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkWatchlist = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('course_watchlist')
                .select('id')
                .eq('course_id', courseId)
                .eq('user_id', session.user.id)
                .single();

            if (data) setIsListed(true);
        };
        checkWatchlist();
    }, [courseId, supabase]);

    const toggleWatchlist = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/s/${schoolSlug}/student`);
                return;
            }

            if (isListed) {
                const { error } = await supabase
                    .from('course_watchlist')
                    .delete()
                    .eq('course_id', courseId)
                    .eq('user_id', session.user.id);

                if (error) throw error;
                setIsListed(false);
                showToast('Removido da sua lista');
            } else {
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('slug', schoolSlug)
                    .single();

                const { error } = await supabase
                    .from('course_watchlist')
                    .insert({
                        course_id: courseId,
                        user_id: session.user.id,
                        school_id: schoolData?.id
                    });

                if (error) throw error;
                setIsListed(true);
                showToast('Adicionado à sua lista', 'success', {
                    label: 'Ver minha lista',
                    onClick: () => router.push(`/s/${schoolSlug}/student/watchlist`)
                });
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return { isListed, loading, toggleWatchlist };
}
