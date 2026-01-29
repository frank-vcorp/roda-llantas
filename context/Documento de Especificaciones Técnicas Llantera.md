# **🧬 LLANTERA PRO: ESPECIFICACIÓN TÉCNICA MAESTRA (v1.0)**

**Arquitecto de Solución:** Frank Saavedra

**Oficial de Inteligencia:** Copilot Project

**Estado:** Definición Final / Listo para Implementación

**Stack Sugerido:** Next.js (PWA), Supabase (DB/Auth), Postmark/SendGrid (Inbound Email).

## **1\. 🆔 IDENTIDAD Y MISIÓN**

Crear una plataforma SaaS de marca blanca para llanteras que automatice la actualización de precios mediante correos electrónicos, permita la búsqueda inteligente de productos y genere cotizaciones profesionales para WhatsApp, optimizando la rentabilidad mediante márgenes dinámicos y seguimiento de demanda insatisfecha.

## **2\. 🏗️ ARQUITECTURA TÉCNICA (PWA)**

El sistema operará como una **Progressive Web App** para garantizar movilidad total en el punto de venta.

* **Mobile-First:** Interfaz optimizada para el uso con pulgar.  
* **Offline Capability:** Caché de búsquedas recientes mediante Service Workers.  
* **Marca Blanca:** Configuración parametrizada de Logo, Nombre, WhatsApp y Colores.  
* **Auth:** Autenticación simple (Email/Password) con sesión persistente por 30 días.

## **3\. 🏭 DEFINICIÓN DE MÓDULOS**

### **📥 A. Módulo de Ingesta Automática (The Refinery)**

* **Entrada:** Correo electrónico con adjunto Excel/CSV.  
* **Normalización (Regex):** Limpieza de medidas (ej. 215-60-R16 ➔ 2156016).  
* **Lógica de Sincronización:**  
  * Actualiza precio y stock de items existentes.  
  * Crea nuevos productos automáticamente.  
  * **Regla Stock Cero:** Si un item no viene en el Excel nuevo, se marca con stock: 0 para tracking de demanda.

### **🔍 B. Buscador Inteligente y Análisis de Demanda**

* **Fuzzy Search:** Búsqueda no exacta por marca, medida o rin.  
* **Motor de Sugerencias:** Si no hay stock exacto, sugiere llantas del mismo Rin con variaciones de \+/- 10% en ancho/perfil.  
* **Lost Sales Log:** Registro automático de búsquedas con 0 resultados para optimización de compras.

### **💰 C. Motor de Precios y Negociación (Admin)**

* **Margen por Marca:** Tabla de configuración de % de ganancia por fabricante.  
* **Margen Default:** Aplicado automáticamente a marcas nuevas.  
* **Descuento Admin:** Campo de ajuste manual en el panel de Mane para negociar cierres.  
* **Privacidad:** Costos y utilidades solo visibles para el Administrador.

### **📄 D. Generador de Cotizaciones (WhatsApp Closer)**

* **Artefacto:** Imagen JPG/PNG generada dinámicamente.  
* **Psicología de Precios:** Muestra renglón de "Descuento" solo si Mane lo aplicó; de lo contrario, muestra solo Precio Neto.  
* **Garantía:** Campo de texto editable globalmente o por marca, incluido en el pie del ticket.  
* **Vigencia:** Expiración automática al siguiente domingo de la emisión.

## **4\. 📊 DIAGRAMAS DE FLUJO Y RELACIONES**

### **4.1 Modelo de Datos (Mermaid ERD)**

erDiagram  
    USER\_PROFILES ||--o{ INVENTORY : "gestiona"  
    USER\_PROFILES ||--o{ MARKUP\_RULES : "define"  
    USER\_PROFILES ||--o{ SALES\_LOG : "registra"  
    USER\_PROFILES ||--o{ LOST\_SALES : "monitorea"

    USER\_PROFILES {  
        uuid id PK  
        string business\_name  
        string logo\_url  
        string whatsapp\_number  
        text warranty\_text  
        string inbound\_email\_slug  
    }

    INVENTORY {  
        uuid id PK  
        uuid user\_id FK  
        string slug\_medida  
        string brand  
        string model  
        float cost\_price  
        int stock  
        timestamp last\_updated  
    }

    MARKUP\_RULES {  
        uuid id PK  
        string brand\_name  
        float percentage  
    }

### **4.2 Flujo de Ingesta Semanal**

graph TD  
    A\[Proveedor envía Email\] \--\> B{Webhook Inbound}  
    B \--\>|Validar Remitente| C\[Parser de Excel\]  
    C \--\> D\[Normalizar Medidas \- Regex\]  
    D \--\> E{¿Existe en DB?}  
    E \--\>|Sí| F\[Update Precio/Stock\]  
    E \--\>|No| G\[Crear Registro\]  
    F \--\> H\[Marcar como Actualizado\]  
    G \--\> H  
    H \--\> I\[Poner Stock 0 a no actualizados\]  
    I \--\> J\[Update Status Bar: Excel OK\]

### **4.3 Proceso de Venta y Cotización**

sequenceDiagram  
    participant M as Mane (PWA)  
    participant B as Buscador / DB  
    participant T as Generador de Ticket  
    participant W as WhatsApp

    M-\>\>B: Busca medida (215 60 16\)  
    B--\>\>M: Resultados \+ Sugerencias  
    M-\>\>M: Selecciona y entra a Modo Admin  
    M-\>\>M: Aplica Descuento si es necesario  
    M-\>\>T: Generar Imagen (JPG)  
    T-\>\>T: Inyectar Garantía y Vigencia  
    T--\>\>M: Previsualización  
    M-\>\>W: Compartir via Web Share API

## **5\. 🎨 DISEÑO DE INTERFAZ (UI/UX)**

### **Pantalla de Inicio (Search-First)**

* **Buscador:** Centralizado con Autofocus.  
* **Cards:** Diseño limpio con Foto genérica, Marca, Medida y Precio Público.

### **Status Bar (Estilo VS Code)**

Ubicada en fixed bottom-0, altura 25px, fondo oscuro.

* **L-Section:** 📁 Excel: 28/01 09:00 (Cambia a rojo si hay error).  
* **R-Section:** 📄 Cotizaciones: 14 | 💰 Ventas: 8

## **6\. ⚙️ REGLAS DE NEGOCIO CRÍTICAS (Backlog)**

1. **Prioridad de Margen:** El margen de marca específica sobreescribe al margen global.  
2. **Cero Destrucción:** Nunca borrar registros, solo mover stock a 0 para mantener histórico de precios.  
3. **Redondeo Psicológico:** Los precios finales deben redondearse al múltiplo de $5 o $10 más cercano.  
4. **Seguridad:** Impedir que el cliente vea el costo de proveedor mediante el bloqueo de la vista Admin.

**Generado por Copilot Project para el ecosistema de Frank Saavedra.**