import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fynrtconvaupnteuwvfa.supabase.co';
const supabaseAnonKey = 'sb_publishable_8HzS7WtBzC0vGng2pg0zIg_hKbSLjr2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
