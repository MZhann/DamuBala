// api/src/services/aiRecommendationService.ts
import OpenAI from "openai";
import type { GameKey } from "../models/GameSession.js";
import type { EmotionType } from "../models/EmotionRecord.js";

// Lazy initialization of OpenAI client (only when needed and if API key is available)
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

interface ChildProfile {
  name: string;
  age: number;
  level: number;
  totalPoints: number;
  language: "kz" | "ru";
}

interface GameSessionData {
  gameKey: GameKey;
  score: number;
  maxScore: number;
  accuracy: number;
  duration: number;
  difficulty: string;
  completedAt: Date;
}

interface EmotionData {
  emotion: EmotionType;
  intensity: number;
  context?: string;
  timestamp: Date;
}

interface Recommendation {
  type: "skill" | "emotional" | "engagement" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionableSteps?: string[];
}

const GAME_NAMES: Record<GameKey, string> = {
  "memory-match": "Игра на память",
  "pattern-sequence": "Узоры и последовательности",
  "math-adventure": "Математика",
  "word-builder": "Слова и буквы",
  "emotion-cards": "Эмоции",
  "puzzle-solve": "Головоломки",
  "fruit-ninja-nose": "Фруктовый Ниндзя (компьютерное зрение)",
  "pose-match": "Повтори Позу (компьютерное зрение)",
};

const EMOTION_NAMES: Record<EmotionType, string> = {
  happy: "радость",
  sad: "грусть",
  angry: "злость",
  surprised: "удивление",
  fearful: "страх",
  disgusted: "отвращение",
  neutral: "нейтрально",
};

/**
 * Generate AI-powered recommendations for a child based on their performance
 */
