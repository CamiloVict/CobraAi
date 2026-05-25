# Phase 4 — Dashboard Conversaciones y Escalaciones

## Goal
Dar visibilidad a agentes humanos de todas las conversaciones WA y llamadas.
Permitir responder manualmente y gestionar escalaciones.

## Pre-conditions
- Phase 1, 2, 3 completas
- Datos de conversaciones en BD
- `apps/web` (Next.js 14) funcionando con auth Clerk

## Scope

### Backend (service-notifications nuevos endpoints)
- `GET /api/v1/conversations` — lista paginada, filtros: channel, status, tenant
- `GET /api/v1/conversations/:id` — detalle con mensajes completos
- `GET /api/v1/conversations/:id/messages` — historial paginado
- `POST /api/v1/conversations/:id/reply` — agente humano responde (solo WA por ahora)
- `GET /api/v1/escalations` — conversaciones con status='escalated'
- `PATCH /api/v1/escalations/:id/resolve` — marcar escalación como resuelta

### Frontend (apps/web)
- `/conversations` — lista de conversaciones (tabs: WhatsApp / Voz / Todas)
- `/conversations/[id]` — hilo de mensajes tipo chat + input de respuesta manual
- `/calls` — lista de llamadas con estado, duración, transcript colapsable
- Badge de escalaciones en sidebar (número de escalaciones pendientes)
- KPIs en `/dashboard`: ratio promesa WA, ratio atención llamada

## Files to create/modify

### Backend
- `apps/service-notifications/src/conversations/conversations.controller.ts` — ampliar endpoints
- `apps/service-notifications/src/conversations/conversations.service.ts` — ampliar
- `apps/service-notifications/src/conversations/reply.dto.ts` — nuevo DTO

### Frontend
- `apps/web/app/(dashboard)/conversations/page.tsx`
- `apps/web/app/(dashboard)/conversations/[id]/page.tsx`
- `apps/web/app/(dashboard)/calls/page.tsx`
- `apps/web/components/conversations/ConversationThread.tsx`
- `apps/web/components/conversations/MessageBubble.tsx`
- `apps/web/components/conversations/ReplyInput.tsx`
- `apps/web/components/calls/CallCard.tsx`
- `apps/web/components/calls/TranscriptViewer.tsx`

## Success criteria
- [ ] Agente ve lista de conversaciones WhatsApp con último mensaje
- [ ] Agente abre conversación y ve hilo completo
- [ ] Agente escribe y envía respuesta manual por WhatsApp
- [ ] Conversaciones escaladas aparecen con badge en sidebar
- [ ] Agente puede marcar escalación como resuelta
- [ ] Lista de llamadas muestra estado, duración, transcript
- [ ] KPIs de WA y Voice en dashboard
