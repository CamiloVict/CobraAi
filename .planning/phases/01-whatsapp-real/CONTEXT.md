# Phase 1 — WhatsApp Real (Twilio WA Business API)

## Goal
Reemplazar el stub `WhatsAppAdapter` con una implementación real de Twilio WA Business API.
Los deudores deben recibir mensajes reales en WhatsApp y sus respuestas deben llegar al sistema.

## Pre-conditions
- `apps/service-notifications` funcionando con stubs
- `packages/ports/src/whatsapp.port.ts` define el contrato (no modificar)
- `packages/compliance` engine activo (ya verifica horario + opt-out)
- Twilio account con WA Sandbox o WABA aprobada

## Files to modify
- `apps/service-notifications/src/adapters/whatsapp.adapter.ts` — reemplazar implementación
- `apps/service-notifications/src/adapters/adapters.module.ts` — verificar binding
- `apps/service-notifications/src/webhooks/webhooks.controller.ts` — agregar endpoint Twilio WA
- `apps/service-notifications/src/webhooks/webhooks.service.ts` — handler para mensajes inbound
- `apps/service-notifications/.env.example` — agregar variables Twilio WA
- `apps/service-notifications/package.json` — agregar `twilio` si no está

## New files
- `apps/service-notifications/src/adapters/twilio-whatsapp.adapter.ts` — implementación real
- `apps/service-notifications/src/adapters/twilio-whatsapp.adapter.spec.ts` — unit tests
- `apps/service-notifications/src/webhooks/twilio-wa-webhook.handler.ts` — inbound handler
- `apps/service-notifications/src/webhooks/twilio-wa-webhook.handler.spec.ts`

## Environment variables needed
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WA_FROM=whatsapp:+14155238886   # sandbox o número real aprobado
TWILIO_WA_WEBHOOK_URL=https://tu-dominio.com/api/v1/webhooks/twilio-whatsapp
```

## Success criteria
- [ ] `TwilioWhatsAppAdapter.sendTemplate()` envía mensaje real vía API de Twilio
- [ ] Twilio llama al webhook cuando el deudor responde
- [ ] Mensaje inbound guardado en tabla `messages` (direction: 'in')
- [ ] Evento `cobrai.whatsapp.message_received` publicado en Kafka
- [ ] STOP automático: `contact_consents` actualizado
- [ ] Tests pasan con Twilio mockeado (no llama API real en CI)
- [ ] `.env.example` actualizado

## Architecture note
El `WhatsAppPort` define:
```ts
sendTemplate(input: SendWhatsAppTemplateInput): Promise<SendWhatsAppTemplateResult>
isOptedIn(phone: string, tenant_id: string): Promise<boolean>
```
Twilio WA usa Content Templates (SID) o mensajes de texto libre en sandbox.
Para sandbox: `template_id` se mapea a un mensaje predefinido de Twilio.
Para producción: usar `content_sid` de templates aprobados en WA Business.
