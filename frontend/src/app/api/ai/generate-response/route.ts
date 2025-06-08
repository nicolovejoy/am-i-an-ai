import { NextRequest, NextResponse } from 'next/server';
import { aiService, ConversationContext } from '@/services/aiService';
import { PersonaRepository } from '@/repositories/PersonaRepository';
import { MessageRepository } from '@/repositories/MessageRepository';
import { ConversationRepository } from '@/repositories/ConversationRepository';

export interface GenerateResponseRequest {
  conversationId: string;
  personaId: string;
  triggerMessageId?: string; // Message that triggered this AI response
}

export interface GenerateResponseResponse {
  success: boolean;
  messageId?: string;
  content?: string;
  error?: string;
  estimatedDelay?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateResponseRequest = await request.json();
    const { conversationId, personaId, triggerMessageId } = body;

    if (!conversationId || !personaId) {
      return NextResponse.json(
        { success: false, error: 'conversationId and personaId are required' },
        { status: 400 }
      );
    }

    // Check if AI service is configured
    if (!aiService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured. Please check API keys.' },
        { status: 503 }
      );
    }

    // Get persona
    const persona = await PersonaRepository.getById(personaId);
    if (!persona) {
      return NextResponse.json(
        { success: false, error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Validate persona is AI-enabled
    if (persona.type === 'human_persona') {
      return NextResponse.json(
        { success: false, error: 'Cannot generate AI response for human persona' },
        { status: 400 }
      );
    }

    if (!persona.modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Persona does not have AI model configuration' },
        { status: 400 }
      );
    }

    // Get conversation and recent messages
    const conversation = await ConversationRepository.getById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if persona is participant in conversation
    if (!conversation.participants.includes(personaId)) {
      return NextResponse.json(
        { success: false, error: 'Persona is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get recent conversation history (last 20 messages)
    const messages = await MessageRepository.getByConversationId(conversationId, 20);
    
    // Get all participants
    const participantPersonas = await Promise.all(
      conversation.participants.map(id => PersonaRepository.getById(id))
    );
    const validParticipants = participantPersonas.filter(p => p !== null);

    // Build conversation context
    const context: ConversationContext = {
      conversationId,
      messages: messages.reverse(), // Ensure chronological order
      participants: validParticipants,
      currentTopic: conversation.topic,
    };

    // Generate AI response
    const aiResponse = await aiService.generateResponse(persona, context);

    // Calculate response delay for realistic timing
    const estimatedDelay = aiService.calculateResponseDelay(persona, aiResponse.content.length);

    // Create message in database
    const newMessage = await MessageRepository.create({
      conversationId,
      personaId,
      content: aiResponse.content,
      parentMessageId: triggerMessageId,
      metadata: {
        aiGenerated: true,
        model: aiResponse.model,
        usage: aiResponse.usage,
        generatedAt: new Date().toISOString(),
      }
    });

    // Update conversation's last message timestamp
    await ConversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      content: aiResponse.content,
      estimatedDelay,
    });

  } catch (error) {
    console.error('Error generating AI response:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check AI service status
export async function GET() {
  return NextResponse.json({
    configured: aiService.isConfigured(),
    availableModels: aiService.getAvailableModels(),
  });
}