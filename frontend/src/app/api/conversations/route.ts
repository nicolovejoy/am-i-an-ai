import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { ConversationRepository } from '@/repositories/ConversationRepository';
import { MessageRepository } from '@/repositories/MessageRepository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, topic, description, goals, selectedPersonas, isPrivate, topicTags, createdBy } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!selectedPersonas || selectedPersonas.length === 0) {
      return NextResponse.json({ error: 'At least one persona must be selected' }, { status: 400 });
    }

    if (!createdBy?.trim()) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const conversationRepo = new ConversationRepository(db);
    const messageRepo = new MessageRepository(db);

    // Create the conversation
    const conversationData = {
      title: title.trim(),
      topic: topic.trim(),
      description: description?.trim() || '',
      goals: goals?.trim() || '',
      status: 'active' as const,
      isPrivate: Boolean(isPrivate),
      topicTags: Array.isArray(topicTags) ? topicTags : [],
      createdBy: createdBy.trim(),
      lastActivityAt: new Date()
    };

    const conversationId = await conversationRepo.create(conversationData);

    // Add participants to the conversation
    for (const personaId of selectedPersonas) {
      await conversationRepo.addParticipant(conversationId, personaId);
    }

    // Create an initial system message to kick off the conversation
    const initialMessageData = {
      conversationId,
      senderId: 'system',
      senderType: 'system' as const,
      content: `Conversation started: "${title}"\n\nTopic: ${topic}${goals ? `\n\nGoals: ${goals}` : ''}`,
      messageType: 'text' as const,
      timestamp: new Date()
    };

    await messageRepo.create(initialMessageData);

    // Fetch the complete conversation data to return
    const conversation = await conversationRepo.findById(conversationId);

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        participantCount: selectedPersonas.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDatabase();
    const conversationRepo = new ConversationRepository(db);

    const conversations = await conversationRepo.findAll();

    return NextResponse.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}