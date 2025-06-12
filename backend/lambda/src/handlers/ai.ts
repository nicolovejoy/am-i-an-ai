import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import OpenAI from 'openai';
import { queryDatabase } from '../lib/database';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
// Simple interfaces for Lambda use
interface PersonaData {
  id: string;
  name: string;
  type: string;
  description: string;
  personality: any;
  knowledge: string[];
  communicationStyle: string;
  system_prompt?: string;
  model_config?: any;
}

interface MessageData {
  id: string;
  content: string;
  author_persona_id: string;
  timestamp: string;
  sequence_number: number;
}

export async function handleAI(
  event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  try {
    if (path === '/api/ai/generate-response' && method === 'POST') {
      return await generateResponse(event, corsHeaders);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'AI endpoint not found' }),
    };

  } catch (error) {
    console.error('AI handler error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'OpenAI API configuration error',
          message: 'OpenAI API key not configured',
        }),
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: String(error),
      }),
    };
  }
}

// Initialize OpenAI client (reused across Lambda invocations)
let openai: OpenAI | null = null;
let openaiApiKey: string | null = null;

async function getOpenAIApiKey(): Promise<string> {
  if (openaiApiKey) {
    return openaiApiKey;
  }

  // First check environment variable (for local/dev)
  if (process.env.OPENAI_API_KEY) {
    openaiApiKey = process.env.OPENAI_API_KEY;
    return openaiApiKey;
  }

  // Otherwise get from Secrets Manager
  const secretArn = process.env.OPENAI_SECRET_ARN;
  if (!secretArn) {
    throw new Error('OPENAI_SECRET_ARN environment variable is required');
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretArn });
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('OpenAI API key secret is empty');
    }
    
    const secret = JSON.parse(response.SecretString);
    openaiApiKey = secret.api_key;
    
    if (!openaiApiKey) {
      throw new Error('api_key not found in secret');
    }
    
    return openaiApiKey;
  } catch (error) {
    console.error('Error retrieving OpenAI API key:', error);
    throw new Error(`Failed to retrieve OpenAI API key: ${error}`);
  }
}

async function getOpenAI(): Promise<OpenAI> {
  if (!openai) {
    const apiKey = await getOpenAIApiKey();
    openai = new OpenAI({ apiKey });
  }
  return openai;
}


function createSystemPrompt(persona: PersonaData): string {
  const { personality, communicationStyle, knowledge, description } = persona;
  
  // Map personality traits to prompt characteristics
  const traits = [];
  if (personality.openness > 70) traits.push('curious and open to new ideas');
  if (personality.conscientiousness > 70) traits.push('organized and detail-oriented');
  if (personality.extraversion > 70) traits.push('outgoing and social');
  if (personality.agreeableness > 70) traits.push('cooperative and helpful');
  if (personality.neuroticism > 70) traits.push('emotionally expressive');
  if (personality.creativity > 70) traits.push('creative and imaginative');
  if (personality.assertiveness > 70) traits.push('confident and direct');
  if (personality.empathy > 70) traits.push('understanding and compassionate');
  
  const personalityString = traits.length > 0 ? traits.join(', ') : 'balanced';
  
  let basePrompt = `You are ${persona.name}, ${description}.\n\n`;
  basePrompt += `Your personality is ${personalityString}.\n`;
  basePrompt += `Your communication style is ${communicationStyle}.\n`;
  
  if (knowledge && knowledge.length > 0) {
    basePrompt += `You have expertise in: ${knowledge.join(', ')}.\n`;
  }
  
  basePrompt += '\nRespond naturally as this persona would, maintaining consistency with these traits throughout the conversation.';
  
  // Use custom system prompt if provided, otherwise use generated one
  return persona.system_prompt || basePrompt;
}

function formatConversationHistory(messages: MessageData[], currentPersonaId: string): string {
  return messages
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map(msg => {
      const isCurrentPersona = msg.author_persona_id === currentPersonaId;
      const prefix = isCurrentPersona ? 'You' : 'Other';
      return `${prefix}: ${msg.content}`;
    })
    .join('\n');
}

