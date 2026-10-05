import { supabase } from '@/lib/supabase';
import { Contractor, Profile } from '@/types';
import { activityService } from './activityService';

export const contractorService = {
  async getContractors(): Promise<Contractor[]> {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('company_name', { ascending: true });

    if (error) throw error;
    return (data as Contractor[]) || [];
  },

  async getContractorById(id: string): Promise<Contractor> {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Contractor;
  },

  async createContractor(contractor: Omit<Contractor, 'id' | 'created_at' | 'updated_at'>): Promise<Contractor> {
    const { data, error } = await supabase
      .from('contractors')
      .insert([contractor])
      .select()
      .single();

    if (error) throw error;

    await activityService.logActivity(
      'create_contractor',
      'contractor',
      data.id,
      data.company_name,
      { specialization: data.specialization }
    );

    return data as Contractor;
  },

  async updateContractor(id: string, updates: Partial<Contractor>): Promise<Contractor> {
    const { data, error } = await supabase
      .from('contractors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await activityService.logActivity(
      'update_contractor',
      'contractor',
      id,
      data.company_name,
      { updates }
    );

    return data as Contractor;
  },

  async getContractorUsers(contractorId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('contractor_users')
      .select('user_id, profiles(*)')
      .eq('contractor_id', contractorId);

    if (error) {
      console.warn('Error fetching contractor users:', error.message);
      return [];
    }

    return (data || []).map((item: any) => item.profiles).filter(Boolean);
  },

  async linkUserToContractor(userId: string, contractorId: string): Promise<void> {
    const { error } = await supabase
      .from('contractor_users')
      .insert([{ user_id: userId, contractor_id: contractorId }]);

    if (error) throw error;
  },

  async unlinkUserFromContractor(userId: string, contractorId: string): Promise<void> {
    const { error } = await supabase
      .from('contractor_users')
      .delete()
      .eq('user_id', userId)
      .eq('contractor_id', contractorId);

    if (error) throw error;
  },
};
