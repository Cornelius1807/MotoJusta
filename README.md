# 🏍️ MotoJusta

**Mantenimiento transparente para tu moto.** Cotizaciones estructuradas, control de cambios y reputación verificada para servicios de motocicletas en Lima, Perú.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.4-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4.2-38bdf8?logo=tailwindcss)

---

## 📋 Descripción

MotoJusta es una plataforma web que conecta motociclistas con talleres de confianza, brindando transparencia total en cotizaciones, evidencia fotográfica del servicio, y un sistema de reputación verificado. Cubre **38 historias de usuario** organizadas en tres niveles:

| Badge | Descripción | HUs |
|-------|-------------|-----|
| 🟠 **MVP** | Funcionalidades core | HU-01 a HU-19 + HU-22 (20) |
| 🔵 **EXTRA** | Funcionalidades avanzadas | HU-20, HU-21, HU-23 a HU-32 (12) |
| 🟣 **LABS** | Experimental (AI) | HU-33 a HU-38 (6) |

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Lenguaje** | TypeScript 5 |
| **Estilos** | Tailwind CSS 4.2 + shadcn/ui (28 componentes) |
| **Auth** | Clerk (@clerk/nextjs) |
| **ORM** | Prisma 7.4.1 |
| **Base de datos** | PostgreSQL (Neon Serverless) |
| **Adapter** | @prisma/adapter-neon + @neondatabase/serverless |
| **Storage** | Supabase Storage |
| **Animaciones** | Framer Motion + Lottie (lottie-react) |
| **Validación** | Zod 4 |
| **Estado** | Zustand 5 (feature flags store) |
| **Webhooks** | Svix (verificación Clerk) |
| **Package Manager** | pnpm 10 |

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout (ClerkProvider)
│   ├── sign-in/[[...sign-in]]/       # Auth: inicio de sesión
│   ├── sign-up/[[...sign-up]]/       # Auth: registro
│   ├── api/webhooks/clerk/           # Webhook Clerk (user sync)
│   ├── actions/                      # Server Actions
│   │   ├── motorcycles.ts            # CRUD motos
│   │   ├── service-requests.ts       # Solicitudes de servicio
│   │   ├── quotes.ts                 # Cotizaciones + aceptar/rechazar
│   │   ├── reviews.ts               # Reseñas + rating
│   │   ├── profile.ts               # Perfil + términos
│   │   ├── incidents.ts             # Reportes de incidentes
│   │   └── workshops.ts             # Registro/verificación talleres
│   └── app/                          # App autenticada
│       ├── layout.tsx                # App shell (sidebar + nav)
│       ├── page.tsx                  # Dashboard
│       ├── motos/                    # Gestión de motocicletas
│       ├── perfil/                   # Perfil del usuario
│       ├── solicitudes/              # Solicitudes (list, nueva, [id])
│       ├── historial/                # Historial de servicios
│       ├── ordenes/[id]/             # Detalle de orden
│       ├── notificaciones/           # Centro de notificaciones
│       ├── taller/                   # Panel del taller
│       │   ├── solicitudes/          # Solicitudes disponibles
│       │   ├── ordenes/              # Órdenes del taller
│       │   └── perfil/               # Perfil del taller
│       └── admin/                    # Panel administrador
│           ├── talleres/             # Gestión de talleres
│           ├── incidentes/           # Gestión de incidentes
│           ├── metricas/             # Dashboard de métricas
│           └── config/               # Feature flags
├── components/
│   ├── shared/                       # Componentes compartidos
│   │   ├── app-shell.tsx             # Layout con sidebar + topbar
│   │   ├── feature-badge.tsx         # Badge MVP/EXTRA/LABS
│   │   ├── empty-state.tsx           # Estado vacío con Lottie
│   │   └── page-header.tsx           # Header de página animado
│   ├── lottie-player.tsx             # Componente Lottie universal
│   └── ui/                           # 28 componentes shadcn/ui
├── lib/
│   ├── prisma.ts                     # Cliente Prisma (Neon adapter)
│   ├── supabase.ts                   # Clientes Supabase
│   ├── feature-flags.ts             # 38 feature flags definidos
│   ├── validations.ts               # Schemas Zod
│   └── logger.ts                    # Logger estructurado
├── stores/
│   └── feature-flags-store.ts       # Zustand store con persistencia
├── generated/prisma/                 # Prisma Client generado
└── middleware.ts                     # Clerk middleware (auth)

