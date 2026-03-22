import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { toast } from 'react-hot-toast';

export const authService = {
  login: async (email: string, password: string): Promise<{ok: boolean, msg: string, user?: User}> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, msg: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }

    // Fetch user profile for role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    let userProfile = profile;

    if (!userProfile) {
      // Auto-create profile if it doesn't exist
      const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Failed to check users count (table might not exist):", countError);
        return { ok: false, msg: 'جدول المستخدمين (users) غير موجود في قاعدة البيانات. يرجى تنفيذ ملف schema.sql في Supabase.' };
      }

      const isFirstUser = count === 0;
      
      const newUserProfile = {
        id: data.user.id,
        username: data.user.email?.split('@')[0] || 'user',
        role: isFirstUser ? 'ADMIN' : 'USER',
        must_change: false
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert(newUserProfile)
        .select()
        .maybeSingle();

      if (insertError || !newProfile) {
        console.error("Failed to create user profile:", insertError);
        return { ok: false, msg: 'فشل تحميل أو إنشاء ملف المستخدم. تأكد من وجود جدول users وإعدادات RLS.' };
      }
      userProfile = newProfile;
    }

    const user: User = {
      id: userProfile.id,
      username: userProfile.username || data.user.email?.split('@')[0] || 'user',
      role: userProfile.role || 'USER',
      mustChange: userProfile.must_change || false,
      createdAt: userProfile.created_at ? new Date(userProfile.created_at).getTime() : Date.now(),
      hash: '', // Not needed with Supabase Auth
      salt: ''  // Not needed with Supabase Auth
    };

    sessionStorage.setItem('currentUserId', user.id);
    return { ok: true, msg: 'Logged in', user };
  },

  logout: async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('currentUserId');
    window.location.reload();
  },
  
  getCurrentUserId: (): string | null => {
    return sessionStorage.getItem('currentUserId');
  },

  changePassword: async (userId: string, newPass: string): Promise<{ ok: boolean }> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      toast.error('فشل تغيير كلمة المرور');
      return { ok: false };
    }
    
    // Update must_change in profile
    await supabase.from('users').update({ must_change: false }).eq('id', userId);
    
    return { ok: true };
  },

  addUser: async (user: Omit<User, 'id' | 'createdAt' | 'salt' | 'hash'>, pass: string): Promise<{ ok: boolean; msg: string; newUser?: User; }> => {
    // Note: In a real app, you'd use a service role or a cloud function to create users
    // For this direct adoption, we'll use the signUp method which might sign in the user
    // or require email confirmation depending on Supabase settings.
    const { data, error } = await supabase.auth.signUp({
      email: `${user.username}@rentrix.local`, // Mock email if only username is provided
      password: pass,
    });

    if (error) {
      return { ok: false, msg: error.message };
    }

    if (!data.user) return { ok: false, msg: 'فشل إنشاء المستخدم' };

    const newUserProfile = {
      id: data.user.id,
      username: user.username,
      role: user.role,
      must_change: user.mustChange
    };

    const { error: profileError } = await supabase.from('users').insert(newUserProfile);
    
    if (profileError) {
      return { ok: false, msg: 'فشل إنشاء ملف المستخدم' };
    }

    const newUser: User = {
      ...user,
      id: data.user.id,
      createdAt: Date.now(),
      salt: '',
      hash: ''
    };

    return { ok: true, msg: 'User created', newUser };
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
    const supabaseUpdates: any = {};
    if (updates.role) supabaseUpdates.role = updates.role;
    if (updates.username) supabaseUpdates.username = updates.username;
    if (updates.mustChange !== undefined) supabaseUpdates.must_change = updates.mustChange;

    await supabase.from('users').update(supabaseUpdates).eq('id', id);
  },

  forcePasswordReset: async (userId: string): Promise<{ ok: boolean }> => {
    if (window.confirm('هل أنت متأكد من رغبتك في فرض إعادة تعيين كلمة المرور لهذا المستخدم؟')) {
      await supabase.from('users').update({ must_change: true }).eq('id', userId);
      toast.success('تم فرض إعادة تعيين كلمة المرور بنجاح.');
      return { ok: true };
    }
    return { ok: false };
  },
};