export async function generateRecommendations(
  child: ChildProfile,
  gameSessions: GameSessionData[],
  emotions: EmotionData[],
  achievements: string[],
): Promise<Recommendation[]> {
  // If no data, return a simple engagement recommendation
  if (gameSessions.length === 0) {
    return [
      {
        type: "engagement",
        priority: "high",
        title: "Привет! Давай начнем играть!",
        description: `${child.name}, я рад тебя видеть! Давай попробуем поиграть в простые игры на память или математику - это будет весело и интересно!`,
        actionableSteps: [
          "Выбери игру на легком уровне",
          "Не бойся - я буду помогать тебе",
          "Каждое твое достижение - это победа!",
        ],
      },
    ];
  }

  // Prepare data summary for AI
  const gameStats = new Map<GameKey, { count: number; avgAccuracy: number; avgScore: number }>();
  for (const session of gameSessions) {
    const existing = gameStats.get(session.gameKey) || { count: 0, avgAccuracy: 0, avgScore: 0 };
    existing.count += 1;
    existing.avgAccuracy = (existing.avgAccuracy * (existing.count - 1) + session.accuracy) / existing.count;
    existing.avgScore = (existing.avgScore * (existing.count - 1) + session.score) / existing.count;
    gameStats.set(session.gameKey, existing);
  }

  const emotionCounts = new Map<EmotionType, number>();
  for (const emotion of emotions) {
    emotionCounts.set(emotion.emotion, (emotionCounts.get(emotion.emotion) || 0) + 1);
  }

  const totalGames = gameSessions.length;
  const totalTime = gameSessions.reduce((sum, s) => sum + s.duration, 0);
  const avgAccuracy = gameSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalGames;

  // Build prompt for OpenAI
  const language = child.language === "kz" ? "казахский" : "русский";
  const responseLanguage = child.language === "kz" ? "kz" : "ru";

  const prompt = `Ты - дружелюбный AI-помощник для детей по имени ДамуБала. Ты обращаешься напрямую к ребенку ${child.name} (${child.age} лет) от первого лица, как добрый друг и наставник. Проанализируй данные и создай персональные рекомендации, обращаясь напрямую к ребенку.

**Профиль ребенка:**
- Имя: ${child.name}
- Возраст: ${child.age} лет
- Уровень: ${child.level}
- Всего очков: ${child.totalPoints}
- Язык: ${language}

**Статистика игр (последние 30 дней):**
- Всего игр: ${totalGames}
- Общее время игры: ${Math.round(totalTime / 60)} минут
- Средняя точность: ${Math.round(avgAccuracy * 100)}%

**Производительность по играм:**
${Array.from(gameStats.entries())
  .map(
    ([gameKey, stats]) =>
      `- ${GAME_NAMES[gameKey]}: ${stats.count} игр, точность ${Math.round(stats.avgAccuracy * 100)}%, средний счет ${Math.round(stats.avgScore)}`,
  )
  .join("\n")}

**Эмоциональное состояние:**
${emotions.length > 0
  ? Array.from(emotionCounts.entries())
      .map(([emotion, count]) => `- ${EMOTION_NAMES[emotion]}: ${count} раз`)
      .join("\n")
  : "Нет данных об эмоциях"}

**Достижения:** ${achievements.length > 0 ? achievements.join(", ") : "Пока нет достижений"}

**Задача:**
Создай 3-5 персональных рекомендаций, обращаясь напрямую к ${child.name} от первого лица (используй "ты", "тебе", "твои"). Каждая рекомендация должна:
1. Быть написана от первого лица, как будто ты сам обращаешься к ребенку
2. Быть дружелюбной, мотивирующей и понятной для ребенка ${child.age} лет
3. Быть на ${responseLanguage === "kz" ? "казахском" : "русском"} языке
4. Иметь тип: "skill" (навыки), "emotional" (эмоции), "engagement" (вовлеченность), или "general" (общее)
5. Иметь приоритет: "high", "medium", или "low"
6. Включать конкретные действия, которые ребенок может сделать сам

**Примеры правильного стиля:**
- ❌ НЕПРАВИЛЬНО: "Поздравьте ребенка с результатом. Предложите ему поиграть еще."
- ✅ ПРАВИЛЬНО: "Поздравляю тебя с отличным результатом! Давай попробуем сыграть еще раз на более сложном уровне!"

**Формат ответа (строго JSON объект с полем "recommendations"):**
{
  "recommendations": [
    {
      "type": "skill|emotional|engagement|general",
      "priority": "high|medium|low",
      "title": "Краткий заголовок, обращенный к ребенку (до 50 символов)",
      "description": "Описание, обращенное к ребенку от первого лица (2-3 предложения)",
      "actionableSteps": ["Действие 1 для ребенка", "Действие 2 для ребенка", "Действие 3 для ребенка"]
    }
  ]
}

Верни ТОЛЬКО валидный JSON объект, без дополнительного текста.`;

  // Check if OpenAI is available
  const openai = getOpenAIClient();
  if (!openai) {
    // Fallback to rule-based recommendations if OpenAI is not configured
    console.log("⚠️ OpenAI API key not configured, using fallback recommendations");
    return generateFallbackRecommendations(child, gameStats, emotionCounts);
  }

  console.log("🤖 Using OpenAI API to generate recommendations for", child.name);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency
      messages: [
        {
          role: "system",
          content:
            "Ты - дружелюбный AI-помощник ДамуБала для детей. Ты обращаешься напрямую к ребенку от первого лица, как добрый друг. Твоя задача - анализировать данные о ребенке и давать персональные, мотивирующие рекомендации, обращаясь напрямую к нему (используй 'ты', 'тебе', 'твои'). Всегда отвечай строго в формате JSON объекта с полем 'recommendations'.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code blocks or other formatting
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON format");
      }
    }

    // Extract recommendations array
    const recommendations = parsed.recommendations || parsed.data || (Array.isArray(parsed) ? parsed : []);

    // Validate and normalize recommendations
    const validRecommendations: Recommendation[] = [];
    for (const rec of recommendations.slice(0, 5)) {
      // Ensure required fields
      if (rec.title && rec.description && rec.type && rec.priority) {
        validRecommendations.push({
          type: rec.type,
          priority: rec.priority,
          title: rec.title.substring(0, 100),
          description: rec.description.substring(0, 500),
          actionableSteps: Array.isArray(rec.actionableSteps)
            ? rec.actionableSteps.slice(0, 5).map((s: any) => String(s).substring(0, 200))
            : undefined,
        });
      }
    }

    // If no valid recommendations, return fallback
    if (validRecommendations.length === 0) {
      return generateFallbackRecommendations(child, gameStats, emotionCounts);
    }

    console.log("✅ OpenAI generated", validRecommendations.length, "recommendations");
    return validRecommendations;
  } catch (error) {
    console.error("❌ OpenAI recommendation error:", error);
    console.log("⚠️ Falling back to rule-based recommendations");
    // Fallback to rule-based recommendations if AI fails
    return generateFallbackRecommendations(child, gameStats, emotionCounts);
  }
}

