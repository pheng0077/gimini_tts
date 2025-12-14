import { supabase } from '../lib/supabaseClient';

const BUCKET_NAME = 'voice-samples';

export interface VoiceSample {
    id: string;
    voice_name: string;
    storage_path: string;
    created_at: string;
}

/**
 * Check if a voice sample exists in cache
 */
export const getVoiceSample = async (voiceName: string): Promise<string | null> => {
    try {
        // Check database for existing sample
        const { data, error } = await supabase
            .from('voice_samples')
            .select('storage_path')
            .eq('voice_name', voiceName)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No sample found
                return null;
            }
            throw error;
        }

        if (data?.storage_path) {
            // Get public URL from storage
            const { data: urlData } = supabase
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(data.storage_path);

            return urlData.publicUrl;
        }

        return null;
    } catch (error) {
        console.error('Error getting voice sample:', error);
        return null;
    }
};

/**
 * Upload a voice sample to cache
 */
export const cacheVoiceSample = async (voiceName: string, audioBlob: Blob): Promise<boolean> => {
    try {
        const fileName = `${voiceName.toLowerCase().replace(/\s+/g, '_')}.wav`;
        const filePath = `samples/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, audioBlob, {
                contentType: 'audio/wav',
                upsert: true, // Replace if exists
            });

        if (uploadError) throw uploadError;

        // Save reference in database
        const { error: dbError } = await supabase
            .from('voice_samples')
            .upsert({
                voice_name: voiceName,
                storage_path: filePath,
            }, {
                onConflict: 'voice_name'
            });

        if (dbError) throw dbError;

        return true;
    } catch (error) {
        console.error('Error caching voice sample:', error);
        return false;
    }
};
