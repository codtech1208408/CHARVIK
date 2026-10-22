import ws from 'ws';

// Polyfill WebSocket for Node.js environments before importing/creating Supabase client
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded from root or server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://kqhqicixrcbzqwogabrz.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaHFpY2l4cmNienF3b2dhYnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTIyMjQsImV4cCI6MjEwNzg2ODIyNH0.tKpThJBIapEtApyAdDYbZowj3F1LdnpaKPzLa1CgpUs';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Checks connection health to Supabase
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; tablesInitialized?: boolean; message: string; details?: any }> {
  try {
    const { data, error } = await supabase.from('administrators').select('*').limit(1);
    if (error) {
      // If table doesn't exist yet, it's connected to Supabase project successfully but tables need to be created
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('not found')
      ) {
        return {
          connected: true,
          tablesInitialized: false,
          message: 'Connected to Supabase project successfully! PostgreSQL tables need to be created in Supabase SQL editor.',
          details: error.message
        };
      }
      return { connected: false, tablesInitialized: false, message: error.message, details: error };
    }
    return { connected: true, tablesInitialized: true, message: 'Connected to Supabase and tables are verified.', details: data };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Failed to connect to Supabase' };
  }
}
