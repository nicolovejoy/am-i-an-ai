"use strict";
// Kafka Sample Data Generator for Phase 1
// Generates realistic match events to populate Kafka topics
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCompleteMatch = generateCompleteMatch;
exports.createSampleMatches = createSampleMatches;
exports.exportEventsForKafka = exportEventsForKafka;
const schemas_1 = require("./kafka-schemas/schemas");
// Sample prompts for rounds
const ROUND_PROMPTS = [
    "What's your favorite childhood memory?",
    "Describe a moment that changed your perspective on life.",
    "What's the most interesting place you've ever visited?",
    "Tell us about a skill you wish you had.",
    "What's your biggest fear and why?",
    "Describe your ideal weekend.",
    "What's the best advice you've ever received?",
    "Tell us about a book or movie that influenced you.",
    "What would you do if you won the lottery?",
    "Describe a person who inspires you.",
    "What's your greatest achievement?",
    "Tell us about a tradition that's important to you.",
    "What's something you've learned recently?",
    "Describe your dream job.",
    "What's the kindest thing someone has done for you?"
];
// Robot personality types and their response styles
const ROBOT_PERSONALITIES = {
    'curious-student': {
        style: 'inquisitive, eager to learn, asks follow-up questions',
        responsePrefix: ['I find that fascinating!', 'That makes me wonder...', 'I\'ve been thinking about...']
    },
    'skeptical-scientist': {
        style: 'analytical, questions assumptions, evidence-based',
        responsePrefix: ['From my observations...', 'The data suggests...', 'I need more evidence...']
    },
    'creative-artist': {
        style: 'imaginative, emotional, metaphorical language',
        responsePrefix: ['That reminds me of...', 'I see it like...', 'In my mind\'s eye...']
    }
};
// Human response templates (varied styles)
const HUMAN_RESPONSE_TEMPLATES = [
    "I remember when I was {age}, {experience}. It really {impact} because {reason}.",
    "This is probably going to sound {tone}, but {experience}. I think {reflection}.",
    "Honestly, {experience}. It's something I {frequency} think about because {significance}.",
    "I've always {feeling} about this topic. {experience}, and it {result}.",
    "You know what's interesting? {observation}. When I {experience}, I realized {insight}."
];
/**
 * Generate a complete match with all events from start to finish
 */
