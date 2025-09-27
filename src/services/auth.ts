import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

const ONBOARDING_FLOW = {
  title: "👋 Getting started in Glide",
  steps: [
    {
      stepNumber: 1,
      title: "Explore This Flow",
      timeEstimate: "2 min",
      description: "👉 Scroll through the steps to see how a flow unfolds\n👀 Notice the quick time estimates and simple tips\n💡 Big tasks shrink into small, doable wins here",
      completionCue: "You’ve seen how tasks shrink into small wins"
    },
    {
      stepNumber: 2,
      title: "Try Checking Off",
      timeEstimate: "30 sec",
      description: "🟢 Tap the checkbox next to this step\n🌟 Watch it turn green\n🧠 Accoumplishing small wins builds momentum",
      completionCue: "Notice how good it feels to move something forward"
    },
    {
      stepNumber: 3,
      title: "Create Your First Flow",
      timeEstimate: "3 min",
      description: "Visit the Homepage to create a new flow\n✍️ Add something you've been putting off\n✨ Let Glide + AI break it into easy steps for you\n🌱 See how breaking down your task into small chunks helps you find your flow",
      completionCue: "You're Gliding through your tasks, without the drag"
    }
  ]
};

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export class AuthService {
  // Fetch user profile from users_profile table
  async getUserProfile(userId: string): Promise<{ firstName?: string; lastName?: string }> {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {};
      }

      return {
        firstName: data.first_name,
        lastName: data.last_name
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
  }

  // Check if user needs onboarding flow and create it
  async ensureOnboardingFlow(userId: string): Promise<void> {
    try {
      // Check if user already has the onboarding flow specifically
      const { data: flows, error } = await supabase
        .from('flows')
        .select('id, title')
        .eq('user_id', userId)
        .eq('title', ONBOARDING_FLOW.title);

      if (error) {
        console.error('Error checking for existing onboarding flow:', error);
        return;
      }

      // If user doesn't have the onboarding flow, create it
      if (!flows || flows.length === 0) {
        await this.createOnboardingFlow(userId);
      }
    } catch (error) {
      console.error('Error ensuring onboarding flow:', error);
    }
  }

  // Create onboarding flow for new users
  async createOnboardingFlow(userId: string): Promise<void> {
    try {
      // Create the flow
      const { data: flow, error: flowError } = await supabase
        .from('flows')
        .insert({
          title: ONBOARDING_FLOW.title,
          user_id: userId
        })
        .select()
        .single();

      if (flowError || !flow) {
        throw new Error(flowError?.message || 'Failed to create onboarding flow');
      }

      // Create the steps
      const stepsToInsert = ONBOARDING_FLOW.steps.map((step) => ({
        flow_id: flow.id,
        step_number: step.stepNumber,
        title: step.title,
        time_estimate: step.timeEstimate,
        description: step.description,
        completion_cue: step.completionCue,
        is_completed: false,
      }));

      const { error: stepsError } = await supabase
        .from('steps')
        .insert(stepsToInsert);

      if (stepsError) {
        // Clean up the flow if steps creation failed
        await supabase.from('flows').delete().eq('id', flow.id);
        throw new Error(stepsError.message || 'Failed to create onboarding steps');
      }
    } catch (error) {
      console.error('Error creating onboarding flow:', error);
      // Don't throw here - we don't want to block signup if onboarding flow creation fails
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for testing
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create user profile in users_profile table
        try {
          const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
              id: data.user.id,
              first_name: firstName,
              last_name: lastName
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't fail signup if profile creation fails, but log it
          }
        } catch (profileErr) {
          console.error('Error creating user profile:', profileErr);
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            firstName,
            lastName
          },
          error: null
        };
      }

      return { user: null, error: 'No user returned' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Fetch user profile
        const profile = await this.getUserProfile(data.user.id);

        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            firstName: profile.firstName,
            lastName: profile.lastName
          },
          error: null
        };
      }

      return { user: null, error: 'No user returned' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch user profile
        const profile = await this.getUserProfile(user.id);

        return {
          id: user.id,
          email: user.email || '',
          firstName: profile.firstName,
          lastName: profile.lastName
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user profile
        const profile = await this.getUserProfile(session.user.id);

        callback({
          id: session.user.id,
          email: session.user.email || '',
          firstName: profile.firstName,
          lastName: profile.lastName
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();