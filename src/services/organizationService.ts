import { supabase } from '../lib/supabase';
import {
    Organization,
    OrganizationMember,
    OrganizationRole,
    RRPPAssignment,
    OrganizationInvitation,
    RRPPDashboardItem,
    UserOrgContext,
} from '../types/organization';

export const organizationService = {
    // ============================================
    // ORGANIZATION CRUD
    // ============================================

    /**
     * Create a new organization (user becomes owner)
     */
    createOrganization: async (
        name: string,
        slug: string,
        data: Partial<Organization> = {}
    ): Promise<Organization | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Create organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name,
                slug,
                ...data,
            })
            .select()
            .single();

        if (orgError || !org) {
            console.error('Error creating organization:', orgError);
            return null;
        }

        // Add creator as owner
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: org.id,
                user_id: user.id,
                role: 'owner',
                status: 'active',
                invited_by: user.id,
                accepted_at: new Date().toISOString(),
            });

        if (memberError) {
            console.error('Error adding owner:', memberError);
            // Rollback org creation
            await supabase.from('organizations').delete().eq('id', org.id);
            return null;
        }

        return org;
    },

    /**
     * Get organization by ID
     */
    getOrganization: async (id: string): Promise<Organization | null> => {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching organization:', error);
            return null;
        }
        return data;
    },

    /**
     * Get organization by slug
     */
    getOrganizationBySlug: async (slug: string): Promise<Organization | null> => {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Update organization
     */
    updateOrganization: async (
        id: string,
        updates: Partial<Organization>
    ): Promise<boolean> => {
        const { error } = await supabase
            .from('organizations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        return !error;
    },

    // ============================================
    // MEMBERS
    // ============================================

    /**
     * Get all members of an organization
     */
    getMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
        const { data, error } = await supabase
            .from('organization_members')
            .select(`
        *,
        user:profiles!user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
            .eq('organization_id', organizationId)
            .neq('status', 'left');

        if (error) {
            console.error('Error fetching members:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Invite a user to organization (by user ID)
     */
    inviteMember: async (
        organizationId: string,
        userId: string,
        role: OrganizationRole
    ): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('organization_members')
            .insert({
                organization_id: organizationId,
                user_id: userId,
                role,
                status: 'pending',
                invited_by: user.id,
            });

        return !error;
    },

    /**
     * Accept invitation
     */
    acceptInvitation: async (memberId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('organization_members')
            .update({
                status: 'active',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', memberId);

        return !error;
    },

    /**
     * Revoke member access
     */
    revokeMember: async (memberId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('organization_members')
            .update({
                status: 'revoked',
                revoked_at: new Date().toISOString(),
            })
            .eq('id', memberId);

        return !error;
    },

    /**
     * Search users by email (for invitation)
     */
    searchUsersByEmail: async (email: string): Promise<{ id: string; email: string; name?: string }[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, name')
            .ilike('email', `%${email}%`)
            .limit(10);

        if (error) return [];
        return data || [];
    },

    // ============================================
    // RRPP ASSIGNMENTS
    // ============================================

    /**
     * Assign RRPP to event
     */
    assignRRPP: async (
        eventId: string,
        userId: string,
        organizationId: string,
        options: {
            maxCortesias?: number;
            commissionPercent?: number;
        } = {}
    ): Promise<RRPPAssignment | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Generate referral code
        const { data: userData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', userId)
            .single();

        const { data: eventData } = await supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();

        const referralCode = `${(userData?.name || 'user').toLowerCase().replace(/\s+/g, '')}-${Date.now().toString(36)}`;

        const { data, error } = await supabase
            .from('rrpp_assignments')
            .insert({
                event_id: eventId,
                user_id: userId,
                organization_id: organizationId,
                referral_code: referralCode,
                max_cortesias: options.maxCortesias || 0,
                commission_percent: options.commissionPercent || 10,
                assigned_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error assigning RRPP:', error);
            return null;
        }
        return data;
    },

    /**
     * Get RRPP dashboard data for current user
     */
    getRRPPDashboard: async (): Promise<RRPPDashboardItem[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('v_rrpp_dashboard')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching RRPP dashboard:', error);
            return [];
        }
        return data || [];
    },

    // ============================================
    // USER CONTEXT (for navigation)
    // ============================================

    /**
     * Get user's organization context (for dynamic tabs)
     */
    getUserOrgContext: async (): Promise<UserOrgContext> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { hasOrganizations: false, isRRPP: false, organizations: [], rrppAssignments: [] };
        }

        // Get memberships
        const { data: memberships } = await supabase
            .from('organization_members')
            .select(`
        *,
        organization:organizations (*)
      `)
            .eq('user_id', user.id)
            .eq('status', 'active');

        // Get RRPP assignments
        const { data: assignments } = await supabase
            .from('rrpp_assignments')
            .select(`
        *,
        event:events (id, title, start_date, cover_image),
        organization:organizations (id, name, logo_url)
      `)
            .eq('user_id', user.id)
            .eq('is_active', true);

        const orgs = memberships || [];
        const rrpp = assignments || [];

        return {
            hasOrganizations: orgs.some(m => m.role === 'owner' || m.role === 'manager'),
            isRRPP: rrpp.length > 0 || orgs.some(m => m.role === 'rrpp'),
            organizations: orgs,
            rrppAssignments: rrpp,
        };
    },

    /**
     * Get pending invitations for current user
     */
    getPendingInvitations: async (): Promise<OrganizationMember[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('organization_members')
            .select(`
        *,
        organization:organizations (*)
      `)
            .eq('user_id', user.id)
            .eq('status', 'pending');

        if (error) return [];
        return data || [];
    },
};
