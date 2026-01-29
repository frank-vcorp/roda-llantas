# ADR-003: Hosting y Despliegue en Vercel

> **ID:** ARCH-20260129-02
> **Estado:** Aprobado
> **Fecha:** 2026-01-29

## Contexto
Necesitamos una plataforma de hosting para la aplicación web (Next.js) que soporte:
1.  **Server Side Rendering (SSR) / Server Components:** Vital para SEO y rendimiento.
2.  **Edge Functions:** Para procesar los webhooks de entrada de correos rápidamente.
3.  **CI/CD:** Despliegue automático al hacer push a GitHub.
4.  **Manejo de Secretos:** Configuración segura de variables de entorno (Supabase Keys).

## Decisión
Utilizaremos **Vercel** como plataforma de hosting principal.

## Justificación
1.  **Nativo de Next.js:** Vercel es desarrollado por los creadores de Next.js, garantizando compatibilidad 100% con las nuevas features (App Router).
2.  **Infraestructura Zero-Config:** No requiere configurar servidores, Docker, ni Nginx.
3.  **Costos:** El tier gratuito ("Hobby") es suficiente para la fase de validación y MVP.
4.  **Velocidad:** Red global de CDN (Edge Network) incluida por defecto.

## Consecuencias
*   **Positivo:** El frontend estará disponible públicamente en minutos.
*   **Positivo:** Cada Pull Request generará una "Preview URL" para testear antes de aprobar.
*   **Requerimiento:** El usuario (Frank) debe vincular su cuenta de GitHub con Vercel.
*   **Requerimiento:** Las variables de entorno de Supabase deben copiarse manualmente al panel de Vercel.
