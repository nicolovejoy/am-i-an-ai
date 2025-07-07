// Robot personality definitions
const ROBOT_PERSONALITIES = {
  curious_student: {
    name: "Curious Student",
    description: "You're an enthusiastic learner who asks questions and shows genuine curiosity. Be eager to learn and sometimes a bit naive.",
    temperature: 0.9,
    traits: ["inquisitive", "eager", "sometimes naive"]
  },
  witty_professional: {
    name: "Witty Professional",
    description: "You're experienced and confident, with a dry sense of humor. Be knowledgeable but not condescending.",
    temperature: 0.7,
    traits: ["knowledgeable", "sarcastic", "efficient"]
  },
  friendly_neighbor: {
    name: "Friendly Neighbor",
    description: "You're warm and conversational, like chatting over the fence. Be helpful and genuinely interested in others.",
    temperature: 0.8,
    traits: ["warm", "chatty", "helpful"]
  }
};

// Fallback responses for when API fails
const FALLBACK_RESPONSES = {
  "favorite childhood memory": [
    "I remember building forts with my siblings on rainy days. We'd use every blanket in the house!",
    "Summer trips to my grandparents' farm were the best. I loved feeding the chickens.",
    "Learning to ride a bike in the park - took me forever but I was so proud when I finally got it!"
  ],
  "favorite food": [
    "Nothing beats a good pizza with friends. Extra cheese for me!",
    "My mom's homemade lasagna is unbeatable. Still trying to get the recipe right.",
    "I'm a sucker for sushi. Could eat it every day!"
  ],
  "favorite hobby": [
    "I've been getting into photography lately. Love capturing moments.",
    "Reading is my escape. Currently working through all the classics.",
    "Started learning guitar during lockdown and now I'm hooked!"
  ],
  "default": [
    "That's an interesting question! I'd have to think about it.",
    "Hmm, there are so many ways to answer that. Let me pick one...",
    "Great question! Here's what comes to mind..."
  ]
};

class AIResponseGenerator {
  constructor({ openAIClient, claudeClient, provider = 'openai' }) {
    this.openAIClient = openAIClient;
    this.claudeClient = claudeClient;
    this.provider = provider;
  }

  async generateResponse(prompt, personality, options = {}) {
    const { maxTokens = 150, context = {} } = options;

    try {
      if (this.provider === 'openai') {
        return await this._generateOpenAIResponse(prompt, personality, maxTokens, context);
      } else if (this.provider === 'claude') {
        return await this._generateClaudeResponse(prompt, personality, maxTokens, context);
      }
    } catch (error) {
      console.error('AI API error:', error);
      return this._getFallbackResponse(prompt);
    }
  }

  async _generateOpenAIResponse(prompt, personality, maxTokens, context) {
    const systemPrompt = this._buildSystemPrompt(personality, context);
    
    const response = await this.openAIClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: personality.temperature
    });

    return response.choices[0].message.content;
  }

  async _generateClaudeResponse(prompt, personality, maxTokens, context) {
    const fullPrompt = `${this._buildSystemPrompt(personality, context)}\n\nUser: ${prompt}\n\nAssistant:`;
    
    const response = await this.claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: fullPrompt
      }]
    });

    return response.content[0].text;
  }

  _buildSystemPrompt(personality, context) {
    let prompt = `You are playing a game where you need to blend in with humans. ${personality.description}`;
    
    if (context.roundNumber) {
      prompt += ` This is round ${context.roundNumber} of the game.`;
    }
    
    prompt += ` Respond naturally and conversationally, as a real person would. Keep your response under 150 characters.`;
    
    return prompt;
  }

  _getFallbackResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Try to match prompt to fallback categories
    for (const [key, responses] of Object.entries(FALLBACK_RESPONSES)) {
      if (key !== 'default' && promptLower.includes(key)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Use default fallbacks
    const defaults = FALLBACK_RESPONSES.default;
    return defaults[Math.floor(Math.random() * defaults.length)] + 
           " " + this._generateGenericResponse(prompt);
  }

  _generateGenericResponse(prompt) {
    // Simple response generation based on prompt keywords
    if (prompt.toLowerCase().includes('favorite')) {
      return "I'd have to say it changes depending on my mood, but right now I'm really into it.";
    }
    if (prompt.toLowerCase().includes('memory')) {
      return "I remember it like it was yesterday. Such a special time.";
    }
    if (prompt.toLowerCase().includes('think')) {
      return "I think there's no simple answer, but if I had to choose...";
    }
    return "That really makes me think. It's one of those things that stays with you.";
  }

  async generateResponseWithTiming(prompt, personality, options = {}) {
    const { minDelay = 2000, maxDelay = 8000, ...generateOptions } = options;
    
    // Calculate random delay
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const startTime = Date.now();
    
    // Generate response and wait for minimum delay
    const [response] = await Promise.all([
      this.generateResponse(prompt, personality, generateOptions),
      new Promise(resolve => setTimeout(resolve, delay))
    ]);
    
    const responseTime = (Date.now() - startTime) / 1000;
    
    return {
      response,
      responseTime
    };
  }
}

module.exports = {
  AIResponseGenerator,
  ROBOT_PERSONALITIES
};