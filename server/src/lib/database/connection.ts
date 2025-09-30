import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Єдиний Supabase клієнт для всього сервера
export class DatabaseConnection {
  private static instance: SupabaseClient;
  
  static getInstance(): SupabaseClient {
    if (!this.instance) {
      const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      this.instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    
    return this.instance;
  }
}