async function generateResponse(
  event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    const { conversationId, personaId } = body;

    // Basic validation
    if (!conversationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'conversationId is required' }),
      };
    }

    if (!personaId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'personaId is required' }),
      };
    }

    // Get persona data from database
    const personaResult = await queryDatabase(
      'SELECT * FROM personas WHERE id = $1',
      [personaId]
    );
    
    if (personaResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Persona not found' }),
      };
    }
    
    const persona: PersonaData = personaResult.rows[0];
    
    // Check if this is an AI persona
    if (persona.type === 'human_persona') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Cannot generate AI response for human persona' }),
      };
    }
    
    // Get conversation history
    const messagesResult = await queryDatabase(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sequence_number DESC LIMIT 10',
      [conversationId]
    );
    
    const messages: MessageData[] = messagesResult.rows;
    
    // Create system prompt based on persona
    const systemPrompt = createSystemPrompt(persona);
    
    // Format conversation history for context
    const conversationHistory = formatConversationHistory(messages, personaId);
    
    // Get model configuration from persona or use defaults
    const modelConfig = persona.model_config || {
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500
    };
    
    // Call OpenAI API
    const client = await getOpenAI();
    const startTime = Date.now();
    
    const completion = await client.chat.completions.create({
      model: modelConfig.modelName || 'gpt-4',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...(conversationHistory ? [{ role: 'user' as const, content: `Previous conversation:\n${conversationHistory}\n\nPlease respond as ${persona.name} would to continue this conversation naturally.` }] : []),
      ],
      temperature: modelConfig.temperature || 0.7,
      max_tokens: modelConfig.maxTokens || 500,
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
    });
    
    const processingTime = Date.now() - startTime;
    const aiContent = completion.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No response generated from OpenAI');
    }
    
    // Save the AI response to the database
    const { randomUUID } = await import('crypto');
    const messageId = randomUUID();
    
    // Get the next sequence number
    const sequenceQuery = `
      SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence
      FROM messages
      WHERE conversation_id = $1
    `;
    
    const sequenceResult = await queryDatabase(sequenceQuery, [conversationId]);
    const nextSequence = sequenceResult.rows[0].next_sequence;
    
    // Calculate metadata
    const wordCount = aiContent.trim().split(/\s+/).length;
    const characterCount = aiContent.length;
    const readingTime = Math.ceil(wordCount / 200);
    
    const metadata = {
      wordCount,
      characterCount,
      readingTime,
      complexity: 0.7,
      model: completion.model,
      temperature: modelConfig.temperature,
      tokensUsed: completion.usage?.total_tokens || 0,
      processingTime,
      finishReason: completion.choices[0]?.finish_reason,
      aiGenerated: true
    };
    
    // Insert message
    const insertMessageQuery = `
      INSERT INTO messages (
        id, conversation_id, author_persona_id, content, type,
        sequence_number, metadata, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const messageResult = await queryDatabase(insertMessageQuery, [
      messageId,
      conversationId,
      personaId,
      aiContent.trim(),
      'text',
      nextSequence,
      JSON.stringify(metadata)
    ]);
    
    // Update conversation statistics
    // Calculate actual message count based on visible, non-archived, approved messages
    const updateConversationQuery = `
      UPDATE conversations 
      SET message_count = (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = $2
          AND m.is_visible = true
          AND m.is_archived = false
          AND m.moderation_status = 'approved'
      ),
      total_characters = total_characters + $1
      WHERE id = $2
    `;
    
    await queryDatabase(updateConversationQuery, [characterCount, conversationId]);
    
    // Update participant last active
    const updateParticipantQuery = `
      UPDATE conversation_participants
      SET last_active_at = NOW()
      WHERE conversation_id = $1 AND persona_id = $2
    `;
    
    await queryDatabase(updateParticipantQuery, [conversationId, personaId]);
    
    const message = messageResult.rows[0];
    
    const response = {
      id: message.id,
      content: aiContent,
      personaId,
      conversationId,
      timestamp: message.timestamp,
      sequenceNumber: message.sequence_number,
      metadata: message.metadata
    };

    console.log('AI response generated and saved:', { messageId, personaId, conversationId, tokensUsed: metadata.tokensUsed });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: response,
      }),
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to generate AI response',
        message: String(error),
      }),
    };
  }
}