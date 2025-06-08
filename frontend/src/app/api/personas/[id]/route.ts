import { NextRequest, NextResponse } from 'next/server';
import { PersonaRepository } from '@/repositories/PersonaRepository';
import type { PersonaUpdate } from '@/types/personas';

const personaRepo = new PersonaRepository();

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array since this is an API route that should be generated at runtime
  return [];
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const dbPersona = await personaRepo.findById(params.id);
    
    if (!dbPersona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Transform database persona to frontend format
    const persona = {
      id: dbPersona.id,
      name: dbPersona.name,
      type: dbPersona.type,
      ownerId: dbPersona.owner_id,
      description: dbPersona.description,
      personality: dbPersona.personality || {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
        creativity: 50,
        assertiveness: 50,
        empathy: 50
      },
      knowledge: dbPersona.knowledge || [],
      communicationStyle: dbPersona.communication_style,
      modelConfig: dbPersona.model_config,
      systemPrompt: dbPersona.system_prompt,
      responseTimeRange: dbPersona.response_time_range,
      typingSpeed: dbPersona.typing_speed,
      isPublic: dbPersona.is_public,
      allowedInteractions: dbPersona.allowed_interactions || ['casual_chat'],
      conversationCount: dbPersona.conversation_count || 0,
      totalMessages: dbPersona.total_messages || 0,
      averageRating: dbPersona.average_rating || 0,
      createdAt: dbPersona.created_at,
      updatedAt: dbPersona.updated_at
    };

    return NextResponse.json({ persona });

  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const data: PersonaUpdate = await request.json();

    // Check if persona exists
    const existingPersona = await personaRepo.findById(params.id);
    if (!existingPersona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Update persona using repository
    await personaRepo.update(params.id, {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.personality && { personality: data.personality }),
      ...(data.knowledge && { knowledge: data.knowledge }),
      ...(data.communicationStyle && { communication_style: data.communicationStyle }),
      ...(data.modelConfig && { model_config: data.modelConfig }),
      ...(data.systemPrompt !== undefined && { system_prompt: data.systemPrompt }),
      ...(data.isPublic !== undefined && { is_public: data.isPublic }),
      ...(data.allowedInteractions && { allowed_interactions: data.allowedInteractions })
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if persona exists
    const existingPersona = await personaRepo.findById(params.id);
    if (!existingPersona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Delete persona using repository
    await personaRepo.delete(params.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}