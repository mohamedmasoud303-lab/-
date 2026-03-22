import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or AI Studio Secrets.');
} else {
  console.log('Supabase initialized successfully.');
}

// Only export the client if we have the credentials to avoid immediate crash
const createDummyClient = () => {
    const dummy = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: () => Promise.resolve({ error: null }),
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            updateUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        },
        from: (table: string) => ({
            select: () => ({
                eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }), select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
                maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                order: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
            }),
            insert: () => ({
                select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
            }),
            update: () => ({
                eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            }),
        }),
    };
    return new Proxy(dummy, {
        get: (target, prop) => {
            if (prop in target) return (target as any)[prop];
            console.error(`Attempted to access Supabase property '${String(prop)}' but Supabase is not configured.`);
            return () => ({ data: null, error: new Error('Supabase not configured') });
        }
    });
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient() as any;