prisma/
├── schema.prisma                     # ~25 modelos, todos los enums
└── seed.ts                          # Seed data demo
```

## 🚀 Setup Local

### 1. Clonar e instalar

```bash
git clone https://github.com/Cornelius1807/MotoJusta.git
cd MotoJusta
pnpm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `DATABASE_URL` | Connection string PostgreSQL | [Neon](https://neon.tech) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [Clerk](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard |
| `CLERK_WEBHOOK_SECRET` | Webhook endpoint secret | Clerk > Webhooks |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | [Supabase](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | Supabase Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Settings > API |

### 3. Base de datos

```bash
# Generar cliente Prisma
pnpm exec prisma generate

# Crear tablas (requiere DATABASE_URL válido)
pnpm exec prisma db push

# Cargar datos demo
pnpm exec prisma db seed
```

### 4. Ejecutar

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 🎯 Feature Flags

El sistema de feature flags permite activar/desactivar funcionalidades individualmente:

- **Modo MVP** (por defecto): solo muestra las 20 features core
- **Modo completo**: muestra todas las features habilitadas
- **Panel admin** (`/app/admin/config`): gestionar flags en tiempo real

Los flags se persisten en `localStorage` via Zustand y se muestran con badges visuales en la UI.

## 📱 Rutas Principales

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Público | Landing page |
| `/sign-in` | Público | Inicio de sesión |
| `/sign-up` | Público | Registro |
| `/app` | Motociclista | Dashboard |
| `/app/motos` | Motociclista | Mis motocicletas |
| `/app/solicitudes` | Motociclista | Mis solicitudes |
| `/app/solicitudes/nueva` | Motociclista | Wizard nueva solicitud (6 pasos) |
| `/app/solicitudes/[id]` | Motociclista | Detalle con cotizaciones, comparador, chat |
| `/app/historial` | Motociclista | Historial de servicios |
| `/app/ordenes/[id]` | Motociclista | Orden: evidencia, cambios, reseña |
| `/app/taller/solicitudes` | Taller | Solicitudes disponibles |
| `/app/taller/solicitudes/[id]/cotizar` | Taller | Crear cotización |
| `/app/taller/ordenes` | Taller | Órdenes del taller |
| `/app/taller/ordenes/[id]` | Taller | Gestión de orden |
| `/app/admin/talleres` | Admin | Verificar/suspender talleres |
| `/app/admin/incidentes` | Admin | Gestión de incidentes |
| `/app/admin/metricas` | Admin | KPIs de la plataforma |
| `/app/admin/config` | Admin | Feature flags |

## 🎨 Design System

- **Color primario**: Papaya Orange (oklch 0.72 0.19 55) — inspirado en McLaren
- **Componentes UI**: 28 componentes shadcn/ui
- **Animaciones**: Framer Motion (page transitions, stagger, spring)
- **Lottie**: 4 animaciones personalizadas (hero, empty state, success, loading)
- **Mobile-first**: Bottom nav en mobile, sidebar en desktop (lg:w-64)

## 🗄️ Modelos de Datos

~25 modelos Prisma cubriendo:

- **UserProfile** — Perfil con roles (MOTOCICLISTA, TALLER, ADMIN)
- **Motorcycle** — Motos registradas (marca, modelo, uso, km)
- **Category + GuideQuestion** — Categorías con preguntas guía
- **ServiceRequest** — Solicitud con 7 estados de flujo
- **Quote + QuotePartItem** — Cotización con desglose de repuestos
- **WorkOrder** — Orden de trabajo digital
- **ChangeRequest** — Solicitudes de cambio (HU-22 bloqueante)
- **Evidence** — Evidencia fotográfica por etapa
- **Review** — Reseñas con rating obligatorio ≤2
- **IncidentReport** — Reportes de incidentes
- **AuditLog** — Log de auditoría admin
- **FeatureFlag + AppConfig** — Configuración dinámica

## 📦 Scripts

```bash
pnpm dev          # Desarrollo local
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # ESLint
pnpm exec prisma generate    # Regenerar cliente Prisma
pnpm exec prisma db push     # Sincronizar schema → DB
pnpm exec prisma db seed     # Cargar datos demo
pnpm exec prisma studio      # GUI de base de datos
```

## 🔒 Seguridad

- Autenticación via Clerk (OAuth, email, passwordless)
- Middleware protege todas las rutas `/app/*`
- Server Actions validan auth + ownership en cada operación
- Webhook Clerk verificado con Svix
- Validación Zod en inputs

## 📄 Licencia

MIT

---

Hecho con 🧡 para la comunidad motera de Lima.
