import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqhqicixrcbzqwogabrz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaHFpY2l4cmNienF3b2dhYnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTIyMjQsImV4cCI6MjEwNzg2ODIyNH0.tKpThJBIapEtApyAdDYbZowj3F1LdnpaKPzLa1CgpUs';

export const supabase = createClient(supabaseUrl, supabaseKey);
