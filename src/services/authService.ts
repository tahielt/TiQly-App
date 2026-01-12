import { supabase } from '../lib/supabase';
import { User } from '../types/auth';

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
    email: string,
    password: string,
    name: string
): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (data.user) {
            // Profile is auto-created by the trigger we set up
            const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || name,
                roles: ['attendee'],
                activeRole: 'attendee',
                token: data.session?.access_token,
            };
            return { success: true, user };
        }

        return { success: false, error: 'No user returned' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (data.user) {
            // Fetch profile for additional info
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: profile?.name || data.user.user_metadata?.name || email.split('@')[0],
                phone: profile?.phone,
                avatar: profile?.avatar_url,
                roles: [profile?.role || 'attendee'],
                activeRole: profile?.role || 'attendee',
                token: data.session?.access_token,
            };
            return { success: true, user };
        }

        return { success: false, error: 'No user returned' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

/**
 * Get current session
 */
export const getSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            return null;
        }
        return session;
    } catch (e) {
        return null;
    }
};

/**
 * Get current user from session
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return null;
        }

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email!,
            name: profile?.name || user.user_metadata?.name || user.email!.split('@')[0],
            phone: profile?.phone,
            avatar: profile?.avatar_url,
            roles: [profile?.role || 'attendee'],
            activeRole: profile?.role || 'attendee',
        };
    } catch (e) {
        return null;
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (
    userId: string,
    updates: { name?: string; phone?: string; avatar_url?: string }
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export default {
    signUp,
    signIn,
    signOut,
    getSession,
    getCurrentUser,
    resetPassword,
    updateProfile,
};
