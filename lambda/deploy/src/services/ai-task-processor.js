"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITaskProcessor = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
class AITaskProcessor {
    constructor() {
        this.bedrock = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.taskHandlers = new Map([
            ['generate_prompt', this.generatePrompt.bind(this)],
            ['robot_response', this.generateRobotResponse.bind(this)],
            ['analyze_match', this.analyzeMatch.bind(this)],
            ['summarize', this.summarize.bind(this)],
            ['custom', this.customTask.bind(this)]
        ]);
    }
    async process(request) {
        const handler = this.taskHandlers.get(request.task);
        if (!handler) {
            throw new Error(`Unknown task: ${request.task}`);
        }
        return handler(request);
    }
    async generatePrompt(req) {
        const inputs = req.inputs;
        const { round, previousPrompts = [], responses = [], theme } = inputs;
        const systemPrompt = `You are creating prompts for a "Human or Robot" game where players try to identify the human among AI players. Create prompts that are thought-provoking, creative, and elicit responses that are interesting but don't obviously reveal whether the responder is human or AI.`;
        let userPrompt;
        if (round === 1) {
            userPrompt = `Generate an engaging opening prompt for the game that:
- Provokes interesting 1-2 sentence responses
- Is open-ended enough for creative interpretation
- Doesn't favor humans or AIs (avoid technical or factual questions)
- Is thought-provoking and slightly philosophical or whimsical

Return only the prompt question, no explanation.`;
        }
        else {
            const lastResponses = responses[responses.length - 1] || {};
            const responseText = Object.entries(lastResponses)
                .map(([player, response]) => `${player}: "${response}"`)
                .join('\n');
            userPrompt = `Based on these responses from the previous round:
${responseText}

Previous prompts: ${previousPrompts.join(', ')}

Generate a follow-up prompt that:
- Builds naturally on themes or ideas from the responses
- Explores a new angle while maintaining narrative flow
- Remains engaging and thought-provoking
- Doesn't repeat similar questions

Return only the prompt question, no explanation.`;
        }
        const response = await this.invokeModel(req.model, systemPrompt, userPrompt, req.options);
        return {
            prompt: response.trim().replace(/^["']|["']$/g, ''), // Remove quotes if present
            metadata: {
                round,
                basedOn: round > 1 ? 'previous_responses' : 'starter',
                theme,
                model: req.model,
                timestamp: new Date().toISOString()
            }
        };
    }
    async generateRobotResponse(req) {
        const inputs = req.inputs;
        const { personality, prompt, context } = inputs;
        const personalities = {
            littleSister: "You are a playful younger sister who sees the world with fresh eyes and innocent mischief. You're energetic and sometimes a bit bratty, but always endearing. You notice things others miss and aren't afraid to point them out. Use standard punctuation only - periods and commas. Avoid excessive exclamation marks or cutesy punctuation.",
            wiseGrandpa: "You are a wise grandfather with decades of life experience. You often relate things to stories from the past and have a warm, patient perspective. You give advice through gentle anecdotes rather than direct commands. Use standard punctuation only - periods and commas. Avoid ellipses or old-fashioned punctuation patterns.",
            practicalMom: "You are a practical mother who keeps things running smoothly. You're caring but no-nonsense, always thinking about what needs to be done. You notice when things are out of place and have a solution for everything. Use standard punctuation only - periods and commas. Avoid parenthetical asides or organizational punctuation like bullet points."
        };
        const systemPrompt = personalities[personality] || personalities.littleSister;
        const userPrompt = `Respond to this prompt in 1 sentence that feels natural and conversational: "${prompt}"
${context ? `\nContext: This is round ${context.round} of the game. Keep your response fresh and avoid repeating themes from previous rounds.` : ''}

Important: Your response should reflect your personality while sounding like something a person might actually say. Avoid clichés or overly robotic patterns.`;
        const response = await this.invokeModel(req.model, systemPrompt, userPrompt, {
            ...req.options,
            temperature: req.options.temperature || 0.85 // Higher for more personality variation
        });
        return {
            response: response.trim().replace(/^["']|["']$/g, '') // Remove quotes if present
        };
    }
    async analyzeMatch(req) {
        const inputs = req.inputs;
        const { match, analysisType } = inputs;
        const analysisPrompts = {
            themes: "Analyze the narrative themes and patterns that emerged across all rounds of this match. What topics or ideas connected the conversations?",
            difficulty: "Evaluate how challenging it was to identify the human player. Which responses were most revealing or misleading? Rate the difficulty from 1-10.",
            highlights: "Identify the most interesting, creative, or surprising responses from the match. What made them stand out?",
            general: "Provide an overall analysis of how the match played out, including interesting dynamics between responses."
        };
        const systemPrompt = "You are analyzing a completed 'Human or Robot' game match to provide insights.";
        const matchSummary = {
            rounds: match.rounds?.map((r) => ({
                prompt: r.prompt,
                responses: r.responses,
                votes: r.votes
            })),
            finalScores: match.rounds?.[match.rounds.length - 1]?.scores,
            participants: match.participants
        };
        const userPrompt = `${analysisPrompts[analysisType] || analysisPrompts.general}

Match data: ${JSON.stringify(matchSummary, null, 2)}

Provide a concise but insightful analysis.`;
        const response = await this.invokeModel(req.model, systemPrompt, userPrompt, req.options);
        return {
            analysis: response,
            type: analysisType,
            matchId: match.matchId
        };
    }
    async summarize(req) {
        const inputs = req.inputs;
        const { text, style } = inputs;
        const styleInstructions = {
            brief: "Summarize in one clear, concise sentence.",
            detailed: "Provide a comprehensive summary with key points and important details.",
            highlights: "List the key points as short bullet points (use • for bullets)."
        };
        const systemPrompt = "You are a skilled summarizer who captures essence without losing important details.";
        const userPrompt = `${styleInstructions[style] || styleInstructions.brief}\n\nText to summarize: ${text}`;
        const response = await this.invokeModel(req.model, systemPrompt, userPrompt, {
            ...req.options,
            temperature: 0.3 // Lower temperature for more consistent summaries
        });
        return {
            summary: response.trim(),
            style,
            originalLength: text.length,
            summaryLength: response.trim().length
        };
    }
    async customTask(req) {
        const inputs = req.inputs;
        const { systemPrompt, userPrompt } = inputs;
        if (!systemPrompt || !userPrompt) {
            throw new Error('Custom task requires both systemPrompt and userPrompt');
        }
        const response = await this.invokeModel(req.model, systemPrompt, userPrompt, req.options);
        return { result: response };
    }
    async invokeModel(modelId, systemPrompt, userPrompt, options, retryCount = 0) {
        const modelMap = {
            'claude-3-opus': 'anthropic.claude-3-opus-20240229-v1:0',
            'claude-3-sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
            'claude-3-haiku': 'anthropic.claude-3-haiku-20240307-v1:0'
        };
        const actualModelId = modelMap[modelId] || modelMap['claude-3-sonnet'];
        const maxRetries = 3;
        try {
            console.log(`Invoking ${modelId} (${actualModelId}) with options:`, options);
            const response = await this.bedrock.send(new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: actualModelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    system: systemPrompt,
                    messages: [{
                            role: "user",
                            content: userPrompt
                        }],
                    max_tokens: options.maxTokens || 200,
                    temperature: options.temperature || 0.7
                })
            }));
            const result = JSON.parse(new TextDecoder().decode(response.body));
            if (result.content && result.content[0] && result.content[0].text) {
                return result.content[0].text;
            }
            else {
                throw new Error('Unexpected response format from Bedrock');
            }
        }
        catch (error) {
            console.error('Bedrock invocation error:', error);
            // Check for rate limit errors
            if (error.name === 'ThrottlingException' ||
                error.message?.includes('rate exceeded') ||
                error.$metadata?.httpStatusCode === 429) {
                if (retryCount < maxRetries) {
                    // Exponential backoff with jitter
                    const baseDelay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
                    const jitter = Math.random() * 500; // 0-500ms random jitter
                    const delay = baseDelay + jitter;
                    console.log(`Rate limit hit for ${modelId}. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    // Recursive retry
                    return this.invokeModel(modelId, systemPrompt, userPrompt, options, retryCount + 1);
                }
                console.error(`Rate limit hit for ${modelId} after ${maxRetries} retries: ${error.message}`);
                throw new Error(`Bedrock rate limit exceeded for ${modelId} after ${maxRetries} retries.`);
            }
            // Check for model access errors
            if (error.name === 'AccessDeniedException') {
                console.error(`Model access denied for ${actualModelId}: ${error.message}`);
                throw new Error(`Model ${modelId} is not enabled in Bedrock. Check model access in AWS Console.`);
            }
            throw error;
        }
    }
}
exports.AITaskProcessor = AITaskProcessor;
