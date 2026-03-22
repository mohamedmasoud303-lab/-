import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    console.log("DEBUG: fetchProfile started for user:", userId);
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("DEBUG: fetchProfile error:", error);
    }
    
    let userProfile = profile;
    
    if (!userProfile) {
      // Auto-create profile if it doesn't exist
      const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Failed to check users count in AuthContext (table might not exist):", countError);
        return;
      }

      const isFirstUser = count === 0;
      
      const newUserProfile = {
        id: userId,
        username: email?.split('@')[0] || 'user',
        role: isFirstUser ? 'ADMIN' : 'USER',
        must_change: false
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert(newUserProfile)
        .select()
        .maybeSingle();

      if (insertError || !newProfile) {
        console.error("Failed to create user profile in AuthContext:", insertError);
        return;
      }
      userProfile = newProfile;
    }

    if (userProfile) {
      setAppUser({
        id: userProfile.id,
        username: userProfile.username || email?.split('@')[0] || 'user',
        role: userProfile.role || 'USER',
        mustChange: userProfile.must_change || false,
        createdAt: userProfile.created_at ? new Date(userProfile.created_at).getTime() : Date.now(),
        hash: '',
        salt: ''
      });
    }
    console.log("DEBUG: fetchProfile completed");
  };

  useEffect(() => {
    console.log("DEBUG: AuthContext useEffect started");
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log("DEBUG: getSession completed, session:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
      console.log("DEBUG: AuthContext loading set to false");
    }).catch((e: any) => {
      console.error("DEBUG: getSession error:", e);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      console.log("DEBUG: onAuthStateChange event:", _event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
