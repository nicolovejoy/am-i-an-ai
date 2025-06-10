import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/aiService';
import { ConversationContext } from '@/shared/types/ai';
import { personaService, messageService, conversationService } from '@/repositories';

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
    const persona = await personaService.getPersonaById(personaId);
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
    const conversation = await conversationService.getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if persona is participant in conversation
    const isParticipant = conversation.participants.some(p => p.personaId === personaId);
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Persona is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get recent conversation history (last 20 messages)  
    const messages = await messageService.getConversationMessages(conversationId, 20);
    
    // Get all participants
    const participantPersonas = await Promise.all(
      conversation.participants.map(p => personaService.getPersonaById(p.personaId))
    );
    const validParticipants = participantPersonas.filter(p => p !== null) as any[];

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
    const newMessage = await messageService.createMessage({
      conversationId,
      authorPersonaId: personaId,
      content: aiResponse.content,
      replyToMessageId: triggerMessageId,
      type: 'text'
    });

    // Update conversation status to keep it active (optional)
    await conversationService.updateConversation(conversationId, {
      status: 'active',
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