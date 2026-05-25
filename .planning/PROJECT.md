# CobraAI — Proyecto

## Descripción
Plataforma SaaS multi-tenant de cobranza y cuentas por cobrar para América Latina.
El core MVP (portafolios, auth Clerk, workflows, email/SMS, pagos) está **CONSTRUIDO**.

## Objetivo actual
Implementar los dos canales de IA que están como stubs:
1. **WhatsApp real** — Twilio WA Business API + agente LLM bidireccional
2. **Voz real** — Vapi.ai outbound call agent en español colombiano

## Stack
- Monorepo: Turborepo + pnpm
- Backend: NestJS 10 microservicios
- DB: PostgreSQL 16 + Prisma 5
- Bus: Kafka (kafkajs)
- Cache: Redis 7
- Auth: Clerk orgs (JWT gateway → X-Tenant-Id en microservicios)
- WhatsApp: Twilio WhatsApp Business API
- Voice: Vapi.ai (managed AI voice agent)
- LLM: OpenAI GPT-4o-mini
- Frontend: Next.js 14 + shadcn/ui

## Servicios relevantes
| Servicio | Puerto | Rol |
|---|---|---|
| api-gateway | 3000 | Proxy + auth Clerk |
| service-portfolios | 3011 | Portafolios y deudas |
| service-workflows | 3002 | Máquina de estados |
| service-notifications | 3003 | Orquestación canales — WhatsApp + Voice AQUÍ |
| service-payments | 3004 | Pagos |
| web | 3001 | Dashboard Next.js |

## Puertos ya definidos
- `packages/ports/src/whatsapp.port.ts` → `WhatsAppPort.sendTemplate()` + `isOptedIn()`
- `packages/ports/src/voice-agent.port.ts` → `VoiceAgentPort.initiateCall()` + `getCallStatus()`

## Stubs actuales a reemplazar
- `apps/service-notifications/src/adapters/whatsapp.adapter.ts` — publica Kafka, no envía nada real
- `apps/service-notifications/src/adapters/voice.adapter.ts` — publica Kafka, no llama a nadie

## Kafka events ya definidos
| Evento | Publicado por | Consumido por |
|---|---|---|
| `cobrai.contact.requested` | service-workflows | service-notifications |
| `cobrai.whatsapp.send_requested` | WA stub | (pendiente: worker real) |
| `cobrai.whatsapp.message_received` | (pendiente: webhook Twilio) | service-notifications |
| `cobrai.voice.call_requested` | Voice stub | (pendiente: worker real) |
| `cobrai.voice.call_completed` | (pendiente: webhook Vapi) | service-notifications |
| `cobrai.contact.completed` | service-notifications | service-workflows |

## Contexto regulatorio
Colombia (Ley 1266 / Habeas Data) — horario 6am-10pm, max 1 canal/semana.
packages/compliance ya implementa estas reglas.

## Métricas v1
- Costo por deudor gestionado vs equipo humano
- Tasa de promesa de pago por canal
- Tasa de atención de llamada
