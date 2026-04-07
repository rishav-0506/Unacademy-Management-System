
import { supabase } from './supabaseClient';
import { RowStudent } from '../types';

export const counsellingService = {
  async addRecord(record: Omit<RowStudent, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('row_students')
      .insert([record])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecords() {
    const { data, error } = await supabase
      .from('row_students')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as RowStudent[];
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