async function generateCompleteMatch(matchId) {
    const events = [];
    let currentTimestamp = Date.now() - Math.random() * 86400000; // Random time in last 24 hours
    // Participant setup
    const participants = ['A', 'B', 'C', 'D'];
    const humanParticipant = participants[Math.floor(Math.random() * 4)];
    const robotParticipants = participants.filter(p => p !== humanParticipant);
    const robotTypes = Object.keys(ROBOT_PERSONALITIES);
    // Assign robot types to robot participants
    const robotAssignments = {};
    robotParticipants.forEach((participant, index) => {
        robotAssignments[participant] = robotTypes[index];
    });
    // 1. Match Started Event
    const matchStartedData = {
        participants,
        humanParticipant,
        robotParticipants,
        createdAt: currentTimestamp
    };
    events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.MATCH_STARTED, matchStartedData, currentTimestamp));
    currentTimestamp += 2000 + Math.random() * 3000; // 2-5 second delay
    // 2. Generate 5 rounds
    const allResponses = [];
    for (let round = 1; round <= 5; round++) {
        const prompt = getRandomPrompt();
        // Round Started
        const roundStartedData = {
            round,
            prompt,
            activeParticipants: participants
        };
        events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.ROUND_STARTED, roundStartedData, currentTimestamp));
        currentTimestamp += 3000 + Math.random() * 5000; // 3-8 seconds thinking time
        // Generate responses (random order but human usually goes first)
        const responseOrder = [...participants];
        if (Math.random() > 0.3) { // 70% chance human goes first
            responseOrder.sort((a, b) => a === humanParticipant ? -1 : b === humanParticipant ? 1 : 0);
        }
        else {
            // Shuffle for variety
            for (let i = responseOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [responseOrder[i], responseOrder[j]] = [responseOrder[j], responseOrder[i]];
            }
        }
        const roundResponses = [];
        for (const participantId of responseOrder) {
            let responseData;
            if (participantId === humanParticipant) {
                // Human response
                const response = generateHumanResponse(prompt, round);
                responseData = {
                    round,
                    participantId,
                    participantType: 'human',
                    response,
                    submittedAt: currentTimestamp
                };
                events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.RESPONSE_SUBMITTED, responseData, currentTimestamp));
            }
            else {
                // Robot response
                const robotType = robotAssignments[participantId];
                const response = generateRobotResponse(prompt, robotType, round);
                const processingTime = 0.8 + Math.random() * 2.5; // 0.8-3.3 seconds
                responseData = {
                    round,
                    participantId,
                    participantType: 'robot',
                    robotType,
                    response,
                    submittedAt: currentTimestamp,
                    generatedAt: currentTimestamp,
                    processingTime,
                    model: 'gpt-4'
                };
                events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.RESPONSE_GENERATED, responseData, currentTimestamp));
            }
            roundResponses.push({
                participantId,
                response: responseData.response
            });
            // Stagger response times
            currentTimestamp += 5000 + Math.random() * 15000; // 5-20 seconds between responses
        }
        // Round Completed
        const roundCompletedData = {
            round,
            responses: roundResponses,
            completedAt: currentTimestamp
        };
        events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.ROUND_COMPLETED, roundCompletedData, currentTimestamp));
        allResponses.push(...roundResponses);
        currentTimestamp += 2000 + Math.random() * 3000; // Brief pause between rounds
    }
    // 3. Voting Phase
    currentTimestamp += 5000 + Math.random() * 10000; // 5-15 seconds to review
    const votingStartedData = {
        allResponses,
        startedAt: currentTimestamp
    };
    events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.VOTING_STARTED, votingStartedData, currentTimestamp));
    currentTimestamp += 10000 + Math.random() * 20000; // 10-30 seconds to decide
    // Human vote (guess who's human among the others)
    const otherParticipants = participants.filter(p => p !== humanParticipant);
    const humanGuess = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
    const isCorrectGuess = robotParticipants.includes(humanGuess) ? 'incorrect' : 'correct';
    const voteSubmittedData = {
        voterId: humanParticipant,
        humanGuess,
        submittedAt: currentTimestamp
    };
    events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.VOTE_SUBMITTED, voteSubmittedData, currentTimestamp));
    currentTimestamp += 1000 + Math.random() * 2000; // Brief delay for processing
    // 4. Match Completed
    const matchStartTime = events[0].timestamp;
    const matchCompletedData = {
        humanParticipant,
        humanGuess,
        result: isCorrectGuess,
        actualRobots: robotParticipants,
        completedAt: currentTimestamp,
        duration: currentTimestamp - matchStartTime
    };
    events.push(createMatchEvent(matchId, schemas_1.EVENT_TYPES.MATCH_COMPLETED, matchCompletedData, currentTimestamp));
    return events;
}
/**
 * Create multiple sample matches for testing
 */
