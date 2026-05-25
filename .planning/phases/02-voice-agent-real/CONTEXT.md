# Phase 2 — Voice Agent Real (Vapi.ai)

## Goal
Reemplazar el stub `VoiceAdapter` con llamadas outbound reales usando Vapi.ai.
El agente habla en español colombiano y maneja conversaciones de cobranza.

## Pre-conditions
- Phase 1 no bloqueante (pueden correr en paralelo)
- `packages/ports/src/voice-agent.port.ts` define el contrato
- Cuenta Vapi.ai creada + agent configurado en su dashboard

## Vapi.ai overview
Vapi es un orchestrator de llamadas con IA:
- Tú configuras el "assistant" (prompt, voz, modelo LLM, end-call actions)
- Vapi llama a Twilio internamente para hacer la llamada
- Al terminar, Vapi llama tu webhook con transcript y outcome
- API REST simple: `POST /call` → `{ id, status }`

## Files to modify
- `apps/service-notifications/src/adapters/voice.adapter.ts` — reemplazar
- `apps/service-notifications/src/adapters/adapters.module.ts` — swap binding
- `apps/service-notifications/src/webhooks/webhooks.controller.ts` — endpoint Vapi
- `apps/service-notifications/.env.example` — agregar Vapi vars

## New files
- `apps/service-notifications/src/adapters/vapi-voice.adapter.ts`
- `apps/service-notifications/src/adapters/vapi-voice.adapter.spec.ts`
- `apps/service-notifications/src/webhooks/vapi-webhook.handler.ts`
- `apps/service-notifications/src/webhooks/vapi-webhook.handler.spec.ts`

## Environment variables
```
VAPI_API_KEY=vapi_xxxxxxxx
VAPI_AGENT_ID=agent_xxxxxxxx   # ID del assistant configurado en Vapi dashboard
VAPI_WEBHOOK_SECRET=           # opcional, para verificar firma del webhook
```

## Vapi Agent configuration (hacer en Vapi dashboard)
- **Model:** gpt-4o-mini
- **Voice:** ElevenLabs Multilingual v2, voz femenina neutral colombiana
- **Language:** es
- **First message:** "Hola, buenos días. Le llamo de parte de [empresa] para recordarle sobre su saldo pendiente de [monto]. ¿Puedo ayudarle?"
- **System prompt:** Ver Plan 02-01
- **End call function:** cuando el deudor promete pagar o termina la llamada

## Kafka events
| Evento | Cuando | Publisher |
|---|---|---|
| `cobrai.voice.call_requested` | stub publicaba esto (ya no necesario) | eliminado |
| `cobrai.voice.call_completed` | Vapi webhook llega | vapi-webhook.handler |
| `cobrai.contact.completed` | procesado outcome | service-notifications |

## Success criteria
- [ ] `VapiVoiceAdapter.initiateCall()` hace HTTP POST a Vapi y retorna call_id
- [ ] Vapi llama al número del deudor
- [ ] Al terminar: webhook recibe transcript + outcome
- [ ] Transcript guardado en `contacts` table (transcript_url o content inline)
- [ ] `cobrai.voice.call_completed` publicado en Kafka
- [ ] Tests unitarios con Vapi HTTP mockeado
