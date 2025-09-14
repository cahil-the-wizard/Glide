import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

const ONBOARDING_FLOW = {
  title: "Learn Glide Basics",
  steps: [
    {
      stepNumber: 1,
      title: "Explore This Flow",
      timeEstimate: "2 min",
      description: "👉 Tap through the steps to see how a flow unfolds\n👀 Notice the quick time estimates and simple tips\n💡 Big tasks shrink into small, doable wins here",
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
      description: "➕ Tap the "New Flow" button to start fresh\n✍️ Add something you’ve been putting off\n✨ Let Glide + AI break it into easy steps for you\n🌱 See how breaking down your task into small chunks helps you find your flow",
      completionCue: "You're Gliding through your tasks, without the drag"
    }
  ]
};

export interface AuthUser {
  id: string;
  email: string;
}

export class AuthService {
  // Check if user needs onboarding flow and create it
  async ensureOnboardingFlow(userId: string): Promise<void> {
    try {
      // Check if user has any flows
      const { data: flows, error } = await supabase
        .from('flows')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking for existing flows:', error);
        return;
      }

      // If user has no flows, create onboarding flow
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
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
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
        // Create onboarding flow for new users
        await this.createOnboardingFlow(data.user.id);

        return {
          user: {
            id: data.user.id,
            email: data.user.email || email
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
        return {
          user: {
            id: data.user.id,
            email: data.user.email || email
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
        return {
          id: user.id,
          email: user.email || ''
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || ''
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();