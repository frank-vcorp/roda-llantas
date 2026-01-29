# 🏗️ ARQUITECTURA DEL SISTEMA: LLANTERA PRO

## 1. Stack Tecnológico
- **Frontend/App:** Next.js (React) - Configurado como Progressive Web App (PWA).
- **Base de Datos:** Supabase (PostgreSQL).
- **Autenticación:** Supabase Auth (Email/Password).
- **Servicios Externos:** Postmark/SendGrid (Inbound Email Parsing).
- **Estilos:** Tailwind CSS (implícito en Next.js moderno).

## 2. Arquitectura de Alto Nivel
La aplicación sigue una arquitectura Serverless / Jamstack.
- **Cliente:** PWA que consume APIs de Next.js.
- **API:** Next.js Route Handlers (Backend-for-Frontend) y Webhooks para ingesta de correos.
- **Persistencia:** Supabase gestiona datos, auth y reglas de acceso (RLS).

## 3. Módulos Principales
1.  **Ingesta Automática (The Refinery):** Webhook que recibe emails + excel, parsea y normaliza datos hacia Supabase.
2.  **Buscador & Catálogo:** Interfaz de búsqueda fuzzy y gestión de inventario.
3.  **Motor de Precios:** Lógica de negocio para cálculo de precios venta base a costo + margen.
4.  **Generador de Cotizaciones:** Generación de imágenes/PDF para compartir por WhatsApp.

## 4. Estándares
- **Mobile First:** Diseño pensado para uso en celular.
- **Offline First:** Uso de Service Workers para caché de catálogo.
