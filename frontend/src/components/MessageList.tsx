import { useEffect, useRef, useMemo } from "react";
import { useMatch, useMyIdentity } from "@/store/server-state/match.queries";
import MessageBubble from "./ui/MessageBubble";
import type { Identity, Round } from "@shared/schemas";

interface Message {
  participantId: Identity;
  content: string;
  roundNumber: number;
  timestamp: number;
}

export default function MessageList() {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  const myIdentity = useMyIdentity();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract messages from all rounds
  const messages = useMemo<Message[]>(() => 
    match?.rounds?.flatMap((round: Round) => 
      Object.entries(round.responses || {}).map(([identity, content]) => ({
        participantId: identity as Identity,
        content: content as string,
        roundNumber: round.roundNumber,
        timestamp: Date.now(), // We don't have timestamps in the new structure
      }))
    ) || [], 
    [match?.rounds]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Ready for conversation
          </h3>
          <p className="text-slate-600 max-w-md">
            Topic: &quot;What&apos;s your favorite childhood memory?&quot;
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Submit one answer each round
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-2">
      <div className="flex flex-col space-y-1">
        {messages.map((message: Message, index: number) => (
          <MessageBubble
            key={`${message.roundNumber}-${message.participantId}-${index}`}
            sender={message.participantId === myIdentity ? "You" : message.participantId}
            timestamp={message.timestamp}
            isCurrentUser={message.participantId === myIdentity}
          >
            {message.content}
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}