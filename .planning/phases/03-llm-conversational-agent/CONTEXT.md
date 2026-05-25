# Phase 3 — LLM Conversational Agent (WhatsApp bidireccional)

## Goal
Cuando un deudor responde por WhatsApp, el sistema genera una respuesta automática
usando GPT-4o-mini con contexto de la deuda e historial de conversación.
Detecta intents y actualiza el estado de la deuda.

## Pre-conditions
- Phase 1 completa: `cobrai.whatsapp.message_received` publicándose en Kafka
- `TwilioWhatsAppAdapter` funcionando para envío
- OpenAI API key disponible

## Architecture
```
Deudor responde WA
    ↓
Twilio → webhook → TwilioWaWebhookHandler
    ↓
Kafka: cobrai.whatsapp.message_received
    ↓
ConversationAgentConsumer (nuevo Kafka consumer)
    ↓
ConversationAgentService:
  1. Carga deuda + historial (últimos 20 mensajes)
  2. Llama GPT-4o-mini con system prompt
  3. Parsea response → intent + texto de respuesta
  4. Guarda mensaje outbound en BD
  5. Envía respuesta por WhatsApp (TwilioWhatsAppAdapter)
  6. Publica evento según intent
```

## New files
- `apps/service-notifications/src/agent/agent.module.ts`
- `apps/service-notifications/src/agent/conversation-agent.service.ts`
- `apps/service-notifications/src/agent/conversation-agent.consumer.ts`
- `apps/service-notifications/src/agent/conversation-agent.service.spec.ts`
- `apps/service-notifications/src/agent/prompts/cobrai-system.prompt.ts`

## Environment variables
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500
```

## Intent taxonomy
| Intent | Acción |
|---|---|
| `promise_to_pay` | Publicar `cobrai.debt.promise_registered`, actualizar debt.status → 'promised' |
| `dispute` | Publicar `cobrai.debt.disputed`, actualizar debt.status → 'disputed' |
| `plan_request` | Enviar link de pago + info de plan de pagos |
| `escalate_human` | Publicar `cobrai.escalation.requested`, cambiar conversation.status → 'escalated' |
| `payment_confirmed` | Publicar `cobrai.payment.self_reported` |
| `unrelated` | Responder brevemente, no actualizar estado |
| `opt_out` | Revocar consent, no responder |

## Success criteria
- [ ] Mensaje inbound → GPT responde → deudor recibe respuesta en WA
- [ ] Intent `promise_to_pay` → `debt.status` cambia a 'promised'
- [ ] Intent `escalate_human` → conversation marcada como 'escalated'
- [ ] Historial de conversación incluido en cada llamada a GPT
- [ ] Límite de tokens respetado (max 500 por respuesta)
- [ ] Tests con OpenAI mockeado
