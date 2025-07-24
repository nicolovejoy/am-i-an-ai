import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
import { Match, Participant, Identity } from '../../shared/schemas/match.schema';
import { MatchTemplateService, MatchTemplateType } from './match-template-service';
import { UserService } from './user-service';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({});

export interface CreateMatchWithTemplateData {
  templateType: MatchTemplateType;
  creatorUserId: string;
  creatorName: string;
}

export interface JoinMatchData {
  inviteCode: string;
  userId: string;
  displayName: string;
}

export interface JoinMatchResult {
  success: boolean;
  match?: Match;
  error?: string;
}

export class MultiHumanMatchService {
  constructor(
    private matchesTableName: string,
    private userService: UserService
  ) {}

  async createMatchWithTemplate(data: CreateMatchWithTemplateData): Promise<Match> {
    const template = MatchTemplateService.getTemplate(data.templateType);
    if (!template) {
      throw new Error(`Invalid template type: ${data.templateType}`);
    }

    const matchId = uuidv4();
    const inviteCode = this.generateInviteCode();
    const timestamp = new Date().toISOString();

    // Create initial participant for creator
    const creatorParticipant: Participant = {
      identity: 'A', // Will be reassigned when match starts
      isAI: false,
      playerName: data.creatorName,
      isConnected: true,
      userId: data.creatorUserId,
      displayName: data.creatorName,
      isReady: true,
      joinedAt: timestamp
    };

    const match: Match = {
      matchId,
      status: template.requiredHumans > 1 ? 'waiting_for_players' : 'waiting',
      currentRound: 1,
      totalRounds: 5,
      totalParticipants: template.totalParticipants, // Add this field!
      participants: [creatorParticipant],
      rounds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      templateType: data.templateType,
      inviteCode,
      inviteUrl: `/join/${inviteCode}`,
      waitingFor: {
        humans: template.requiredHumans - 1,
        ai: template.requiredAI
      },
      responseTimeLimit: template.responseTimeLimit || 30, // Default 30 seconds
    };

    // If only 1 human required, start immediately
    if (template.requiredHumans === 1) {
      await this.startMatch(match);
    }

    await docClient.send(new PutCommand({
      TableName: this.matchesTableName,
      Item: {
        ...match,
        timestamp: 0  // Main match record has timestamp 0
      }
    }));

    return match;
  }

  async joinMatch(data: JoinMatchData): Promise<JoinMatchResult> {
    // Find match by invite code
    const match = await this.findMatchByInviteCode(data.inviteCode);
    if (!match) {
      return { success: false, error: 'Invalid invite code' };
    }

    if (match.status !== 'waiting_for_players') {
      return { success: false, error: 'Match already started' };
    }

    const template = MatchTemplateService.getTemplate(match.templateType!);
    if (!template) {
      return { success: false, error: 'Invalid match template' };
    }

    // Check if user already in match
    if (match.participants.some(p => p.userId === data.userId)) {
      return { success: false, error: 'Already in match' };
    }

    // Add new participant
    const newParticipant: Participant = {
      identity: 'B', // Will be reassigned when match starts
      isAI: false,
      playerName: data.displayName,
      isConnected: true,
      userId: data.userId,
      displayName: data.displayName,
      isReady: true,
      joinedAt: new Date().toISOString()
    };

    match.participants.push(newParticipant);
    match.waitingFor!.humans -= 1;

    // Check if all humans have joined
    const shouldStart = match.waitingFor!.humans === 0;
    
    if (shouldStart) {
      await this.startMatch(match);
    }

    // Update match in database
    const updateExpression = ['SET participants = :participants', '#status = :status', 'updatedAt = :updatedAt', 'rounds = :rounds'];
    const expressionAttributeValues: any = {
      ':participants': match.participants,
      ':status': match.status,
      ':updatedAt': new Date().toISOString(),
      ':rounds': match.rounds || []
    };

    // Only include waitingFor if it's defined
    if (match.waitingFor !== undefined) {
      updateExpression.push('waitingFor = :waitingFor');
      expressionAttributeValues[':waitingFor'] = match.waitingFor;
    }

    await docClient.send(new UpdateCommand({
      TableName: this.matchesTableName,
      Key: { 
        matchId: match.matchId,
        timestamp: 0  // Main match record has timestamp 0
      },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: expressionAttributeValues
    }));

    return { success: true, match };
  }

  async getMatch(matchId: string): Promise<Match | null> {
    const result = await docClient.send(new GetCommand({
      TableName: this.matchesTableName,
      Key: { 
        matchId,
        timestamp: 0  // Main match record has timestamp 0
      }
    }));

    if (result.Item) {
      // Remove the timestamp field before returning
      const { timestamp, ...match } = result.Item;
      return match as Match;
    }
    
    return null;
  }

