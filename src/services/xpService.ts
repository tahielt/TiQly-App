import { supabase } from '../lib/supabase';

// XP Constants
const XP_LEVEL_CONSTANT = 100; // XP needed for level 1 -> 2 (linear? or sqrt?)
// Let's use SQRT formula: Level = floor( sqrt(XP) * CONST ) or similar.
// Or simple: Level = floor(XP / 100) + 1. 
// Standard RPG: XP = Level^2 * 100. -> Level = sqrt(XP/100).
// Example: 100 XP = Lvl 1. 400 XP = Lvl 2. 900 XP = Lvl 3.
// Wait, usually Lvl 1 is 0 XP. 
// Lvl 2 requires 100 XP total.
// Level = Math.floor(0.1 * Math.sqrt(xp)) + 1? 
// Let's go simple: Level = Math.floor(xp / 500) + 1. (Linear is boring).
// Let's use: XP Threshold for next level = CurrentLevel * 1000.
// For now, MVP: Level = Math.floor(Math.sqrt(xp / 100)) + 1.
// 0 XP -> Lvl 1. 100 XP -> Lvl 2. 400 XP -> Lvl 3. 2500 XP -> Lvl 6.

export interface UserGamificationState {
    xpTotal: number;
    level: number;
    currentStreak: number;
    maxStreak: number;
    xpToNextLevel: number;
    progressToNextLevel: number; // 0 to 1
}

export const addXp = async (userId: string, amount: number, source: string): Promise<void> => {
    const { error } = await supabase
        .from('xp_transactions')
        .insert({
            user_id: userId,
            amount,
            source
        });

    if (error) {
        console.error('Error adding XP:', error);
        // Don't throw, just log. Gamification shouldn't block core features.
    }
};

export const getUserGamificationState = async (userId: string): Promise<UserGamificationState> => {
    // 1. Get XP Total
    const { data: xpData, error: xpError } = await supabase
        .from('xp_transactions')
        .select('amount')
        .eq('user_id', userId);

    const xpTotal = xpData?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // 2. Get Streak Data
    const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('current_streak, max_streak')
        .eq('user_id', userId)
        .single();

    const currentStreak = streakData?.current_streak || 0;
    const maxStreak = streakData?.max_streak || 0;

    // 3. Calculate Level
    // Formula: Level = floor( sqrt(XP / 100) ) + 1
    const level = Math.floor(Math.sqrt(xpTotal / 100)) + 1;

    // Calculate Progress
    const nextLevel = level + 1;
    const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
    const xpForNextLevel = Math.pow(level, 2) * 100;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const xpInLevel = xpTotal - xpForCurrentLevel;
    const progressToNextLevel = Math.min(Math.max(xpInLevel / xpNeeded, 0), 1);
    const xpToNextLevel = xpForNextLevel - xpTotal;

    return {
        xpTotal,
        level,
        currentStreak,
        maxStreak,
        xpToNextLevel,
        progressToNextLevel
    };
};

export const checkDailyStreak = async (userId: string): Promise<{ streak: number, xpBonus: number, isFirstLogin: boolean }> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!streakData) {
        // Initialize
        await supabase.from('user_streaks').insert({
            user_id: userId,
            current_streak: 1,
            max_streak: 1,
            last_login_date: today
        });
        // Give XP for first day
        await addXp(userId, 50, 'daily_login');
        return { streak: 1, xpBonus: 50, isFirstLogin: true };
    }

    const lastLogin = streakData.last_login_date;

    if (lastLogin === today) {
        // Already logged in today
        return { streak: streakData.current_streak, xpBonus: 0, isFirstLogin: false };
    }

    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    let xpBonus = 50;

    if (lastLogin === yesterdayStr) {
        newStreak = streakData.current_streak + 1;
        // Bonus multiplier?
        if (newStreak % 7 === 0) xpBonus = 200; // Weekly bonus
        else xpBonus = 50 + (newStreak * 10); // Ramp up
    } else {
        // Streak broken
        newStreak = 1;
        xpBonus = 50;
    }

    await supabase
        .from('user_streaks')
        .update({
            current_streak: newStreak,
            max_streak: Math.max(streakData.max_streak, newStreak),
            last_login_date: today
        })
        .eq('user_id', userId);

    await addXp(userId, xpBonus, 'daily_login');

    return { streak: newStreak, xpBonus, isFirstLogin: true };
};

export default {
    addXp,
    getUserGamificationState,
    checkDailyStreak
};
