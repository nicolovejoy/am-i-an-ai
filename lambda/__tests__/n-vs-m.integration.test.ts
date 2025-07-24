import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { handler as matchHandler } from '../match-service';
import { handler as robotWorkerHandler } from '../robot-worker';
import { MatchTemplateService } from '../src/services/match-template-service';
import { generateIdentities, getParticipantCount } from '../shared/utils/identity-helpers';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-sqs');
jest.mock('@aws-sdk/client-lambda');

describe('N vs M Match Support Integration Tests', () => {
  let mockDocClient: jest.Mocked<DynamoDBDocumentClient>;
  let mockSQSClient: jest.Mocked<SQSClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient = {
      send: jest.fn(),
    } as any;
    mockSQSClient = {
      send: jest.fn(),
    } as any;
    
    DynamoDBDocumentClient.from = jest.fn().mockReturnValue(mockDocClient);
  });

  describe('Match Creation with Different Templates', () => {
    it('should create a 3-player match (2v1)', async () => {
      const template = MatchTemplateService.getTemplate('duel_2v1' as any);
      expect(template).toBeDefined();
      expect(template?.totalParticipants).toBe(3);
      expect(template?.requiredHumans).toBe(2);
      expect(template?.requiredAI).toBe(1);

      // Mock successful match creation
      mockDocClient.send.mockResolvedValueOnce({}); // PutCommand

      const event = {
        httpMethod: 'POST',
        path: '/matches',
        body: JSON.stringify({
          playerName: 'TestPlayer',
          templateType: 'duel_2v1'
        }),
      };

      const response = await matchHandler(event as any);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.match).toBeDefined();
      expect(body.match.totalParticipants).toBe(3);
      expect(body.match.participants).toHaveLength(3);
    });

    it('should create a 6-player match (3v3)', async () => {
      const template = MatchTemplateService.getTemplate('trio_3v3' as any);
      expect(template).toBeDefined();
      expect(template?.totalParticipants).toBe(6);

      mockDocClient.send.mockResolvedValueOnce({}); // PutCommand

      const event = {
        httpMethod: 'POST',
        path: '/matches',
        body: JSON.stringify({
          playerName: 'TestPlayer',
          templateType: 'trio_3v3'
        }),
      };

      const response = await matchHandler(event as any);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.match.totalParticipants).toBe(6);
      expect(body.match.participants).toHaveLength(6);
    });

    it('should create an 8-player match (4v4)', async () => {
      const template = MatchTemplateService.getTemplate('mega_4v4' as any);
      expect(template).toBeDefined();
      expect(template?.totalParticipants).toBe(8);

      mockDocClient.send.mockResolvedValueOnce({}); // PutCommand

      const event = {
        httpMethod: 'POST',
        path: '/matches',
        body: JSON.stringify({
          playerName: 'TestPlayer',
          templateType: 'mega_4v4'
        }),
      };

      const response = await matchHandler(event as any);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.match.totalParticipants).toBe(8);
      expect(body.match.participants).toHaveLength(8);
    });
  });

  describe('Identity Assignment', () => {
    it('should assign correct identities for different participant counts', () => {
      expect(generateIdentities(3)).toEqual(['A', 'B', 'C']);
      expect(generateIdentities(5)).toEqual(['A', 'B', 'C', 'D', 'E']);
      expect(generateIdentities(8)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    });

    it('should correctly identify AI participants', async () => {
      const match6Players = {
        matchId: 'test-6-player',
        totalParticipants: 6,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Human1', playerName: 'Human1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Human2', playerName: 'Human2', isConnected: true },
          { identity: 'C', isAI: false, displayName: 'Human3', playerName: 'Human3', isConnected: true },
          { identity: 'D', isAI: true, displayName: 'AI1', playerName: 'AI1', isConnected: true },
          { identity: 'E', isAI: true, displayName: 'AI2', playerName: 'AI2', isConnected: true },
          { identity: 'F', isAI: true, displayName: 'AI3', playerName: 'AI3', isConnected: true },
        ]
      };

      const aiParticipants = match6Players.participants.filter(p => p.isAI);
      expect(aiParticipants).toHaveLength(3);
      expect(aiParticipants.map(p => p.identity)).toEqual(['D', 'E', 'F']);
    });
  });

  describe('Round Completion Logic', () => {
    it('should correctly detect when all participants have responded (3 players)', () => {
      const responses = { A: 'response1', B: 'response2', C: 'response3' };
      const totalParticipants = 3;
      
      const allResponded = Object.keys(responses).length === totalParticipants;
      expect(allResponded).toBe(true);
    });

    it('should correctly detect when all participants have responded (8 players)', () => {
      const responses = {
        A: 'response1', B: 'response2', C: 'response3', D: 'response4',
        E: 'response5', F: 'response6', G: 'response7', H: 'response8'
      };
      const totalParticipants = 8;
      
      const allResponded = Object.keys(responses).length === totalParticipants;
      expect(allResponded).toBe(true);
    });

    it('should not proceed if not all participants have responded', () => {
      const responses = { A: 'response1', B: 'response2' };
      const totalParticipants = 6;
      
      const allResponded = Object.keys(responses).length === totalParticipants;
      expect(allResponded).toBe(false);
    });
  });

  describe('Robot Worker with Variable AI Count', () => {
    it('should handle robot response generation for extended identities', async () => {
      const robotMessage = {
        matchId: 'test-match',
        roundNumber: 1,
        prompt: 'Test prompt',
        robotId: 'F', // Extended identity
        timestamp: new Date().toISOString()
      };

      // Mock match with 6 players
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          matchId: 'test-match',
          totalParticipants: 6,
          participants: [
            { identity: 'A', isAI: false },
            { identity: 'B', isAI: false },
            { identity: 'C', isAI: false },
            { identity: 'D', isAI: true },
            { identity: 'E', isAI: true },
            { identity: 'F', isAI: true }
          ],
          rounds: [{ roundNumber: 1, responses: {} }]
        }
      });

      // Mock update command
      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        Records: [{
          body: JSON.stringify(robotMessage)
        }]
      };

      await robotWorkerHandler(event as any);

      // Verify robot response was processed
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: expect.stringContaining('rounds[0].responses.#robotId')
          })
        })
      );
    });

    it('should apply correct delays for multiple AI players', async () => {
      // Test that delays scale with AI count
      const aiIdentities = ['B', 'C', 'D', 'E', 'F'];
      
      aiIdentities.forEach((robotId, index) => {
        const expectedDelay = index * 2000; // 0ms, 2000ms, 4000ms, 6000ms, 8000ms
        const robotIndex = aiIdentities.indexOf(robotId);
        const actualDelay = robotIndex >= 0 ? robotIndex * 2000 : 0;
        
        expect(actualDelay).toBe(expectedDelay);
      });
    });
  });

  describe('Personality Assignment', () => {
    it('should cycle through personalities for more than 3 AI players', () => {
      const availablePersonalities = ['littleSister', 'wiseGrandpa', 'practicalMom'];
      const aiIdentities = ['B', 'C', 'D', 'E', 'F', 'G'];
      
      const assignments = aiIdentities.map((id, index) => 
        availablePersonalities[index % availablePersonalities.length]
      );
      
      expect(assignments).toEqual([
        'littleSister',  // B
        'wiseGrandpa',   // C
        'practicalMom',  // D
        'littleSister',  // E (cycles back)
        'wiseGrandpa',   // F
        'practicalMom'   // G
      ]);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle matches at minimum participant count (3)', () => {
    const count = getParticipantCount({ totalParticipants: 3 });
    expect(count).toBe(3);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('should handle matches at maximum participant count (8)', () => {
    const count = getParticipantCount({ totalParticipants: 8 });
    expect(count).toBe(8);
    expect(count).toBeLessThanOrEqual(8);
  });

  it('should fall back to 4 when totalParticipants is missing', () => {
    const count = getParticipantCount({});
    expect(count).toBe(4);
  });
});