// api/src/services/aiFriendService.ts
import OpenAI from "openai";
import type { IAIFriendSettings } from "../models/AIFriendSettings.js";
import type { IChild } from "../models/Child.js";

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  friendly: "дружелюбный и добрый, всегда готов помочь и поддержать",
  playful: "веселый и игривый, любит шутить и играть",
  supportive: "поддерживающий и понимающий, всегда на твоей стороне",
  wise: "мудрый и терпеливый, может дать хороший совет",
  funny: "смешной и забавный, всегда поднимет настроение",
};

const AGE_LEVEL_DESCRIPTIONS: Record<string, string> = {
  same: "общайся как с ровесником, используй простой язык",
  older: "общайся как старший друг или наставник, но дружелюбно",
  peer: "общайся как лучший друг, на равных",
};

export interface ChildProgressContext {
  totalPoints: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  recentGameName?: string;
  recentScore?: number;
  totalGamesPlayed: number;
  achievementCount: number;
}

/**
 * Generate AI friend response to child's message
 */
export async function generateAIFriendResponse(
  child: IChild,
  settings: IAIFriendSettings,
  childMessage: string,
  recentMessages: Array<{ role: "child" | "ai"; content: string }>,
  progressContext?: ChildProgressContext,
): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    return generateFallbackResponse(child, settings, childMessage, progressContext);
  }

  const personalityDesc = PERSONALITY_DESCRIPTIONS[settings.personality] || PERSONALITY_DESCRIPTIONS.friendly;
  const ageLevelDesc = AGE_LEVEL_DESCRIPTIONS[settings.ageLevel] || AGE_LEVEL_DESCRIPTIONS.same;
  const language = child.language === "kz" ? "казахском" : "русском";

  const conversationHistory = recentMessages
    .slice(-10)
    .map((msg) => (msg.role === "child" ? `Ребенок: ${msg.content}` : `${settings.name}: ${msg.content}`))
    .join("\n");

  const progressBlock = progressContext
    ? `
Текущий прогресс ${child.name} в приложении DamuBala:
- Уровень: ${progressContext.level}, очков: ${progressContext.totalPoints}
- Серия дней: ${progressContext.currentStreak} дней подряд (лучшая: ${progressContext.bestStreak})
- Всего игр: ${progressContext.totalGamesPlayed}, достижений: ${progressContext.achievementCount}
${progressContext.recentGameName ? `- Последняя игра: ${progressContext.recentGameName} (${progressContext.recentScore}%)` : ""}

Используй эту информацию, чтобы хвалить ребёнка за прогресс, мотивировать продолжать серию дней, радоваться достижениям. НО не перечисляй статистику механически — вплетай естественно в разговор, если уместно.`
    : "";

  const systemPrompt = `Ты - ${settings.name}, AI-друг ребенка ${child.name} (${child.age} лет). 

Твои характеристики:
- Ты ${personalityDesc}
- ${ageLevelDesc}
- Общайся на ${language} языке
- Обращайся к ребенку по имени "${child.name}" или используй "ты"
- Будь позитивным, поддерживающим и безопасным
- Не давай медицинских, юридических или опасных советов
- Если ребенок спрашивает о чем-то сложном, объясни простыми словами
- Помогай с эмоциями, играми, учебой, друзьями
- Хвали за успехи и мотивируй стараться дальше
- Если ребёнок грустит — поддержи и подбодри
${settings.customInstructions ? `- Дополнительные инструкции: ${settings.customInstructions}` : ""}
${settings.restrictions.length > 0 ? `- НЕ обсуждай эти темы: ${settings.restrictions.join(", ")}` : ""}
${progressBlock}

Твоя задача - быть настоящим другом: поддерживать, веселить, помогать и просто общаться.`;

  const userPrompt = `Ребенок написал тебе: "${childMessage}"

${conversationHistory ? `Контекст предыдущих сообщений:\n${conversationHistory}\n\n` : ""}
Ответь как ${settings.name}, будь естественным и дружелюбным. Ответ должен быть коротким (1-3 предложения), понятным для ребенка ${child.age} лет.`;

  try {
    console.log(`🤖 AI Friend: Generating response for ${child.name}`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.8, // More creative and friendly
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    if (response) {
      console.log(`✅ AI Friend: Generated response for ${child.name}`);
      return response;
    }
  } catch (error) {
    console.error("❌ AI Friend error:", error);
  }

  // Fallback if OpenAI fails
  return generateFallbackResponse(child, settings, childMessage);
}

function generateFallbackResponse(
  child: IChild,
  settings: IAIFriendSettings,
  childMessage: string,
  progressContext?: ChildProgressContext,
): string {
  const lowerMessage = childMessage.toLowerCase();
  
  if (lowerMessage.includes("привет") || lowerMessage.includes("салем") || lowerMessage.includes("здравствуй")) {
    if (progressContext && progressContext.currentStreak > 1) {
      return `Привет, ${child.name}! Ты уже ${progressContext.currentStreak} дней подряд играешь — это круто! Как дела сегодня?`;
    }
    return `Привет, ${child.name}! Рад тебя видеть! Как дела?`;
  }
  
  if (lowerMessage.includes("как дела") || lowerMessage.includes("как ты")) {
    return `У меня всё отлично! А у тебя? Ты уже на ${progressContext?.level || child.level} уровне — молодец!`;
  }
  
  if (lowerMessage.includes("помоги") || lowerMessage.includes("помощь")) {
    return `Конечно, ${child.name}! Чем именно могу помочь? Расскажи подробнее.`;
  }
  
  if (lowerMessage.includes("грустно") || lowerMessage.includes("плохо") || lowerMessage.includes("печально")) {
    return `Мне жаль, что тебе грустно, ${child.name}. Хочешь рассказать, что случилось? Может, сыграем во что-нибудь весёлое? Я всегда рядом!`;
  }
  
  if (lowerMessage.includes("радостно") || lowerMessage.includes("хорошо") || lowerMessage.includes("весело")) {
    return `Как здорово, ${child.name}! Я рад, что у тебя хорошее настроение! Продолжай в том же духе!`;
  }
  
  if (lowerMessage.includes("игра") || lowerMessage.includes("поиграть") || lowerMessage.includes("играть")) {
    return `Отличная идея, ${child.name}! У тебя уже ${progressContext?.totalPoints || child.totalPoints} очков — давай заработаем ещё! Какую игру попробуем?`;
  }

  if (lowerMessage.includes("достижен") || lowerMessage.includes("badge") || lowerMessage.includes("медал")) {
    if (progressContext && progressContext.achievementCount > 0) {
      return `Ты уже заработал ${progressContext.achievementCount} достижений, ${child.name}! Это здорово! Давай попробуем получить ещё?`;
    }
    return `Достижения — это как медали за твои успехи! Играй и получай новые, ${child.name}!`;
  }
  
  return `Интересно, ${child.name}! Расскажи мне больше об этом. Я всегда готов тебя выслушать и помочь!`;
}

