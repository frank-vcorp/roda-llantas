/**
 * Script: Upload store photos to Supabase Storage
 * Run: node scripts/upload-store-photos.mjs
 * 
 * Requires: Download the store photos first and place them in:
 *   /tmp/roda-exterior.jpg
 *   /tmp/roda-bodega.jpg
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const photos = [
    { localPath: '/tmp/roda-exterior.jpg', storageName: 'store/exterior.jpg' },
    { localPath: '/tmp/roda-bodega.jpg', storageName: 'store/bodega.jpg' },
];

for (const photo of photos) {
    if (!existsSync(photo.localPath)) {
        console.warn(`⚠️ File not found: ${photo.localPath} - skipping`);
        continue;
    }
    const buffer = readFileSync(photo.localPath);
    const { error } = await supabase.storage
        .from('branding')
        .upload(photo.storageName, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '86400',
        });
    if (error) {
        console.error(`❌ Error uploading ${photo.storageName}:`, error.message);
    } else {
        const { data } = supabase.storage.from('branding').getPublicUrl(photo.storageName);
        console.log(`✅ Uploaded: ${data.publicUrl}`);
    }
}