/**
 * Fallback rule-based recommendations if AI fails
 */
function generateFallbackRecommendations(
  child: ChildProfile,
  gameStats: Map<GameKey, { count: number; avgAccuracy: number; avgScore: number }>,
  emotionCounts: Map<EmotionType, number>,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Find weak areas
  for (const [gameKey, stats] of gameStats) {
    if (stats.avgAccuracy < 0.5 && stats.count >= 3) {
      recommendations.push({
        type: "skill",
        priority: "high",
        title: `Давай улучшим твои навыки в ${GAME_NAMES[gameKey]}!`,
        description: `Я вижу, что ты показываешь результат ${Math.round(stats.avgAccuracy * 100)}% в игре "${GAME_NAMES[gameKey]}". Давай попробуем больше практики на легком уровне - это поможет тебе стать лучше!`,
        actionableSteps: [
          "Попробуй сыграть в эту игру еще раз на легком уровне",
          "Не спеши - важно понимать, а не просто быстро отвечать",
          "Я верю, что у тебя получится!",
        ],
      });
    }
  }

  // Check for negative emotions
  const totalEmotions = Array.from(emotionCounts.values()).reduce((a, b) => a + b, 0);
  if (totalEmotions > 0) {
    const negativeCount =
      (emotionCounts.get("sad") || 0) +
      (emotionCounts.get("angry") || 0) +
      (emotionCounts.get("fearful") || 0);
    const negativeRatio = negativeCount / totalEmotions;

    if (negativeRatio > 0.3) {
      recommendations.push({
        type: "emotional",
        priority: "high",
        title: "Давай сделаем игры веселее!",
        description:
          "Я заметил, что тебе иногда бывает грустно или сложно во время игр. Давай попробуем выбрать более спокойные игры или играть на легком уровне - главное, чтобы тебе было интересно и весело!",
        actionableSteps: [
          "Попробуй выбрать игру, которая тебе больше нравится",
          "Играй на легком уровне - не нужно торопиться",
          "Делай перерывы, если устал",
        ],
      });
    }
  }

  // General recommendation based on level
  if (child.level >= 3 && child.level < 5) {
    recommendations.push({
      type: "general",
      priority: "medium",
      title: "Ты готов к новому уровню!",
      description: `${child.name}, ты отлично прогрессируешь! Давай попробуем игры на среднем уровне сложности - я уверен, что ты справишься!`,
      actionableSteps: [
        "Попробуй одну игру на среднем уровне",
        "Если будет сложно - всегда можно вернуться к легкому",
        "Я буду рядом и помогу тебе!",
      ],
    });
  }

  return recommendations.length > 0 ? recommendations : [
    {
      type: "engagement",
      priority: "medium",
      title: "Продолжай играть!",
      description: `${child.name}, ты делаешь отличные успехи! Давай продолжать играть регулярно - это поможет тебе стать еще лучше!`,
      actionableSteps: [
        "Попробуй играть 2-3 раза в неделю",
        "Пробуй разные игры - это интересно!",
        "Гордись своими достижениями!",
      ],
    },
  ];
}

/**
 * Generate a quick recommendation after a single game session
 */
