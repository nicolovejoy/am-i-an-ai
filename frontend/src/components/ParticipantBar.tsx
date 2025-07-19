import type { Identity } from '@shared/schemas';
import { useParticipants, useMyIdentity } from '@/store/server-state/match.queries';

export default function ParticipantBar() {
  const participants = useParticipants();
  const myIdentity = useMyIdentity();

  const getIdentityColor = (identity: Identity) => {
    const colors: Record<Identity, string> = {
      A: 'bg-blue-500',
      B: 'bg-green-500', 
      C: 'bg-purple-500',
      D: 'bg-orange-500'
    };
    return colors[identity];
  };

  // Create a full participant list showing all 4 slots
  const allSlots: Array<{ identity: Identity; isConnected: boolean; isMe: boolean }> = 
    (['A', 'B', 'C', 'D'] as Identity[]).map(identity => {
      const participant = participants.find(p => p.identity === identity);
      return {
        identity,
        isConnected: participant?.isConnected ?? false,
        isMe: identity === myIdentity
      };
    });

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Participants</h2>
          <div className="text-xs text-gray-500">
            {participants.filter(p => p.isConnected).length}/4 connected
          </div>
        </div>
        
        <div className="flex gap-3 mt-2">
          {allSlots.map(({ identity, isConnected, isMe }) => (
            <div
              key={identity}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border
                ${isConnected 
                  ? 'border-gray-200 bg-gray-50' 
                  : 'border-dashed border-gray-300 bg-gray-25'
                }
                ${isMe ? 'ring-2 ring-primary-200' : ''}
              `}
            >
              <div className={`
                w-3 h-3 rounded-full
                ${isConnected ? getIdentityColor(identity) : 'bg-gray-300'}
              `} />
              
              <span className={`
                text-sm font-medium
                ${isConnected ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {identity}
              </span>
              
              {isMe && (
                <span className="text-xs text-primary-600 font-medium">
                  (You)
                </span>
              )}
              
              {!isConnected && (
                <span className="text-xs text-gray-400">
                  Waiting...
                </span>
              )}
            </div>
          ))}
        </div>
        
        {participants.filter(p => p.isConnected).length < 4 && (
          <p className="text-xs text-gray-500 mt-2">
            Session will begin when all participants have joined
          </p>
        )}
      </div>
    </div>
  );
}