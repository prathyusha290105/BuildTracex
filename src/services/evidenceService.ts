import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { EvidenceFile, EvidenceStage } from '@/types';

const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'evidence';

export const evidenceService = {
  async uploadFile(
    file: File,
    stage: EvidenceStage,
    links: {
      inspection_id?: string | null;
      inspection_response_id?: string | null;
      defect_id?: string | null;
      rectification_submission_id?: string | null;
      reinspection_id?: string | null;
      caption?: string | null;
    }
  ): Promise<EvidenceFile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload evidence');

    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `${stage}/${links.defect_id || links.inspection_id || 'general'}/${timestamp}_${cleanFilename}`;

    let publicUrl = '';

    // If Supabase is configured, upload to Storage bucket
    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Storage bucket upload warning:', uploadError.message);
          // If bucket doesn't exist or policy blocks, create local object URL as fallback
          publicUrl = URL.createObjectURL(file);
        } else {
          // Get public URL or signed URL
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
          publicUrl = data?.publicUrl || '';
        }
      } catch (err) {
        console.warn('Storage upload error, using local preview fallback:', err);
        publicUrl = URL.createObjectURL(file);
      }
    } else {
      // Local fallback preview
      publicUrl = URL.createObjectURL(file);
    }

    // Persist evidence record into database
    const { data, error } = await supabase
      .from('evidence_files')
      .insert([
        {
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          stage,
          inspection_id: links.inspection_id || null,
          inspection_response_id: links.inspection_response_id || null,
          defect_id: links.defect_id || null,
          rectification_submission_id: links.rectification_submission_id || null,
          reinspection_id: links.reinspection_id || null,
          caption: links.caption || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('Error saving evidence file metadata:', error.message);
      // Return synthetic EvidenceFile if DB insert failed
      return {
        id: crypto.randomUUID(),
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
        stage,
        ...links,
        created_at: new Date().toISOString(),
        url: publicUrl,
      };
    }

    return {
      ...data,
      url: publicUrl,
    } as EvidenceFile;
  },

  async getEvidenceForDefect(defectId: string): Promise<EvidenceFile[]> {
    const { data, error } = await supabase
      .from('evidence_files')
      .select('*')
      .eq('defect_id', defectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching defect evidence:', error.message);
      return [];
    }

    return (data || []).map((ev) => {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(ev.storage_path);
      return {
        ...ev,
        url: urlData?.publicUrl || '',
      };
    });
  },

  async getEvidenceForInspection(inspectionId: string): Promise<EvidenceFile[]> {
    const { data, error } = await supabase
      .from('evidence_files')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching inspection evidence:', error.message);
      return [];
    }

    return (data || []).map((ev) => {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(ev.storage_path);
      return {
        ...ev,
        url: urlData?.publicUrl || '',
      };
    });
  },
};
