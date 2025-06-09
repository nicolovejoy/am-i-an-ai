import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/repositories/ConversationRepository';
import { MessageRepository } from '@/repositories/MessageRepository';
import { ConversationCreate } from '@/types/conversations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, topic, description, goals, selectedPersonas, topicTags, createdBy } = body;

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

    if (selectedPersonas.length !== 2) {
      return NextResponse.json({ error: 'Exactly two personas must be selected' }, { status: 400 });
    }

    if (!createdBy?.trim()) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const conversationService = new ConversationService();
    const messageRepo = new MessageRepository();

    // Create the conversation using the service
    const conversationData: ConversationCreate = {
      title: title.trim(),
      topic: topic.trim(),
      description: description?.trim() || '',
      participantPersonaIds: [selectedPersonas[0], selectedPersonas[1]],
      constraints: {
        maxDuration: undefined,
        maxMessages: undefined,
        allowedTopics: topicTags || [],
        endConditions: []
      },
      goal: goals?.trim() || undefined
    };

    const conversation = await conversationService.createConversation(conversationData, createdBy.trim());

    // Create an initial system message to kick off the conversation
    const nextSequenceNumber = await messageRepo.getNextSequenceNumber(conversation.id);
    
    const initialMessageData = {
      conversation_id: conversation.id,
      author_persona_id: 'system', // System message
      content: `Conversation started: "${title}"\n\nTopic: ${topic}${goals ? `\n\nGoals: ${goals}` : ''}`,
      type: 'system' as const,
      sequence_number: nextSequenceNumber,
      is_edited: false,
      edited_at: undefined,
      original_content: undefined,
      reply_to_message_id: undefined,
      thread_id: undefined,
      metadata: {},
      moderation_status: 'approved' as const,
      moderation_flags: undefined,
      is_visible: true,
      is_archived: false,
      reactions: undefined,
      quality_rating: undefined
    };

    await messageRepo.create(initialMessageData);

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
    const conversationService = new ConversationService();

    // Get active conversations - in production this would be filtered by user
    const conversations = await conversationService.getUserConversations('demo-user');

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