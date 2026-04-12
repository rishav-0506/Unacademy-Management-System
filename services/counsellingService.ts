
import { supabase } from './supabaseClient';
import { RowStudent } from '../types';

export const counsellingService = {
  async addRecord(record: Omit<RowStudent, 'id' | 'created_at'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }
    const { data, error } = await supabase
      .from('row_students')
      .insert([record])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecords() {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }
    const { data, error } = await supabase
      .from('row_students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as RowStudent[];
  },

  async getLatestToken(prefix: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }
    const { data, error } = await supabase
      .from('row_students')
      .select('token_no')
      .like('token_no', `${prefix}%`)
      .order('token_no', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data?.[0]?.token_no || null;
  },

  async deleteRecord(id: string) {
    const { error } = await supabase
      .from('row_students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateRecord(id: string, updates: Partial<RowStudent>) {
    const { data, error } = await supabase
      .from('row_students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as RowStudent;
  }
};
