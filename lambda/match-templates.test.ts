import { describe, it, expect, beforeEach } from '@jest/globals';
import { MatchTemplate, MatchTemplateType } from './src/services/match-template-service';

describe('Match Templates', () => {
  describe('Template Definitions', () => {
    it('should define 1v3 template (1 human, 3 AI)', () => {
      const template: MatchTemplate = {
        type: 'classic_1v3',
        name: 'Classic Match',
        description: 'One human tries to blend in with three AI players',
        requiredHumans: 1,
        requiredAI: 3,
        totalParticipants: 4,
        isPublic: true,
      };

      expect(template.requiredHumans + template.requiredAI).toBe(template.totalParticipants);
    });

    it('should define 2v2 template (2 humans, 2 AI)', () => {
      const template: MatchTemplate = {
        type: 'duo_2v2',
        name: 'Duo Match',
        description: 'Two humans compete alongside two AI players',
        requiredHumans: 2,
        requiredAI: 2,
        totalParticipants: 4,
        isPublic: true,
      };

      expect(template.requiredHumans).toBe(2);
      expect(template.requiredAI).toBe(2);
    });

    it('should define admin template (configurable)', () => {
      const template: MatchTemplate = {
        type: 'admin_custom',
        name: 'Admin Match',
        description: 'Custom match configuration for testing',
        requiredHumans: 1, // minimum
        requiredAI: 0,     // can be adjusted
        totalParticipants: 4,
        isPublic: false,
        isAdminOnly: true,
      };

      expect(template.isAdminOnly).toBe(true);
    });
  });

  describe('Match Creation with Templates', () => {
    it('should create a match in "waiting_for_players" state when waiting for players', async () => {
      const matchData = {
        templateType: 'duo_2v2' as MatchTemplateType,
        creatorUserId: 'user-123',
        creatorName: 'Alice',
      };

      const match = await createMatchWithTemplate(matchData);

      expect(match.status).toBe('waiting_for_players');
      expect(match.participants).toHaveLength(1); // Only creator joined
      expect(match.participants[0]).toEqual({
        userId: 'user-123',
        displayName: 'Alice',
        isReady: true,
        joinedAt: expect.any(String),
      });
      expect(match.templateType).toBe('duo_2v2');
      expect(match.waitingFor).toEqual({
        humans: 1, // Need 1 more human
        ai: 2,     // AI will be added when match starts
      });
    });

    it('should generate a shareable invite code', async () => {
      const match = await createMatchWithTemplate({
        templateType: 'duo_2v2',
        creatorUserId: 'user-123',
        creatorName: 'Alice',
      });

      expect(match.inviteCode).toMatch(/^[A-Z0-9]{6}$/); // 6-char code
      expect(match.inviteUrl).toContain(`/join/${match.inviteCode}`);
    });
  });

  describe('Joining Matches', () => {
    it('should allow human to join by invite code', async () => {
      // Create match
      const match = await createMatchWithTemplate({
        templateType: 'duo_2v2',
        creatorUserId: 'user-123',
        creatorName: 'Alice',
      });

      // Join match
      const joinResult = await joinMatch({
        inviteCode: match.inviteCode,
        userId: 'user-456',
        displayName: 'Bob',
      });

      expect(joinResult.success).toBe(true);
      expect(joinResult.match.participants).toHaveLength(2);
      expect(joinResult.match.waitingFor.humans).toBe(0);
      expect(joinResult.match.status).toBe('waiting_for_players'); // Still waiting to start
    });

    it('should start match automatically when all humans joined', async () => {
      const match = await createMatchWithTemplate({
        templateType: 'duo_2v2',
        creatorUserId: 'user-123',
        creatorName: 'Alice',
      });

      // Bob joins
      await joinMatch({
        inviteCode: match.inviteCode,
        userId: 'user-456',
        displayName: 'Bob',
      });

      // Check match started
      const updatedMatch = await getMatch(match.matchId);
      expect(updatedMatch.status).toBe('active');
      expect(updatedMatch.participants).toHaveLength(4); // 2 humans + 2 AI
      
      // Verify AI players were added
      const aiParticipants = updatedMatch.participants.filter(p => p.userId.startsWith('ai-'));
      expect(aiParticipants).toHaveLength(2);
    });

    it('should reject join when match is full', async () => {
      const match = await createMatchWithTemplate({
        templateType: 'classic_1v3',
        creatorUserId: 'user-123',
        creatorName: 'Alice',
      });

      // Match auto-starts for 1v3 (only needs 1 human)
      const joinResult = await joinMatch({
        inviteCode: match.inviteCode,
        userId: 'user-456',
        displayName: 'Bob',
      });

      expect(joinResult.success).toBe(false);
      expect(joinResult.error).toBe('Match already started');
    });
  });

  describe('Dynamic Participant Assignment', () => {
    it('should assign random identities (A,B,C,D) when match starts', async () => {
      const match = await createAndStartMatch({
        templateType: 'duo_2v2',
        humanParticipants: [
          { userId: 'user-123', displayName: 'Alice' },
          { userId: 'user-456', displayName: 'Bob' },
        ],
      });

      // Check all identities are assigned
      const identities = match.participants.map(p => p.identity);
      expect(identities.sort()).toEqual(['A', 'B', 'C', 'D']);

      // Verify humans got random identities (not always A and B)
      const humanIdentities = match.participants
        .filter(p => !p.userId.startsWith('ai-'))
        .map(p => p.identity);
      
      expect(humanIdentities).toHaveLength(2);
      expect(['A', 'B', 'C', 'D']).toEqual(expect.arrayContaining(humanIdentities));
    });

    it('should select diverse AI personalities for matches', async () => {
      const match = await createAndStartMatch({
        templateType: 'classic_1v3',
        humanParticipants: [
          { userId: 'user-123', displayName: 'Alice' },
        ],
      });

      const aiParticipants = match.participants.filter(p => p.userId.startsWith('ai-'));
      const aiPersonalities = aiParticipants.map(p => p.personality);
      
      // Should have 3 different AI personalities
      expect(new Set(aiPersonalities).size).toBe(3);
      expect(aiPersonalities).toEqual(
        expect.arrayContaining(['philosopher', 'scientist', 'comedian'])
      );
    });
  });
});

// Placeholder functions to make TypeScript happy
async function createMatchWithTemplate(data: any): Promise<any> {
  throw new Error('Not implemented');
}

async function joinMatch(data: any): Promise<any> {
  throw new Error('Not implemented');
}

async function getMatch(matchId: string): Promise<any> {
  throw new Error('Not implemented');
}

async function createAndStartMatch(data: any): Promise<any> {
  throw new Error('Not implemented');
}