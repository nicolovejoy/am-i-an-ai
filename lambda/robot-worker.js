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
exports.handler = void 0;
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize AWS clients
var dynamoClient = new client_dynamodb_1.DynamoDBClient({});
var docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
// Get environment variables
var TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';
// Robot personalities for response generation
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
function generateRobotResponse(_prompt, robotId) {
    var personality = robotPersonalities[robotId];
    if (!personality) {
        return 'A mysterious essence beyond description';
    }
    // For MVP, just return a random response from the robot's style
    var responses = personality.responses;
    return responses[Math.floor(Math.random() * responses.length)];
}
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, record, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log('Robot Worker received event:', JSON.stringify(event, null, 2));
                _i = 0, _a = event.Records;
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 6];
                record = _a[_i];
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, processRobotResponse(record)];
            case 3:
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error('Failed to process robot response:', error_1);
                // Throw error to let SQS retry (with DLQ configured)
                throw error_1;
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
function processRobotResponse(record) {
    return __awaiter(this, void 0, void 0, function () {
        var message, matchId, roundNumber, prompt, robotId, result, match, roundIndex, response, updateExpression, updatedResult, updatedMatch, round, responseCount, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    message = JSON.parse(record.body);
                    matchId = message.matchId, roundNumber = message.roundNumber, prompt = message.prompt, robotId = message.robotId;
                    console.log("Processing robot ".concat(robotId, " response for match ").concat(matchId, ", round ").concat(roundNumber));
                    console.log('DynamoDB table:', TABLE_NAME);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                        }))];
                case 2:
                    result = _b.sent();
                    console.log('DynamoDB GetCommand result:', JSON.stringify(result, null, 2));
                    if (!result.Item) {
                        throw new Error("Match ".concat(matchId, " not found"));
                    }
                    match = result.Item;
                    console.log('Match found, current round:', match.currentRound, 'rounds length:', (_a = match.rounds) === null || _a === void 0 ? void 0 : _a.length);
                    roundIndex = match.rounds.findIndex(function (r) { return r.roundNumber === roundNumber; });
                    if (roundIndex === -1) {
                        throw new Error("Round ".concat(roundNumber, " not found in match ").concat(matchId));
                    }
                    response = generateRobotResponse(prompt, robotId);
                    // Add artificial delay to make async behavior visible (remove in production)
                    console.log("Simulating ".concat(robotId, " thinking for 2-5 seconds..."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000 + Math.random() * 3000); })];
                case 3:
                    _b.sent();
                    updateExpression = "SET rounds[".concat(roundIndex, "].responses.#robotId = :response, updatedAt = :updatedAt");
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                            UpdateExpression: updateExpression,
                            ExpressionAttributeNames: {
                                '#robotId': robotId,
                            },
                            ExpressionAttributeValues: {
                                ':response': response,
                                ':updatedAt': new Date().toISOString(),
                            },
                        }))];
                case 4:
                    _b.sent();
                    console.log("Robot ".concat(robotId, " response stored for match ").concat(matchId));
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                        }))];
                case 5:
                    updatedResult = _b.sent();
                    if (!updatedResult.Item) return [3 /*break*/, 7];
                    updatedMatch = updatedResult.Item;
                    round = updatedMatch.rounds[roundIndex];
                    responseCount = Object.keys(round.responses || {}).length;
                    if (!(responseCount === 4 && round.status === 'responding')) return [3 /*break*/, 7];
                    console.log("All responses collected for match ".concat(matchId, " round ").concat(roundNumber, ", updating status to voting"));
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                matchId: matchId,
                                timestamp: 0,
                            },
                            UpdateExpression: "SET rounds[".concat(roundIndex, "].#status = :votingStatus, updatedAt = :updatedAt"),
                            ExpressionAttributeNames: {
                                '#status': 'status',
                            },
                            ExpressionAttributeValues: {
                                ':votingStatus': 'voting',
                                ':updatedAt': new Date().toISOString(),
                            },
                        }))];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    console.log("Robot ".concat(robotId, " response added to match ").concat(matchId, ", round ").concat(roundNumber));
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _b.sent();
                    console.error('Error in processRobotResponse:', error_2);
                    throw error_2;
                case 9: return [2 /*return*/];
            }
        });
    });
}
