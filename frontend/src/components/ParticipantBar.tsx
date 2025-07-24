import type { Identity } from "@shared/schemas";
import {
  useParticipants,
  useMyIdentity,
  useMatch,
} from "@/store/server-state/match.queries";

export default function ParticipantBar() {
  const participants = useParticipants();
  const myIdentity = useMyIdentity();
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);

  const getIdentityColor = (identity: Identity) => {
    const colors: Record<Identity, string> = {
      A: "bg-blue-500",
      B: "bg-green-500",
      C: "bg-purple-500",
      D: "bg-orange-500",
      E: "bg-pink-500",
      F: "bg-yellow-500",
      G: "bg-indigo-500",
      H: "bg-red-500",
    };
    return colors[identity];
  };

  // Create a full participant list showing all necessary slots based on participants in the template (4 for MVP)
  const allSlots: Array<{
    identity: Identity;
    isConnected: boolean;
    isMe: boolean;
    displayName: string;
  }> = (() => {
    // Generate identities based on match total participants
    const totalParticipants = match?.totalParticipants || participants.length || 4;
    const identities = Array.from(
      { length: totalParticipants },
      (_, i) => String.fromCharCode(65 + i) as Identity
    );
    return identities;
  })().map((identity) => {
    const participant = participants.find((p) => p.identity === identity);
    return {
      identity,
      isConnected: participant?.isConnected ?? false,
      isMe: identity === myIdentity,
      displayName: participant?.displayName || "Empty Seat",
    };
  });

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Participants</h2>
          <div className="text-xs text-gray-500">
            {participants.filter((p) => p.isConnected).length}/{match?.totalParticipants || participants.length} connected
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          {allSlots.map(({ identity, isConnected, isMe, displayName }) => (
            <div
              key={identity}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border
                ${
                  isConnected
                    ? "border-gray-200 bg-gray-50"
                    : "border-dashed border-gray-300 bg-gray-25"
                }
                ${isMe ? "ring-2 ring-primary-200" : ""}
              `}
            >
              <div
                className={`
                w-3 h-3 rounded-full
                ${isConnected ? getIdentityColor(identity) : "bg-gray-300"}
              `}
              />

              <span
                className={`
                text-sm font-medium
                ${isConnected ? "text-gray-900" : "text-gray-400"}
              `}
              >
                {displayName}
              </span>

              {isMe && (
                <span className="text-xs text-primary-600 font-medium">
                  (You)
                </span>
              )}

              {!isConnected && (
                <span className="text-xs text-gray-400">Waiting...</span>
              )}
            </div>
          ))}
        </div>

        {participants.filter((p) => p.isConnected).length < (match?.totalParticipants || 4) && (
          <p className="text-xs text-gray-500 mt-2">
            Session will begin when all participants have joined
          </p>
        )}
      </div>
    </div>
  );
}
