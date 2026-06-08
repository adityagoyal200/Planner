import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Per-user cloud state ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCloudState(userId: string): Promise<Record<string, any> | null> {
    try {
        const { data, error } = await supabase
            .from('planner_state')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (error) {
            // PGRST116 = row not found, which is fine for new users
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching state from Supabase:', error);
            return null;
        }

        return data?.data || null;
    } catch (err) {
        console.error('Network error fetching cloud state:', err);
        return null;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCloudState(userId: string, stateData: Record<string, any>) {
    try {
        const { error } = await supabase
            .from('planner_state')
            .upsert({
                user_id: userId,
                data: stateData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error saving state to Supabase:', error);
        }
    } catch (err) {
        console.error('Network error saving cloud state:', err);
    }
}