  private async startMatch(match: Match): Promise<void> {
    const template = MatchTemplateService.getTemplate(match.templateType!);
    if (!template) return;

    // Add AI participants
    const aiUsers = await this.userService.getRandomAIUsers(template.requiredAI);
    for (const aiUser of aiUsers) {
      match.participants.push({
        identity: 'C', // Will be reassigned
        isAI: true,
        playerName: aiUser.displayName,
        isConnected: true,
        userId: aiUser.userId,
        displayName: aiUser.displayName,
        personality: aiUser.personality,
        isReady: true,
        joinedAt: new Date().toISOString()
      });
    }

    // Assign random identities based on total participants
    const totalParticipants = match.totalParticipants || match.participants.length;
    const identities: Identity[] = Array.from(
      { length: totalParticipants }, 
      (_, i) => String.fromCharCode(65 + i) as Identity
    );
    const shuffledIdentities = this.shuffle([...identities]);
    
    match.participants.forEach((participant, index) => {
      participant.identity = shuffledIdentities[index];
    });

    // Update match status
    match.status = 'waiting';
    match.waitingFor = undefined;

    // Create first round with AI-generated prompt
    const firstPrompt = await this.generateAIPrompt(1);
    match.rounds = [{
      roundNumber: 1,
      prompt: firstPrompt,
      responses: {},
      votes: {},
      scores: {},
      status: 'responding',
      presentationOrder: this.shuffle([...identities]),
      startTime: new Date().toISOString()
    }];
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private async generateAIPrompt(
    round: number,
    previousPrompts: string[] = [],
    previousResponses: Record<string, string>[] = []
  ): Promise<string> {
    try {
      console.log("Generating AI prompt for round", round);
      const payload = {
        httpMethod: "POST",
        path: "/ai/generate",
        body: JSON.stringify({
          task: "generate_prompt",
          model: "claude-3-haiku",
          inputs: {
            round,
            previousPrompts,
            responses: previousResponses,
          },
          options: {
            temperature: 0.9,
            maxTokens: 100,
          },
        }),
      };

      const command = new InvokeCommand({
        FunctionName: process.env.AI_SERVICE_FUNCTION_NAME || 'robot-orchestra-ai-service',
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      const responsePayload = JSON.parse(
        new TextDecoder().decode(response.Payload!)
      );
      
      if (responsePayload.statusCode === 200) {
        const body = JSON.parse(responsePayload.body);
        return body.result.prompt;
      } else {
        console.error("AI prompt generation failed:", responsePayload);
        // Fallback to default prompts
        return this.getDefaultPromptForRound(round);
      }
    } catch (error) {
      console.error("Error generating AI prompt:", error);
      return this.getDefaultPromptForRound(round);
    }
  }

  private getDefaultPromptForRound(roundNumber: number): string {
    const prompts = [
      "What's the most interesting thing that happened to you this week?",
      "If you could have dinner with any historical figure, who would it be and why?",
      "What's a skill you wish you had but don't?",
      "Describe your perfect weekend in just three sentences.",
      "What's the strangest dream you remember having?"
    ];
    return prompts[roundNumber - 1] || prompts[0];
  }

  private async findMatchByInviteCode(inviteCode: string): Promise<Match | null> {
    // Scan for matches with the given invite code
    // In production, this should use a GSI for better performance
    const result = await docClient.send(new ScanCommand({
      TableName: this.matchesTableName,
      FilterExpression: 'inviteCode = :inviteCode AND #ts = :timestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':inviteCode': inviteCode,
        ':timestamp': 0  // Main match records have timestamp 0
      }
    }));
    
    if (result.Items && result.Items.length > 0) {
      // Remove the timestamp field before returning
      const { timestamp, ...match } = result.Items[0];
      return match as Match;
    }
    
    return null;
  }
}

// Export functions for testing
export async function createMatchWithTemplate(data: CreateMatchWithTemplateData): Promise<Match> {
  const userService = new UserService(process.env.USERS_TABLE_NAME!);
  const service = new MultiHumanMatchService(process.env.MATCHES_TABLE_NAME!, userService);
  return service.createMatchWithTemplate(data);
}

export async function joinMatch(data: JoinMatchData): Promise<JoinMatchResult> {
  const userService = new UserService(process.env.USERS_TABLE_NAME!);
  const service = new MultiHumanMatchService(process.env.MATCHES_TABLE_NAME!, userService);
  return service.joinMatch(data);
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const userService = new UserService(process.env.USERS_TABLE_NAME!);
  const service = new MultiHumanMatchService(process.env.MATCHES_TABLE_NAME!, userService);
  return service.getMatch(matchId);
}

export async function createAndStartMatch(data: {
  templateType: MatchTemplateType;
  humanParticipants: Array<{ userId: string; displayName: string }>;
}): Promise<Match> {
  const userService = new UserService(process.env.USERS_TABLE_NAME!);
  const service = new MultiHumanMatchService(process.env.MATCHES_TABLE_NAME!, userService);
  
  // Create match with first human
  const match = await service.createMatchWithTemplate({
    templateType: data.templateType,
    creatorUserId: data.humanParticipants[0].userId,
    creatorName: data.humanParticipants[0].displayName
  });

  // Join remaining humans
  for (let i = 1; i < data.humanParticipants.length; i++) {
    await service.joinMatch({
      inviteCode: match.inviteCode!,
      userId: data.humanParticipants[i].userId,
      displayName: data.humanParticipants[i].displayName
    });
  }

  // Return updated match
  return (await service.getMatch(match.matchId))!;
}