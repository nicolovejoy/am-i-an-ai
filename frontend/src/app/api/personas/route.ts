import { NextRequest, NextResponse } from 'next/server';
import { PersonaRepository } from '@/repositories/PersonaRepository';
import type { PersonaCreate } from '@/types/personas';

const personaRepo = new PersonaRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const isPublic = searchParams.get('public');

    let personas;

    if (owner) {
      // Get personas by owner
      personas = await personaRepo.findByOwner(owner);
    } else if (isPublic === 'true') {
      // Get public personas
      personas = await personaRepo.findPublic({
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
      });
    } else {
      // Get all personas (admin only)
      personas = await personaRepo.findPublic(); // Fallback to public for now
    }

    // Transform database personas to frontend format
    const transformedPersonas = personas.map(dbPersona => ({
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
    }));

    return NextResponse.json({ 
      personas: transformedPersonas,
      total: transformedPersonas.length 
    });

  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: PersonaCreate = await request.json();

    // Validate required fields
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Create persona using repository
    const persona = await personaRepo.create({
      name: data.name,
      type: data.type,
      owner_id: undefined, // TODO: Get from auth context
      description: data.description,
      personality: data.personality,
      knowledge: data.knowledge,
      communication_style: data.communicationStyle,
      model_config: data.modelConfig,
      system_prompt: data.systemPrompt,
      response_time_range: undefined, // Not in PersonaCreate interface
      typing_speed: undefined, // Not in PersonaCreate interface
      is_public: data.isPublic,
      allowed_interactions: data.allowedInteractions,
      conversation_count: 0,
      total_messages: 0,
      average_rating: 0
    });

    return NextResponse.json({ 
      success: true, 
      personaId: persona.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}