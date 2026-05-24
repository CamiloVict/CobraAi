import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import { parseMessagePayload } from "../common/utils/api.utils";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByDebtor(tenantId: string, debtorId: string) {
    const debtor = await this.prisma.debtor.findFirst({
      where: { id: debtorId, tenantId, deletedAt: null }
    });
    if (!debtor) {
      throw new NotFoundException("Deudor no encontrado");
    }

    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId, debtorId, deletedAt: null },
      include: {
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { lastMessageAt: "desc" }
    });

    const thread = conversations
      .flatMap((c) =>
        c.messages.map((m) => ({
          id: m.id,
          channel: m.channel,
          direction: m.direction,
          content: parseMessagePayload(m.content).text,
          status: m.status,
          sent_at: m.sentAt ?? m.createdAt,
          conversation_id: c.id
        }))
      )
      .sort(
        (a, b) =>
          new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );

    return {
      debtor_id: debtorId,
      debtor_name: debtor.name,
      messages: thread
    };
  }
}
