import { MetadataRoute } from 'next'
import { getPublicOrganizationSettings } from '@/lib/actions/settings'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const settings = await getPublicOrganizationSettings();
    const appName = settings?.name || 'RodaMAx';
    const logoUrl = settings?.logo_url;

    // Default icons if no logo is provided
    const defaultIcons = [
        {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
        },
        {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
        },
        {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
        },
    ];

    // If we have a custom logo, use it as the main icon
    // Note: We keep the default icons as fallback if logoUrl fails
    const icons = logoUrl ? [
        {
            src: logoUrl,
            sizes: 'any',
            type: logoUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
            purpose: 'any',
        },
        ...defaultIcons
    ] : defaultIcons;

    return {
        name: appName,
        short_name: settings?.name || 'RodaMAx',
        description: 'Sistema de Gestión y Cotización de Neumáticos',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: icons as any,
    }
}
