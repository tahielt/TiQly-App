import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Use environment variables or fallback to hardcoded values for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://msvqdfdewkwbqsrxruol.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_EVCdd_BFOMGgbTqNX6m1_A_YLM9Cuvo';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Helper to check connection
export const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('events').select('count').limit(1);
        if (error) {
            console.log('⚠️ Supabase connected but table may not exist:', error.message);
            return { connected: true, tableExists: false, error: error.message };
        }
        console.log('✅ Supabase connected successfully!');
        return { connected: true, tableExists: true, data };
    } catch (e) {
        console.error('❌ Supabase connection failed:', e);
        return { connected: false, error: e };
    }
};

export default supabase;