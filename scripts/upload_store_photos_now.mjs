import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '/root/antigravity-projects/roda-llantas/.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const uploads = [
    {
        localPath: '/root/.gemini/antigravity/brain/18ee3d23-d4d7-4a2b-baf1-08b68c1602de/media__1772477154467.jpg',
        storagePath: 'store/exterior.jpg',
        label: 'Fachada Exterior',
    },
    {
        localPath: '/root/.gemini/antigravity/brain/18ee3d23-d4d7-4a2b-baf1-08b68c1602de/media__1772477162332.jpg',
        storagePath: 'store/bodega.jpg',
        label: 'Bodega',
    },
];

for (const { localPath, storagePath, label } of uploads) {
    const buffer = readFileSync(localPath);
    const { error } = await supabase.storage
        .from('branding')
        .upload(storagePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '86400',
        });

    if (error) {
        console.error(`❌ Error uploading ${label}:`, error.message);
    } else {
        const { data } = supabase.storage.from('branding').getPublicUrl(storagePath);
        console.log(`✅ ${label}: ${data.publicUrl}`);
    }
}
