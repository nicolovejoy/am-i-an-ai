export type MatchTemplateType = 'classic_1v3' | 'duo_2v2' | 'admin_custom';

export interface MatchTemplate {
  type: MatchTemplateType;
  name: string;
  description: string;
  requiredHumans: number;
  requiredAI: number;
  totalParticipants: number;
  isPublic: boolean;
  isAdminOnly?: boolean;
}

export class MatchTemplateService {
  // TODO: When adding templates with >4 participants (e.g., trio_3v3 with 6 players):
  // 1. Update IdentitySchema in match.schema.ts to include 'E', 'F', etc.
  // 2. Update frontend components to handle additional identities
  // 3. Ensure shuffle/assignment logic works with more players
  private static templates: Map<MatchTemplateType, MatchTemplate> = new Map([
    ['classic_1v3', {
      type: 'classic_1v3',
      name: 'Classic Match',
      description: 'One human tries to blend in with three AI players',
      requiredHumans: 1,
      requiredAI: 3,
      totalParticipants: 4,
      isPublic: true,
    }],
    ['duo_2v2', {
      type: 'duo_2v2',
      name: 'Duo Match',
      description: 'Two humans compete alongside two AI players',
      requiredHumans: 2,
      requiredAI: 2,
      totalParticipants: 4,
      isPublic: true,
    }],
    ['admin_custom', {
      type: 'admin_custom',
      name: 'Admin Match',
      description: 'Custom match configuration for testing',
      requiredHumans: 1,
      requiredAI: 0,
      totalParticipants: 4,
      isPublic: false,
      isAdminOnly: true,
    }],
  ]);

  static getTemplate(type: MatchTemplateType): MatchTemplate | undefined {
    return this.templates.get(type);
  }

  static getAllTemplates(): MatchTemplate[] {
    return Array.from(this.templates.values());
  }

  static getPublicTemplates(): MatchTemplate[] {
    return this.getAllTemplates().filter(t => t.isPublic);
  }
}