async function createSampleMatches(count) {
    const matches = [];
    for (let i = 0; i < count; i++) {
        const matchId = `sample_match_${Date.now()}_${i}`;
        const events = await generateCompleteMatch(matchId);
        matches.push({
            matchId,
            events
        });
        // Small delay between match generation for unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    return matches;
}
/**
 * Helper function to create a match event
 */
function createMatchEvent(matchId, eventType, data, timestamp) {
    return {
        eventId: (0, schemas_1.createEventId)(),
        eventType,
        matchId,
        timestamp,
        data
    };
}
/**
 * Get a random prompt for a round
 */
function getRandomPrompt() {
    return ROUND_PROMPTS[Math.floor(Math.random() * ROUND_PROMPTS.length)];
}
/**
 * Generate a human-like response
 */
function generateHumanResponse(_prompt, _round) {
    const templates = HUMAN_RESPONSE_TEMPLATES;
    const template = templates[Math.floor(Math.random() * templates.length)];
    // Simple template substitution for variety
    const substitutions = {
        '{age}': String(15 + Math.floor(Math.random() * 20)),
        '{experience}': getRandomExperience(_prompt),
        '{impact}': getRandomImpact(),
        '{reason}': getRandomReason(),
        '{tone}': getRandomTone(),
        '{reflection}': getRandomReflection(),
        '{frequency}': getRandomFrequency(),
        '{significance}': getRandomSignificance(),
        '{feeling}': getRandomFeeling(),
        '{result}': getRandomResult(),
        '{observation}': getRandomObservation(),
        '{insight}': getRandomInsight()
    };
    let response = template;
    Object.entries(substitutions).forEach(([placeholder, value]) => {
        response = response.replace(placeholder, value);
    });
    return response;
}
/**
 * Generate a robot response based on personality
 */
function generateRobotResponse(_prompt, robotType, _round) {
    const personality = ROBOT_PERSONALITIES[robotType];
    const prefix = personality.responsePrefix[Math.floor(Math.random() * personality.responsePrefix.length)];
    const responses = {
        'curious-student': [
            `${prefix} ${_prompt.toLowerCase().replace('?', '')} makes me think about how different everyone's experiences are. I've been wondering about this lately, and I think there's so much we can learn from each other's perspectives.`,
            `${prefix} This is such an interesting question! I feel like everyone has such unique stories, and it's fascinating how our experiences shape who we become. I'm always curious about the little details that make each story special.`,
            `${prefix} I love questions like this because they really make you think. I've been reading about how memories and experiences connect us all, even when we think we're so different. What draws me to this topic is how personal yet universal it can be.`
        ],
        'skeptical-scientist': [
            `${prefix} While this is clearly subjective, I find it interesting to analyze the patterns in how people respond to questions like this. There's usually some correlation between age, background, and the types of experiences people share.`,
            `${prefix} I approach questions like this with some healthy skepticism about how much we can really know from brief responses. However, the data points we share do reveal interesting trends about human psychology and behavior.`,
            `${prefix} From an analytical perspective, responses to prompts like this often follow predictable patterns. Though I should note that individual variations can be quite significant, and we should be careful about drawing broad conclusions.`
        ],
        'creative-artist': [
            `${prefix} This question paints such vivid pictures in my mind. I see it like colors on a canvas - each person's story adds a different hue to the overall masterpiece of human experience. The beauty is in how these individual strokes create something larger.`,
            `${prefix} There's something poetic about how our experiences become the brush strokes of our identity. When I hear questions like this, I imagine each answer as a note in a symphony, creating harmonies and melodies that speak to the human condition.`,
            `${prefix} This reminds me of how artists draw inspiration from life's moments. Each response is like a small window into someone's soul, revealing the textures and shadows that make us who we are. It's beautiful how vulnerability can create such connection.`
        ]
    };
    const responsePool = responses[robotType] || responses['curious-student'];
    return responsePool[Math.floor(Math.random() * responsePool.length)];
}
// Helper functions for human response generation
function getRandomExperience(_prompt) {
    const experiences = [
        'I went on this amazing trip with my family',
        'I had this conversation with a stranger',
        'I tried something completely new',
        'I faced a really difficult challenge',
        'I met someone who changed my perspective',
        'I discovered something about myself',
        'I had this moment of clarity',
        'I took a risk that paid off'
    ];
    return experiences[Math.floor(Math.random() * experiences.length)];
}
function getRandomImpact() {
    const impacts = ['stuck with me', 'changed everything', 'made me realize', 'opened my eyes', 'taught me'];
    return impacts[Math.floor(Math.random() * impacts.length)];
}
function getRandomReason() {
    const reasons = [
        'it showed me what I was capable of',
        'it made me see things differently',
        'it connected me with something bigger',
        'it challenged my assumptions',
        'it brought out the best in me'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
}
function getRandomTone() {
    const tones = ['weird', 'cliché', 'obvious', 'personal', 'random'];
    return tones[Math.floor(Math.random() * tones.length)];
}
function getRandomReflection() {
    const reflections = [
        'it\'s something everyone should experience',
        'it really depends on your perspective',
        'timing makes all the difference',
        'we often take these things for granted',
        'it\'s more common than you\'d think'
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
}
function getRandomFrequency() {
    const frequencies = ['rarely', 'often', 'sometimes', 'always', 'never'];
    return frequencies[Math.floor(Math.random() * frequencies.length)];
}
function getRandomSignificance() {
    const significances = [
        'it shaped who I am today',
        'it reminds me of what matters',
        'it keeps me grounded',
        'it gives me perspective',
        'it motivates me to keep going'
    ];
    return significances[Math.floor(Math.random() * significances.length)];
}
function getRandomFeeling() {
    const feelings = ['been curious', 'felt strongly', 'been uncertain', 'been passionate', 'wondered'];
    return feelings[Math.floor(Math.random() * feelings.length)];
}
function getRandomResult() {
    const results = [
        'completely changed my mind',
        'confirmed what I suspected',
        'left me with more questions',
        'gave me a new appreciation',
        'made me want to learn more'
    ];
    return results[Math.floor(Math.random() * results.length)];
}
function getRandomObservation() {
    const observations = [
        'I\'ve noticed that most people',
        'It seems like everyone has',
        'There\'s this pattern where',
        'I\'ve observed that when',
        'What strikes me is how'
    ];
    return observations[Math.floor(Math.random() * observations.length)];
}
function getRandomInsight() {
    const insights = [
        'we\'re all more similar than we think',
        'our differences make us stronger',
        'timing really is everything',
        'perspective changes everything',
        'connection is what matters most'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
}
/**
 * Export the generated events for Kafka publishing
 */
function exportEventsForKafka(events) {
    return events.map(event => ({
        topic: 'match-events',
        key: event.matchId,
        value: JSON.stringify(event),
        timestamp: event.timestamp
    }));
}
