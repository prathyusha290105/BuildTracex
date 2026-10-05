import { supabase } from '@/lib/supabase';
import { InspectionTemplate, TemplateItem } from '@/types';
import { activityService } from './activityService';

export const templateService = {
  async getTemplates(): Promise<InspectionTemplate[]> {
    const { data: templates, error } = await supabase
      .from('inspection_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!templates) return [];

    // Fetch items count for each template
    const templatesWithCount = await Promise.all(
      templates.map(async (tmpl) => {
        const { count } = await supabase
          .from('template_items')
          .select('*', { count: 'exact', head: true })
          .eq('template_id', tmpl.id);

        return {
          ...tmpl,
          items_count: count || 0,
        };
      })
    );

    return templatesWithCount as InspectionTemplate[];
  },

  async getTemplateById(id: string): Promise<InspectionTemplate> {
    const { data: template, error } = await supabase
      .from('inspection_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: items, error: itemsError } = await supabase
      .from('template_items')
      .select('*')
      .eq('template_id', id)
      .order('sort_order', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...template,
      items: (items as TemplateItem[]) || [],
      items_count: items?.length || 0,
    } as InspectionTemplate;
  },

  async createTemplate(
    template: Omit<InspectionTemplate, 'id' | 'created_at' | 'updated_at' | 'items_count' | 'items'>,
    items: Omit<TemplateItem, 'id' | 'template_id' | 'created_at' | 'updated_at'>[]
  ): Promise<InspectionTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: newTemplate, error: tmplError } = await supabase
      .from('inspection_templates')
      .insert([{ ...template, created_by: user?.id }])
      .select()
      .single();

    if (tmplError) throw tmplError;

    if (items.length > 0) {
      const itemsToInsert = items.map((item, idx) => ({
        ...item,
        template_id: newTemplate.id,
        sort_order: item.sort_order ?? idx + 1,
      }));

      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    await activityService.logActivity(
      'create_template',
      'template',
      newTemplate.id,
      newTemplate.name,
      { items_count: items.length }
    );

    return this.getTemplateById(newTemplate.id);
  },

  async updateTemplate(
    id: string,
    updates: Partial<InspectionTemplate>,
    items?: Omit<TemplateItem, 'id' | 'template_id' | 'created_at' | 'updated_at'>[]
  ): Promise<InspectionTemplate> {
    const { data: updatedTemplate, error: tmplError } = await supabase
      .from('inspection_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (tmplError) throw tmplError;

    // If items are provided, replace them safely
    if (items) {
      // Delete old items
      await supabase.from('template_items').delete().eq('template_id', id);

      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map((item, idx) => ({
          ...item,
          template_id: id,
          sort_order: item.sort_order ?? idx + 1,
        }));

        const { error: itemsError } = await supabase
          .from('template_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
    }

    await activityService.logActivity(
      'update_template',
      'template',
      id,
      updatedTemplate.name,
      { items_count: items?.length }
    );

    return this.getTemplateById(id);
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('inspection_templates')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },
};
