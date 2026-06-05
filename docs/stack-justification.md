# FlotaOS — Justificación de Stack Tecnológico

**Fecha:** 2026-06-05  
**Referencia:** Estándar de Software YOFC (estandar-sw-yofc.txt)  
**Conclusión:** El estándar es referencia, no obligatorio. Se adoptan los componentes compatibles.

---

## Componentes adoptados del estándar YOFC

| Componente | Estándar | FlotaOS | Estado |
|---|---|---|---|
| Base de datos | PostgreSQL 15 | PostgreSQL 15 | ✅ Igual |
| Containerización | Docker + Compose | Docker + Compose | ✅ Igual |
| Message Broker | Redis | Redis 7 | ✅ Adoptado |
| Background Jobs | Celery | BullMQ (Redis) | ✅ Patrón equivalente |
| Secrets | .env + .dockerignore | .env + .dockerignore | ✅ Igual |
| Git Workflow | develop → main MR | develop → main MR | ✅ Adoptado |
| Zero-downtime Deploy | Blue/Green | Blue/Green en EasyPanel | ✅ Adoptado |

---

## Componentes con stack diferente — Justificación

### 1. Backend: Node.js + Express vs Django REST Framework

**Razón principal: Coherencia de lenguaje en monorepo**

FlotaOS es un monorepo con tres aplicaciones:
- `apps/api` — Node.js + TypeScript
- `apps/web` — Next.js + TypeScript  
- `apps/mobile` — React Native + TypeScript
- `packages/shared` — Tipos TypeScript compartidos (DTOs, enums, interfaces)

Con Node.js + TypeScript, el paquete `packages/shared` permite definir una vez
los tipos `Vehicle`, `TripEvent`, `Expense`, etc. y usarlos en las tres apps
sin duplicación ni riesgo de desincronización.

Con Django (Python), esto sería imposible: el backend hablaría Python y los
frontends hablarían TypeScript. Se perdería la ventaja principal del monorepo.

**Razón secundaria: Curva de aprendizaje del equipo**

El desarrollador ya trabaja con React Native (TypeScript). Agregar Django/Python
implicaría dominar dos lenguajes y dos ecosistemas simultáneamente, duplicando
el riesgo de errores y la velocidad de desarrollo.

**Equivalencia funcional garantizada:**
- Django ORM → Prisma (ORM TypeScript con migraciones)
- Django Auth → JWT custom (access 15min + refresh 7d)
- Celery → BullMQ sobre Redis (mismo patrón de colas distribuidas)
- Django Admin → Endpoints REST documentados con Swagger

---

### 2. Frontend Web: Next.js 14 vs Vue 3 + Vite + Pinia

**Razón principal: Ecosistema React unificado**

La app móvil usa React Native. Usar Next.js en el web permite:
- Mismo paradigma de componentes (JSX, hooks, Context)
- Librerías compartidas: `react-query`, `zod`, `date-fns`
- El desarrollador no tiene que alternar entre Vue y React

**Razón secundaria: SSR nativo para el dashboard**

El dashboard web consume datos en tiempo real y requiere:
- Server-Side Rendering para carga inicial rápida de KPIs
- API Routes integradas (elimina un servidor adicional para BFF)
- Next.js Image optimization para las fotos de campo

Vue 3 + Vite es SPA por defecto y requeriría Nuxt para obtener SSR equivalente,
añadiendo complejidad sin beneficio adicional.

---

## Resumen de decisión

Se adoptaron todos los principios de arquitectura del estándar YOFC:
- PostgreSQL ✅, Docker ✅, Redis ✅, Blue/Green ✅, Git workflow ✅

Las diferencias (Node.js vs Django, Next.js vs Vue) están justificadas por
la naturaleza monorepo del proyecto y la coherencia del ecosistema TypeScript,
que garantiza mayor velocidad de desarrollo y menor superficie de error
con un equipo pequeño part-time.
