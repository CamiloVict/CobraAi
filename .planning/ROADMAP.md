# CobraAI — Roadmap: WhatsApp & Voice Agent

> **Estado del proyecto:** Core MVP construido. Stubs de WA y Voz activos.
> **Objetivo:** Reemplazar stubs con implementaciones reales + agente LLM conversacional.

---

## Phase 1 — WhatsApp Real (Twilio WA Business API)
**Objetivo:** Envíos reales por WhatsApp + recepción de mensajes inbound.
**Entrada:** `whatsapp.adapter.ts` es un stub que publica Kafka pero no envía nada.
**Salida:** Los deudores reciben el mensaje en WhatsApp real; sus respuestas llegan al sistema.

**Scope:**
- `TwilioWhatsAppAdapter` implementa `WhatsAppPort` con SDK `twilio`
- Envío de HSM templates por Twilio WA Sandbox → producción
- Webhook `POST /api/v1/webhooks/twilio-whatsapp` en service-notifications
- Inbound: guardar mensaje en `messages` (direction: 'in'), publicar `cobrai.whatsapp.message_received`
- Opt-out automático al recibir "STOP"
- Variables de entorno: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WA_FROM`
- Tests unitarios + integración

**Duración estimada:** 1 semana

---

## Phase 2 — Voice Agent Real (Vapi.ai)
**Objetivo:** Llamadas outbound reales con agente de IA en español colombiano.
**Entrada:** `voice.adapter.ts` es un stub que publica Kafka pero no llama a nadie.
**Salida:** El sistema hace llamadas reales; se guarda transcript y outcome.

**Scope:**
- `VapiVoiceAdapter` implementa `VoiceAgentPort` con HTTP client → Vapi REST API
- Configurar Vapi Agent: prompt en español CO, ElevenLabs Multilingual v2, end-call function
- Webhook `POST /api/v1/webhooks/vapi` en service-notifications
  - Eventos: `call-started`, `call-ended`, `transcript`
  - Al `call-ended`: actualizar contact record + publicar `cobrai.voice.call_completed`
- `cobrai.voice.call_completed` consumido por service-notifications → actualiza outcome en BD
- Variables de entorno: `VAPI_API_KEY`, `VAPI_AGENT_ID`
- Tests unitarios + integration webhook

**Duración estimada:** 1 semana

---

## Phase 3 — LLM Conversational Agent (WhatsApp bidireccional)
**Objetivo:** Responder automáticamente a mensajes de deudores por WhatsApp con LLM.
**Entrada:** `cobrai.whatsapp.message_received` evento llega al sistema pero nadie responde.
**Salida:** Agente GPT-4o-mini responde en WhatsApp, detecta intents y actualiza estado de deuda.

**Scope:**
- Kafka consumer en service-notifications que consume `cobrai.whatsapp.message_received`
- `ConversationAgentService`:
  - Carga contexto: deuda, historial de mensajes, StrategyContext
  - System prompt de cobranza (español colombiano, empático, legal-safe Ley 1266)
  - Llama OpenAI GPT-4o-mini con historial de conversación
  - Detecta intents: `promise_to_pay` / `dispute` / `plan_request` / `escalate_human` / `unrelated`
  - Genera respuesta y la envía por WhatsApp (via TwilioWhatsAppAdapter)
  - Actualiza `conversation.status` y publica evento según intent
- `AgentMemoryFact` para recordar datos cross-session (nombre preferido, contexto previo)
- Variables de entorno: `OPENAI_API_KEY`
- Límite de longitud de historial: últimos 20 mensajes
- Tests: unit del agent service, integration con OpenAI mockeado

**Duración estimada:** 1-2 semanas

---

## Phase 4 — Dashboard Conversaciones y Escalaciones
**Objetivo:** Visibilidad de conversaciones WA y transcripts de voz en el admin.
**Entrada:** Datos en BD pero sin UI.
**Salida:** Agentes humanos pueden ver, responder y gestionar escalaciones.

**Scope:**
- `/conversations` — lista de conversaciones activas por canal (WA / Voz / Email / SMS)
- `/conversations/[id]` — hilo completo de mensajes con input para respuesta manual humana
- `/calls` — lista de llamadas con estado, duración, transcript (collapsable)
- Bandeja de escalaciones (`escalate_human` intent → badge en sidebar)
- POST `/api/v1/conversations/:id/reply` — agente humano responde manualmente por WA
- KPIs en dashboard: ratio promesa de pago WA, ratio atención llamada, sentimiento promedio
- Tests: componentes React (RTL), E2E Playwright básico

**Duración estimada:** 1 semana

---

## Dependencias entre phases

```
Phase 1 (WA real) ──→ Phase 3 (LLM agent) ──→ Phase 4 (Dashboard)
Phase 2 (Voice real) ─────────────────────────→ Phase 4 (Dashboard)
```

Phase 1 y 2 pueden ejecutarse en paralelo.
Phase 3 requiere Phase 1 completa.
Phase 4 requiere Phase 1, 2 y 3 completas.

---

## Definition of Done (global)
- [ ] Deudor recibe mensaje real por WhatsApp
- [ ] Deudor responde → sistema detecta intent → agente responde automáticamente
- [ ] Sistema hace llamada outbound real → guarda transcript y outcome
- [ ] Admin ve todas las conversaciones y puede escalar a humano
- [ ] Compliance engine bloquea envíos fuera de horario
- [ ] Tests ≥ 80% cobertura en módulos nuevos
- [ ] Variables de entorno documentadas en `.env.example`
