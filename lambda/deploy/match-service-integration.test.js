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
var match_service_1 = require("./match-service");
describe('Match Service Integration Tests', function () {
    var matchId;
    var createEvent = function (method, path, body) { return ({
        httpMethod: method,
        path: path,
        headers: {},
        body: body ? JSON.stringify(body) : null,
        isBase64Encoded: false,
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: {},
        stageVariables: null,
        requestContext: {},
        resource: '',
    }); };
    describe('Match Creation', function () {
        it('should create a match with robots and initial prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, match, robots;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, match_service_1.handler)(createEvent('POST', '/matches', {
                            playerName: 'TestPlayer'
                        }))];
                    case 1:
                        response = _a.sent();
                        expect(response.statusCode).toBe(201);
                        match = JSON.parse(response.body);
                        console.log('Created match:', JSON.stringify(match, null, 2));
                        // Store matchId for subsequent tests
                        matchId = match.matchId;
                        // Verify match structure
                        expect(match.matchId).toBeDefined();
                        expect(match.status).toBe('active');
                        expect(match.currentRound).toBe(1);
                        expect(match.totalRounds).toBe(5);
                        // Verify participants
                        expect(match.participants).toHaveLength(4);
                        expect(match.participants[0]).toEqual({
                            identity: 'A',
                            isHuman: true,
                            playerName: 'TestPlayer',
                            isConnected: true
                        });
                        robots = match.participants.filter(function (p) { return !p.isHuman; });
                        expect(robots).toHaveLength(3);
                        expect(robots.map(function (r) { return r.identity; })).toEqual(['B', 'C', 'D']);
                        // Verify initial round
                        expect(match.rounds).toHaveLength(1);
                        expect(match.rounds[0].roundNumber).toBe(1);
                        expect(match.rounds[0].prompt).toBeDefined();
                        expect(match.rounds[0].prompt.length).toBeGreaterThan(10);
                        expect(match.rounds[0].status).toBe('active');
                        expect(match.rounds[0].responses).toEqual({});
                        expect(match.rounds[0].votes).toEqual({});
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject match creation without playerName', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, match_service_1.handler)(createEvent('POST', '/matches', {}))];
                    case 1:
                        response = _a.sent();
                        expect(response.statusCode).toBe(400);
                        error = JSON.parse(response.body);
                        expect(error.error).toBe('playerName is required');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('Response Submission', function () {
        it('should accept human response and generate robot responses', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result, round1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, match_service_1.handler)(createEvent('POST', "/matches/".concat(matchId, "/responses"), {
                            identity: 'A',
                            response: 'Like the echo of forgotten dreams',
                            round: 1
                        }))];
                    case 1:
                        response = _a.sent();
                        expect(response.statusCode).toBe(200);
                        result = JSON.parse(response.body);
                        console.log('Response result:', JSON.stringify(result, null, 2));
                        expect(result.success).toBe(true);
                        expect(result.match).toBeDefined();
                        round1 = result.match.rounds[0];
                        expect(round1.responses['A']).toBe('Like the echo of forgotten dreams');
                        expect(round1.responses['B']).toBeDefined();
                        expect(round1.responses['C']).toBeDefined();
                        expect(round1.responses['D']).toBeDefined();
                        // Verify round moved to voting
                        expect(round1.status).toBe('voting');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('Vote Submission', function () {
        it('should accept human vote and generate robot votes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result, round1, round2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, match_service_1.handler)(createEvent('POST', "/matches/".concat(matchId, "/votes"), {
                            voter: 'A',
                            votedFor: 'C',
                            round: 1
                        }))];
                    case 1:
                        response = _a.sent();
                        expect(response.statusCode).toBe(200);
                        result = JSON.parse(response.body);
                        console.log('Vote result:', JSON.stringify(result, null, 2));
                        expect(result.success).toBe(true);
                        expect(result.match).toBeDefined();
                        round1 = result.match.rounds[0];
                        expect(round1.votes['A']).toBe('C');
                        expect(round1.votes['B']).toBeDefined();
                        expect(round1.votes['C']).toBeDefined();
                        expect(round1.votes['D']).toBeDefined();
                        // Verify round completed and next round started
                        expect(round1.status).toBe('completed');
                        expect(result.match.currentRound).toBe(2);
                        expect(result.match.rounds).toHaveLength(2);
                        round2 = result.match.rounds[1];
                        expect(round2.roundNumber).toBe(2);
                        expect(round2.prompt).toBeDefined();
                        expect(round2.status).toBe('active');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('Match Retrieval', function () {
        it('should retrieve match by ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, match;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, match_service_1.handler)(createEvent('GET', "/matches/".concat(matchId), null))];
                    case 1:
                        response = _a.sent();
                        expect(response.statusCode).toBe(200);
                        match = JSON.parse(response.body);
                        expect(match.matchId).toBe(matchId);
                        expect(match.currentRound).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
