"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.handler = void 0;
var uuid_1 = require("uuid");
// In-memory store for MVP (will be replaced with DynamoDB later)
var matchStore = new Map();
// Sample prompts for the game
var PROMPTS = [
    'What sound does loneliness make?',
    'Describe the taste of nostalgia',
    'What color is hope?',
    'How does time smell?',
    'What texture is a memory?',
    'Describe the weight of silence',
    'What shape is love?',
    'How does change feel on your skin?',
    'What temperature is fear?',
    'Describe the rhythm of joy',
];
function getRandomPrompt() {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
// Simple robot response generator for MVP
function generateRobotResponse(prompt, robotId) {
    var robotPersonalities = {
        'B': {
            style: 'poetic',
            responses: [
                'Like whispers in the twilight, it dances on the edge of perception',
                'A symphony of shadows, playing in minor keys',
                'Crystalline fragments of yesterday, scattered across tomorrow',
                'It breathes in colors that have no names',
                'Soft as moth wings against the window of time',
            ],
        },
        'C': {
            style: 'analytical',
            responses: [
                'Approximately 42 decibels of introspective resonance',
                'The quantifiable essence measures 3.7 on the emotional scale',
                'Statistical analysis suggests a correlation with ambient frequencies',
                'Data indicates a wavelength between visible and invisible spectrums',
                'Empirically speaking, it registers as a null hypothesis of sensation',
            ],
        },
        'D': {
            style: 'whimsical',
            responses: [
                'Like a disco ball made of butterflies!',
                'It\'s the giggles of invisible unicorns, obviously',
                'Tastes like purple mixed with the sound of Tuesday',
                'Bouncy castle vibes but for your feelings',
                'Imagine a kazoo orchestra playing underwater ballet',
            ],
        },
    };
    var personality = robotPersonalities[robotId];
    if (!personality) {
        return 'A mysterious essence beyond description';
    }
    // For MVP, just return a random response from the robot's style
    var responses = personality.responses;
    return responses[Math.floor(Math.random() * responses.length)];
}
var CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
// Kafka removed for now - focusing on core match functionality
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var path, method, pathWithoutStage, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Match Service received event:', JSON.stringify(event, null, 2));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 10, , 11]);
                path = event.path;
                method = event.httpMethod;
                // Handle CORS preflight
                if (method === 'OPTIONS') {
                    return [2 /*return*/, {
                            statusCode: 200,
                            headers: CORS_HEADERS,
                            body: '',
                        }];
                }
                pathWithoutStage = path.replace(/^\/prod/, '');
                if (!(method === 'POST' && (pathWithoutStage === '/matches' || path === '/matches'))) return [3 /*break*/, 3];
                return [4 /*yield*/, createMatch(event)];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                if (!(method === 'GET' && pathWithoutStage.match(/^\/matches\/[^\/]+$/))) return [3 /*break*/, 5];
                return [4 /*yield*/, getMatch(event)];
            case 4: return [2 /*return*/, _a.sent()];
            case 5:
                if (!(method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/responses$/))) return [3 /*break*/, 7];
                return [4 /*yield*/, submitResponse(event)];
            case 6: return [2 /*return*/, _a.sent()];
            case 7:
                if (!(method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/votes$/))) return [3 /*break*/, 9];
                return [4 /*yield*/, submitVote(event)];
            case 8: return [2 /*return*/, _a.sent()];
            case 9: return [2 /*return*/, {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: 'Not found' }),
                }];
            case 10:
                error_1 = _a.sent();
                console.error('Error in match service:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Internal server error' }),
                    }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
