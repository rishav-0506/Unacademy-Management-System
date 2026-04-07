import { supabase } from './supabaseClient';
import { LeadSource, Counsellor, MapLeader } from '../types';
import { INITIAL_LEAD_SOURCES, INITIAL_LEAD_BY } from '../constants';

export const systemConfigService = {
  async getLeadSources() {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'lead_source')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching lead sources:', error);
      return INITIAL_LEAD_SOURCES;
    }
    const value = data?.value;
    return Array.isArray(value) ? (value as LeadSource[]) : INITIAL_LEAD_SOURCES;
  },
  async getLeadBy() {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'lead_by')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching lead by:', error);
      return INITIAL_LEAD_BY;
    }
    const value = data?.value;
    return Array.isArray(value) ? (value as string[]) : INITIAL_LEAD_BY;
  },
  async getCounsellors() {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'counsellors')
      .maybeSingle();
    
    if (error) throw error;
    const value = data?.value;
    return Array.isArray(value) ? (value as Counsellor[]) : [];
  },
  async getMapLeaders() {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'map_leader')
      .maybeSingle();
    
    if (error) throw error;
    const value = data?.value;
    return Array.isArray(value) ? (value as MapLeader[]) : [];
  }
};