export async function generatePostGameRecommendation(
  child: ChildProfile,
  gameKey: GameKey,
  score: number,
  maxScore: number,
  accuracy: number,
  difficulty: string,
): Promise<Recommendation | null> {
  const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const gameName = GAME_NAMES[gameKey];

  // Only generate AI recommendation for significant sessions
  if (maxScore < 10) {
    return null; // Too small to analyze
  }

  const prompt = `Ты - дружелюбный AI-помощник ДамуБала. Ребенок ${child.name} (${child.age} лет) только что завершил игру "${gameName}" на уровне сложности "${difficulty}".

Результаты:
- Счет: ${score} из ${maxScore} (${Math.round(scorePercentage)}%)
- Точность: ${Math.round(accuracy * 100)}%
- Уровень ребенка: ${child.level}

Создай одну краткую, мотивирующую рекомендацию, обращаясь напрямую к ${child.name} от первого лица (используй "ты", "тебе", "твои"). Будь дружелюбным, как добрый друг. На ${child.language === "kz" ? "казахском" : "русском"} языке.

**Примеры правильного стиля:**
- ❌ НЕПРАВИЛЬНО: "Поздравьте ребенка с результатом. Предложите ему поиграть еще."
- ✅ ПРАВИЛЬНО: "Поздравляю тебя с отличным результатом! Давай попробуем сыграть еще раз!"

Формат (строго JSON):
{
  "type": "skill|emotional|engagement|general",
  "priority": "high|medium|low",
  "title": "Краткий заголовок, обращенный к ребенку",
  "description": "1-2 предложения, обращенные к ребенку от первого лица",
  "actionableSteps": ["Действие для ребенка 1", "Действие для ребенка 2"]
}`;

  // Check if OpenAI is available
  const openai = getOpenAIClient();
  if (openai) {
    console.log("🤖 Using OpenAI API to generate post-game recommendation for", child.name);
    // Try OpenAI if it's available
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
        {
          role: "system",
          content:
            "Ты - дружелюбный AI-помощник ДамуБала для детей. Ты обращаешься напрямую к ребенку от первого лица, как добрый друг. Дай краткую, позитивную рекомендацию, обращаясь к ребенку напрямую (используй 'ты', 'тебе', 'твои'). Отвечай строго в формате JSON.",
        },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.title && parsed.description) {
          console.log("✅ OpenAI generated post-game recommendation");
          return {
            type: parsed.type || "general",
            priority: parsed.priority || "medium",
            title: parsed.title.substring(0, 100),
            description: parsed.description.substring(0, 300),
            actionableSteps: Array.isArray(parsed.actionableSteps)
              ? parsed.actionableSteps.slice(0, 3).map((s: any) => String(s).substring(0, 150))
              : undefined,
          };
        }
      }
    } catch (error) {
      console.error("❌ Post-game recommendation OpenAI error:", error);
      console.log("⚠️ Falling back to rule-based recommendation");
      // Fall through to fallback
    }
  } else {
    console.log("⚠️ OpenAI API key not configured, using fallback recommendation");
  }

  // Fallback
  if (scorePercentage >= 80) {
    return {
      type: "skill",
      priority: "low",
      title: "Поздравляю тебя с отличным результатом!",
      description: `${child.name}, ты показал отличный результат в "${gameName}" - целых ${Math.round(scorePercentage)}%! Ты молодец! Давай попробуем еще раз или перейдем на более сложный уровень?`,
      actionableSteps: [
        "Попробуй сыграть на более сложном уровне",
        "Или попробуй другие игры для разнообразия",
      ],
    };
  } else if (scorePercentage >= 50) {
    return {
      type: "skill",
      priority: "medium",
      title: "Хорошая работа!",
      description: `${child.name}, ты показал хороший результат в "${gameName}"! Есть куда расти - давай попробуем еще раз, и ты обязательно станешь еще лучше!`,
      actionableSteps: [
        "Попробуй сыграть еще раз на том же уровне",
        "Не спеши - главное понимать, а не быстро отвечать",
      ],
    };
  } else {
    return {
      type: "skill",
      priority: "high",
      title: "Давай попробуем еще раз!",
      description: `${child.name}, ты показал результат ${Math.round(scorePercentage)}% в "${gameName}". Давай попробуем сыграть еще раз на легком уровне - я уверен, что у тебя получится лучше!`,
      actionableSteps: [
        "Попробуй эту игру на легком уровне еще раз",
        "Не расстраивайся - каждый раз ты становишься лучше",
        "Я верю в тебя!",
      ],
    };
  }
}

