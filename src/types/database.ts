export interface Database {
  public: {
    Tables: {
      flows: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          updated_at: string;
          user_id?: string;
        };
        Insert: {
          id?: string;
          title: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      steps: {
        Row: {
          id: string;
          flow_id: string;
          step_number: number;
          title: string;
          time_estimate: string;
          description: string;
          completion_cue: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flow_id: string;
          step_number: number;
          title: string;
          time_estimate: string;
          description: string;
          completion_cue: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flow_id?: string;
          step_number?: number;
          title?: string;
          time_estimate?: string;
          description?: string;
          completion_cue?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Flow = Database['public']['Tables']['flows']['Row'];
export type Step = Database['public']['Tables']['steps']['Row'];
export type FlowInsert = Database['public']['Tables']['flows']['Insert'];
export type StepInsert = Database['public']['Tables']['steps']['Insert'];