function createMatch(event) {
    return __awaiter(this, void 0, void 0, function () {
        var body, matchId, now, match;
        return __generator(this, function (_a) {
            body = JSON.parse(event.body || '{}');
            if (!body.playerName) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'playerName is required' }),
                    }];
            }
            matchId = "match-".concat((0, uuid_1.v4)());
            now = new Date().toISOString();
            match = {
                matchId: matchId,
                status: 'active', // Start as active since we have all participants
                currentRound: 1, // Start at round 1
                totalRounds: 5,
                participants: [
                    {
                        identity: 'A',
                        isHuman: true,
                        playerName: body.playerName,
                        isConnected: true,
                    },
                    {
                        identity: 'B',
                        isHuman: false,
                        playerName: 'Robot B',
                        isConnected: true,
                    },
                    {
                        identity: 'C',
                        isHuman: false,
                        playerName: 'Robot C',
                        isConnected: true,
                    },
                    {
                        identity: 'D',
                        isHuman: false,
                        playerName: 'Robot D',
                        isConnected: true,
                    },
                ],
                rounds: [
                    {
                        roundNumber: 1,
                        prompt: getRandomPrompt(),
                        responses: {},
                        votes: {},
                        status: 'active',
                    },
                ],
                createdAt: now,
                updatedAt: now,
            };
            // Store match
            matchStore.set(matchId, match);
            // TODO: Add Kafka event publishing later
            console.log('Match created:', matchId, 'Status:', match.status);
            return [2 /*return*/, {
                    statusCode: 201,
                    headers: CORS_HEADERS,
                    body: JSON.stringify(match),
                }];
        });
    });
}
function getMatch(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, match;
        var _a;
        return __generator(this, function (_b) {
            pathMatch = event.path.match(/\/matches\/([^\/]+)$/);
            matchId = pathMatch ? pathMatch[1] : (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.matchId;
            if (!matchId) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'matchId is required' }),
                    }];
            }
            match = matchStore.get(matchId);
            if (!match) {
                return [2 /*return*/, {
                        statusCode: 404,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Match not found' }),
                    }];
            }
            return [2 /*return*/, {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify(match),
                }];
        });
    });
}
function submitResponse(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, body, match, round;
        var _a;
        return __generator(this, function (_b) {
            pathMatch = event.path.match(/\/matches\/([^\/]+)\/responses$/);
            matchId = pathMatch ? pathMatch[1] : (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.matchId;
            body = JSON.parse(event.body || '{}');
            if (!matchId || !body.identity || !body.response || body.round === undefined) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'matchId, identity, response, and round are required' }),
                    }];
            }
            match = matchStore.get(matchId);
            if (!match) {
                return [2 /*return*/, {
                        statusCode: 404,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Match not found' }),
                    }];
            }
            round = match.rounds.find(function (r) { return r.roundNumber === body.round; });
            if (!round) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Invalid round number' }),
                    }];
            }
            // Store the response
            round.responses[body.identity] = body.response;
            match.updatedAt = new Date().toISOString();
            // Generate robot responses if this is from the human
            if (body.identity === 'A') {
                // Simple robot responses for MVP
                round.responses['B'] = generateRobotResponse(round.prompt, 'B');
                round.responses['C'] = generateRobotResponse(round.prompt, 'C');
                round.responses['D'] = generateRobotResponse(round.prompt, 'D');
                // If all responses are in, move to voting phase
                if (Object.keys(round.responses).length === 4) {
                    round.status = 'voting';
                }
            }
            // TODO: Add Kafka event publishing later
            console.log('Response submitted:', matchId, 'Round:', body.round, 'Identity:', body.identity);
            return [2 /*return*/, {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        match: match,
                    }),
                }];
        });
    });
}
function submitVote(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, body, match, round, participants, bChoices, cChoices, dChoices;
        var _a;
        return __generator(this, function (_b) {
            pathMatch = event.path.match(/\/matches\/([^\/]+)\/votes$/);
            matchId = pathMatch ? pathMatch[1] : (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.matchId;
            body = JSON.parse(event.body || '{}');
            if (!matchId || !body.voter || !body.votedFor || body.round === undefined) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'matchId, voter, votedFor, and round are required' }),
                    }];
            }
            match = matchStore.get(matchId);
            if (!match) {
                return [2 /*return*/, {
                        statusCode: 404,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Match not found' }),
                    }];
            }
            round = match.rounds.find(function (r) { return r.roundNumber === body.round; });
            if (!round) {
                return [2 /*return*/, {
                        statusCode: 400,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ error: 'Invalid round number' }),
                    }];
            }
            // Store the vote
            round.votes[body.voter] = body.votedFor;
            match.updatedAt = new Date().toISOString();
            // Generate robot votes if this is from the human
            if (body.voter === 'A') {
                participants = ['A', 'B', 'C', 'D'];
                bChoices = participants.filter(function (p) { return p !== 'B'; });
                round.votes['B'] = bChoices[Math.floor(Math.random() * bChoices.length)];
                cChoices = participants.filter(function (p) { return p !== 'C'; });
                round.votes['C'] = cChoices[Math.floor(Math.random() * cChoices.length)];
                dChoices = participants.filter(function (p) { return p !== 'D'; });
                round.votes['D'] = dChoices[Math.floor(Math.random() * dChoices.length)];
                // If all votes are in, complete the round
                if (Object.keys(round.votes).length === 4) {
                    round.status = 'completed';
                    // Move to next round or complete match
                    if (match.currentRound < match.totalRounds) {
                        match.currentRound++;
                        match.rounds.push({
                            roundNumber: match.currentRound,
                            prompt: getRandomPrompt(),
                            responses: {},
                            votes: {},
                            status: 'active',
                        });
                    }
                    else {
                        match.status = 'completed';
                    }
                }
            }
            // TODO: Add Kafka event publishing later
            console.log('Vote submitted:', matchId, 'Voter:', body.voter, 'Voted for:', body.votedFor);
            return [2 /*return*/, {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        match: match,
                    }),
                }];
        });
    });
}
// Cleanup on Lambda shutdown - simplified without Kafka
var cleanup = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('Lambda cleanup completed');
        return [2 /*return*/];
    });
}); };
exports.cleanup = cleanup;
