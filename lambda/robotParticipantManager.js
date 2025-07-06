const { ROBOT_PERSONALITIES } = require('./aiResponseGenerator');

class RobotParticipantManager {
  constructor({ aiGenerator, broadcastFn }) {
    this.aiGenerator = aiGenerator;
    this.broadcastFn = broadcastFn;
  }

  createRobotParticipants(availableIdentities) {
    const personalities = Object.keys(ROBOT_PERSONALITIES);
    const robots = [];

    availableIdentities.forEach((identity, index) => {
      robots.push({
        identity,
        isHuman: false,
        connectionId: null, // Robots don't have WebSocket connections
        personality: personalities[index % personalities.length],
        score: 0
      });
    });

    return robots;
  }

  scheduleRobotResponses(match, prompt) {
    const robotParticipants = Object.values(match.participants)
      .filter(p => !p.isHuman);

    return robotParticipants.map((robot, index) => {
      // Vary timing for each robot
      const minDelay = 2000 + (index * 1000);
      const maxDelay = Math.min(8000, minDelay + 3000);

      return this._generateRobotResponse(
        match,
        robot,
        prompt,
        { minDelay, maxDelay }
      );
    });
  }

  async _generateRobotResponse(match, robot, prompt, timingOptions) {
    try {
      const personality = ROBOT_PERSONALITIES[robot.personality];
      const context = {
        roundNumber: match.currentRound,
        participantIdentity: robot.identity
      };

      const { response, responseTime } = await this.aiGenerator.generateResponseWithTiming(
        prompt,
        personality,
        { ...timingOptions, context }
      );

      // Store the response (in real implementation, this would go to DynamoDB)
      await this.storeRobotResponse(
        match.matchId,
        match.currentRound,
        robot.identity,
        response,
        responseTime
      );

      // Broadcast that this participant responded
      await this.broadcastFn(match, {
        action: 'participant_responded',
        identity: robot.identity,
        responseTime
      });

      return { identity: robot.identity, response, responseTime };
    } catch (error) {
      console.error(`Error generating response for robot ${robot.identity}:`, error);
      
      // Fallback response
      const fallbackResponse = "That's interesting! Let me think about that...";
      const responseTime = 3.0;

      await this.storeRobotResponse(
        match.matchId,
        match.currentRound,
        robot.identity,
        fallbackResponse,
        responseTime
      );

      await this.broadcastFn(match, {
        action: 'participant_responded',
        identity: robot.identity,
        responseTime
      });

      return { identity: robot.identity, response: fallbackResponse, responseTime };
    }
  }

  async generateRobotVotes(robotParticipants, responses, correctAnswer) {
    const votes = {};

    for (const [identity, personality] of Object.entries(robotParticipants)) {
      try {
        // Create a voting prompt for the AI
        const votingPrompt = this._createVotingPrompt(responses, identity);
        const personalityObj = ROBOT_PERSONALITIES[personality];

        const { response } = await this.aiGenerator.generateResponseWithTiming(
          votingPrompt,
          personalityObj,
          { minDelay: 1000, maxDelay: 2000, maxTokens: 10 }
        );

        // Extract the voted identity from response (should be A, B, C, or D)
        const votedIdentity = this._extractVoteFromResponse(response);
        votes[identity] = votedIdentity;
      } catch (error) {
        console.error(`Error generating vote for robot ${identity}:`, error);
        // Fallback: vote randomly but with slight bias toward correct answer
        votes[identity] = this._generateFallbackVote(responses, identity, correctAnswer);
      }
    }

    return votes;
  }

  _createVotingPrompt(responses, voterIdentity) {
    const otherResponses = Object.entries(responses)
      .filter(([id]) => id !== voterIdentity)
      .map(([id, response]) => `${id}: "${response}"`)
      .join('\n');

    return `In this game, one player is human and the others are AI. Based on these responses, which one do you think is the human? Just respond with a single letter (A, B, C, or D).\n\n${otherResponses}`;
  }

  _extractVoteFromResponse(response) {
    // Extract single letter from response
    const match = response.match(/[A-D]/);
    return match ? match[0] : 'A'; // Default to A if parsing fails
  }

  _generateFallbackVote(responses, voterIdentity, correctAnswer) {
    const choices = Object.keys(responses).filter(id => id !== voterIdentity);
    
    // 40% chance to vote correctly (robots shouldn't be too good)
    if (Math.random() < 0.4) {
      return correctAnswer;
    }
    
    // Otherwise vote randomly among other choices
    return choices[Math.floor(Math.random() * choices.length)];
  }

  async storeRobotResponse(matchId, roundNumber, identity, response, responseTime) {
    // In real implementation, this would store to DynamoDB
    // For now, just return the data structure
    return {
      matchId,
      roundNumber,
      identity,
      response,
      responseTime,
      isRobot: true,
      timestamp: Date.now()
    };
  }
}

module.exports = {
  RobotParticipantManager
};