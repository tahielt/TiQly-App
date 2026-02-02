// Types for Organizations and RRPP System

export type OrganizationRole = 'owner' | 'manager' | 'rrpp' | 'staff';
export type MemberStatus = 'pending' | 'active' | 'revoked' | 'left';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    cover_url?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    website?: string;
    city?: string;
    province?: string;
    country: string;
    is_verified: boolean;
    verified_at?: string;
    default_rrpp_commission_percent: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrganizationRole;
    status: MemberStatus;
    invited_by?: string;
    invited_at: string;
    accepted_at?: string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    user?: {
        id: string;
        email: string;
        name?: string;
        avatar_url?: string;
    };
    organization?: Organization;
}

export interface RRPPAssignment {
    id: string;
    event_id: string;
    user_id: string;
    organization_id: string;
    referral_code: string;
    max_cortesias: number;
    used_cortesias: number;
    commission_percent: number;
    tickets_sold: number;
    total_sales_amount: number;
    commission_earned: number;
    assigned_by?: string;
    assigned_at: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    event?: {
        id: string;
        title: string;
        start_date: string;
        cover_image?: string;
    };
    organization?: Organization;
}

export interface OrganizationInvitation {
    id: string;
    organization_id: string;
    target_user_id?: string;
    external_email?: string;
    role: OrganizationRole;
    token: string;
    expires_at: string;
    invited_by: string;
    created_at: string;
    status: InvitationStatus;
    accepted_at?: string;
    // Joined fields
    organization?: Organization;
    inviter?: {
        name?: string;
        email: string;
    };
}

// Dashboard view types (matching Supabase views)
export interface RRPPDashboardItem {
    assignment_id: string;
    user_id: string;
    referral_code: string;
    max_cortesias: number;
    used_cortesias: number;
    tickets_sold: number;
    total_sales_amount: number;
    commission_earned: number;
    is_active: boolean;
    event_id: string;
    event_title: string;
    event_date: string;
    event_image?: string;
    organization_id: string;
    organization_name: string;
    organization_logo?: string;
}

// User context for navigation
export interface UserOrgContext {
    hasOrganizations: boolean;
    isRRPP: boolean;
    organizations: OrganizationMember[];
    rrppAssignments: RRPPAssignment[];
}
