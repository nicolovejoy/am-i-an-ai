"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.handler = void 0;
var uuid_1 = require("uuid");
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var client_sqs_1 = require("@aws-sdk/client-sqs");
// Initialize AWS clients
var dynamoClient = new client_dynamodb_1.DynamoDBClient({});
var docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
var sqsClient = new client_sqs_1.SQSClient({});
// Get environment variables
var TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';
var SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || '';
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
// Robot response generation moved to robot-worker Lambda
// This function now sends a message to SQS for async processing
function triggerRobotResponses(matchId, roundNumber, prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var robots, _i, robots_1, robotId, message, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('triggerRobotResponses called with:', { matchId: matchId, roundNumber: roundNumber, prompt: prompt });
                    console.log('SQS_QUEUE_URL:', SQS_QUEUE_URL);
                    if (!SQS_QUEUE_URL) {
                        console.error('SQS_QUEUE_URL is not set!');
                        return [2 /*return*/];
                    }
                    robots = ['B', 'C', 'D'];
                    _i = 0, robots_1 = robots;
                    _a.label = 1;
                case 1:
                    if (!(_i < robots_1.length)) return [3 /*break*/, 6];
                    robotId = robots_1[_i];
                    message = {
                        matchId: matchId,
                        roundNumber: roundNumber,
                        prompt: prompt,
                        robotId: robotId,
                        timestamp: new Date().toISOString(),
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sqsClient.send(new client_sqs_1.SendMessageCommand({
                            QueueUrl: SQS_QUEUE_URL,
                            MessageBody: JSON.stringify(message),
                        }))];
                case 3:
                    _a.sent();
                    console.log("Sent robot response request for ".concat(robotId));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Failed to send SQS message for robot ".concat(robotId, ":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
// Kafka removed for now - focusing on core match functionality
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var path, method, pathWithoutStage, error_2;
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
                error_2 = _a.sent();
                console.error('Error in match service:', error_2);
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
        var body, matchId, now, match, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
                        status: 'round_active', // Start as active since we have all participants
                        currentRound: 1, // Start at round 1
                        totalRounds: 5,
                        participants: [
                            {
                                identity: 'A',
                                isAI: false,
                                playerName: body.playerName,
                                isConnected: true,
                            },
                            {
                                identity: 'B',
                                isAI: true,
                                playerName: 'Robot B',
                                isConnected: true,
                            },
                            {
                                identity: 'C',
                                isAI: true,
                                playerName: 'Robot C',
                                isConnected: true,
                            },
                            {
                                identity: 'D',
                                isAI: true,
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
                                scores: {},
                                status: 'responding',
                            },
                        ],
                        createdAt: now,
                        updatedAt: now,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLE_NAME,
                            Item: __assign(__assign({}, match), { timestamp: 0 }),
                        }))];
                case 2:
                    _a.sent();
                    console.log('Match created in DynamoDB:', matchId, 'Status:', match.status);
                    // Trigger robot responses asynchronously
                    return [4 /*yield*/, triggerRobotResponses(matchId, 1, match.rounds[0].prompt)];
                case 3:
                    // Trigger robot responses asynchronously
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('Failed to create match in DynamoDB:', error_3);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to create match' }),
                        }];
                case 5: return [2 /*return*/, {
                        statusCode: 201,
                        headers: CORS_HEADERS,
                        body: JSON.stringify(match),
                    }];
            }
        });
    });
}
function getMatch(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, result, _a, timestamp, match, error_4;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pathMatch = event.path.match(/\/matches\/([^\/]+)$/);
                    matchId = pathMatch ? pathMatch[1] : (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.matchId;
                    if (!matchId) {
                        return [2 /*return*/, {
                                statusCode: 400,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'matchId is required' }),
                            }];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0, // Main match record has timestamp 0
                            },
                        }))];
                case 2:
                    result = _c.sent();
                    if (!result.Item) {
                        return [2 /*return*/, {
                                statusCode: 404,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'Match not found' }),
                            }];
                    }
                    _a = result.Item, timestamp = _a.timestamp, match = __rest(_a, ["timestamp"]);
                    return [2 /*return*/, {
                            statusCode: 200,
                            headers: CORS_HEADERS,
                            body: JSON.stringify(match),
                        }];
                case 3:
                    error_4 = _c.sent();
                    console.error('Failed to get match from DynamoDB:', error_4);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to retrieve match' }),
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function submitResponse(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, body, match, result, _a, timestamp, matchData, error_5, round, responseCount, error_6;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pathMatch = event.path.match(/\/matches\/([^\/]+)\/responses$/);
                    matchId = pathMatch ? pathMatch[1] : (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.matchId;
                    body = JSON.parse(event.body || '{}');
                    if (!matchId || !body.identity || !body.response || body.round === undefined) {
                        return [2 /*return*/, {
                                statusCode: 400,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'matchId, identity, response, and round are required' }),
                            }];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                        }))];
                case 2:
                    result = _c.sent();
                    if (!result.Item) {
                        return [2 /*return*/, {
                                statusCode: 404,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'Match not found' }),
                            }];
                    }
                    _a = result.Item, timestamp = _a.timestamp, matchData = __rest(_a, ["timestamp"]);
                    match = matchData;
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _c.sent();
                    console.error('Failed to get match from DynamoDB:', error_5);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to retrieve match' }),
                        }];
                case 4:
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
                    if (!(body.identity === 'A')) return [3 /*break*/, 6];
                    // Trigger robot responses asynchronously via SQS
                    return [4 /*yield*/, triggerRobotResponses(matchId, body.round, round.prompt)];
                case 5:
                    // Trigger robot responses asynchronously via SQS
                    _c.sent();
                    _c.label = 6;
                case 6:
                    responseCount = Object.keys(round.responses).length;
                    if (responseCount === 4 && round.status === 'responding') {
                        // Update round status to voting
                        round.status = 'voting';
                        console.log("All responses collected for match ".concat(matchId, " round ").concat(body.round, ", transitioning to voting"));
                    }
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                            UpdateExpression: 'SET rounds = :rounds, updatedAt = :updatedAt, #status = :status',
                            ExpressionAttributeNames: {
                                '#status': 'status',
                            },
                            ExpressionAttributeValues: {
                                ':rounds': match.rounds,
                                ':updatedAt': match.updatedAt,
                                ':status': match.status,
                            },
                        }))];
                case 8:
                    _c.sent();
                    console.log('Response submitted:', matchId, 'Round:', body.round, 'Identity:', body.identity);
                    return [2 /*return*/, {
                            statusCode: 200,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({
                                success: true,
                                match: match,
                            }),
                        }];
                case 9:
                    error_6 = _c.sent();
                    console.error('Failed to update match in DynamoDB:', error_6);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to update match' }),
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function submitVote(event) {
    return __awaiter(this, void 0, void 0, function () {
        var pathMatch, matchId, body, match, result, _a, timestamp, matchData, error_7, round, participants, bChoices, cChoices, dChoices, voteCount, newRound, error_8;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pathMatch = event.path.match(/\/matches\/([^\/]+)\/votes$/);
                    matchId = pathMatch ? pathMatch[1] : (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.matchId;
                    body = JSON.parse(event.body || '{}');
                    if (!matchId || !body.voter || !body.votedFor || body.round === undefined) {
                        return [2 /*return*/, {
                                statusCode: 400,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'matchId, voter, votedFor, and round are required' }),
                            }];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                        }))];
                case 2:
                    result = _c.sent();
                    if (!result.Item) {
                        return [2 /*return*/, {
                                statusCode: 404,
                                headers: CORS_HEADERS,
                                body: JSON.stringify({ error: 'Match not found' }),
                            }];
                    }
                    _a = result.Item, timestamp = _a.timestamp, matchData = __rest(_a, ["timestamp"]);
                    match = matchData;
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _c.sent();
                    console.error('Failed to get match from DynamoDB:', error_7);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to retrieve match' }),
                        }];
                case 4:
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
                    }
                    voteCount = Object.keys(round.votes).length;
                    if (voteCount === 4 && round.status === 'voting') {
                        round.status = 'complete';
                        console.log("All votes collected for match ".concat(matchId, " round ").concat(body.round));
                        // Move to next round or complete match
                        if (match.currentRound < match.totalRounds) {
                            match.currentRound++;
                            match.status = 'round_active';
                            match.rounds.push({
                                roundNumber: match.currentRound,
                                prompt: getRandomPrompt(),
                                responses: {},
                                votes: {},
                                scores: {},
                                status: 'responding',
                            });
                            console.log("Moving to round ".concat(match.currentRound, " for match ").concat(matchId));
                        }
                        else {
                            match.status = 'completed';
                            console.log("Match ".concat(matchId, " completed after round ").concat(match.currentRound));
                        }
                    }
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 9, , 10]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                            UpdateExpression: 'SET rounds = :rounds, updatedAt = :updatedAt, #status = :status, currentRound = :currentRound',
                            ExpressionAttributeNames: {
                                '#status': 'status',
                            },
                            ExpressionAttributeValues: {
                                ':rounds': match.rounds,
                                ':updatedAt': match.updatedAt,
                                ':status': match.status,
                                ':currentRound': match.currentRound,
                            },
                        }))];
                case 6:
                    _c.sent();
                    console.log('Vote submitted:', matchId, 'Voter:', body.voter, 'Voted for:', body.votedFor);
                    if (!(body.voter === 'A' && match.status === 'round_active' && match.currentRound > 1)) return [3 /*break*/, 8];
                    newRound = match.rounds[match.rounds.length - 1];
                    return [4 /*yield*/, triggerRobotResponses(matchId, newRound.roundNumber, newRound.prompt)];
                case 7:
                    _c.sent();
                    _c.label = 8;
                case 8: return [2 /*return*/, {
                        statusCode: 200,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({
                            success: true,
                            match: match,
                        }),
                    }];
                case 9:
                    error_8 = _c.sent();
                    console.error('Failed to update match in DynamoDB:', error_8);
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: CORS_HEADERS,
                            body: JSON.stringify({ error: 'Failed to update match' }),
                        }];
                case 10: return [2 /*return*/];
            }
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
