import { QueryClient } from '@tanstack/react-query';
import { Match, Round, RealtimeEvent, validateRealtimeEvent } from '@shared/schemas';
import { matchKeys } from '../server-state/match.queries';
import { useUIStore } from '../ui-state/ui.store';

export class MatchSyncEngine {
  private queryClient: QueryClient;
  private matchId: string;
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(queryClient: QueryClient, matchId: string) {
    this.queryClient = queryClient;
    this.matchId = matchId;
  }

  // Start listening for real-time updates (SSE or WebSocket)
  connect() {
    // For now, we'll use polling via React Query
    // In the future, this would establish SSE/WebSocket connection
    console.log(`Sync engine connected for match ${this.matchId}`);
    
    // Example SSE implementation (commented out for now):
    /*
    this.eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/matches/${this.matchId}/events`
    );
    
    this.eventSource.onmessage = (event) => {
      try {
        const realtimeEvent = validateRealtimeEvent(JSON.parse(event.data));
        this.handleRealtimeEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };
    
    this.eventSource.onerror = () => {
      this.handleConnectionError();
    };
    */
  }

  // Handle real-time events
  private handleRealtimeEvent(event: RealtimeEvent) {
    switch (event.type) {
      case 'match_state_sync':
        this.processMatchUpdate(event.match);
        break;
        
      case 'participant_submitted':
        this.handleParticipantSubmitted(event.identity, event.roundNumber);
        break;
        
      case 'round_transition':
        this.handleRoundTransition(event.fromRound, event.toRound, event.newPrompt);
        break;
        
      case 'reveal_identities':
        this.handleIdentityReveal(event.identities);
        break;
        
      default:
        console.log('Unhandled event type:', event);
    }
  }

  // Process match updates
  processMatchUpdate(newMatch: Match) {
    const oldMatch = this.queryClient.getQueryData<Match>(
      matchKeys.detail(this.matchId)
    );

    // Update the cache
    this.queryClient.setQueryData(matchKeys.detail(this.matchId), newMatch);

    // Handle round transitions
    if (oldMatch && oldMatch.currentRound !== newMatch.currentRound) {
      this.onRoundChange(oldMatch.currentRound, newMatch.currentRound);
    }

    // Handle match completion
    if (oldMatch?.status !== 'completed' && newMatch.status === 'completed') {
      this.onMatchComplete();
    }
  }

  // Handle round transitions
  private onRoundChange(oldRound: number, newRound: number) {
    console.log(`Round changed from ${oldRound} to ${newRound}`);
    
    // Reset UI state for new round
    const uiStore = useUIStore.getState();
    uiStore.resetUI();
    
    // Play sound if enabled
    if (uiStore.soundEnabled) {
      this.playSound('round-start');
    }
    
    // Prefetch assets for next round if not final
    if (newRound < 5) {
      this.prefetchRoundAssets(newRound + 1);
    }
  }

  // Handle participant submission
  private handleParticipantSubmitted(identity: string, roundNumber: number) {
    // Update local cache optimistically
    const match = this.queryClient.getQueryData<Match>(
      matchKeys.detail(this.matchId)
    );
    
    if (match) {
      const updatedMatch = {
        ...match,
        rounds: match.rounds.map(r => 
          r.roundNumber === roundNumber
            ? { ...r, responses: { ...r.responses, [identity]: '...' } }
            : r
        ),
      };
      
      this.queryClient.setQueryData(matchKeys.detail(this.matchId), updatedMatch);
    }
  }

  // Handle round transition
  private handleRoundTransition(fromRound: number, toRound: number, newPrompt: string) {
    console.log(`Transitioning from round ${fromRound} to ${toRound}`);
    
    // The full match update will follow, but we can prepare UI
    const uiStore = useUIStore.getState();
    uiStore.resetUI();
  }

  // Handle identity reveal
  private handleIdentityReveal(identities: Record<string, any>) {
    console.log('Identities revealed:', identities);
    
    // This would trigger the match completion UI
    if (useUIStore.getState().soundEnabled) {
      this.playSound('match-complete');
    }
  }

  // Handle match completion
  private onMatchComplete() {
    console.log('Match completed!');
    
    // Clean up
    this.disconnect();
    
    // Could navigate to results or show completion modal
  }

  // Prefetch assets for next round
  private prefetchRoundAssets(roundNumber: number) {
    // In the future, this could prefetch:
    // - AI responses for the next round
    // - Images or sounds
    // - Prompt-specific content
    console.log(`Prefetching assets for round ${roundNumber}`);
  }

  // Play sound effects
  private playSound(soundName: string) {
    // Implementation would play actual sounds
    console.log(`Playing sound: ${soundName}`);
  }

  // Handle connection errors
  private handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      // Could show error UI
    }
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
    console.log(`Sync engine disconnected for match ${this.matchId}`);
  }
}

// Factory function to create sync engine
export function createSyncEngine(queryClient: QueryClient, matchId: string): MatchSyncEngine {
  return new MatchSyncEngine(queryClient, matchId);
}