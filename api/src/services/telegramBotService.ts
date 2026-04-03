// api/src/services/telegramBotService.ts
import { Bot, Context, GrammyError, HttpError } from "grammy";
import OpenAI from "openai";
import { User, Child, GameSession, EmotionRecord, Achievement, AIFriendMessage, TelegramLink } from "../models/index.js";
import type { IChild } from "../models/index.js";
import type { GameKey } from "../models/GameSession.js";
import type { EmotionType } from "../models/EmotionRecord.js";

let bot: Bot | null = null;
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const GAME_NAMES: Record<GameKey, string> = {
  "memory-match": "Игра на память",
  "pattern-sequence": "Узоры и последовательности",
  "math-adventure": "Математика",
  "word-builder": "Слова и буквы",
  "emotion-cards": "Эмоции",
  "puzzle-solve": "Головоломки",
  "fruit-ninja-nose": "Фруктовый ниндзя",
  "pose-match": "Повтори позу",
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getLinkedParent(chatId: number) {
  const link = await TelegramLink.findOne({ telegramChatId: chatId });
  if (!link) return null;
  const parent = await User.findById(link.parentId);
  return parent ? { parent, link } : null;
}

async function getParentChildren(parentId: string) {
  return Child.find({ parentId }).select("-pin");
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} сек`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min < 60) return sec > 0 ? `${min} мин ${sec} сек` : `${min} мин`;
  const hr = Math.floor(min / 60);
  const remainMin = min % 60;
  return `${hr} ч ${remainMin} мин`;
}

async function buildChildSummary(child: IChild, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [sessions, emotions, achievements, chatMessages] = await Promise.all([
    GameSession.find({ childId: child._id, createdAt: { $gte: startDate } }),
    EmotionRecord.find({ childId: child._id, timestamp: { $gte: startDate } }),
    Achievement.find({ childId: child._id }).sort({ unlockedAt: -1 }).limit(10),
    AIFriendMessage.countDocuments({ childId: child._id, timestamp: { $gte: startDate } }),
  ]);

  const totalGames = sessions.length;
  const totalTime = sessions.reduce((s, g) => s + g.duration, 0);
  const avgAccuracy =
    totalGames > 0
      ? sessions.reduce((s, g) => s + (g.totalQuestions > 0 ? g.correctAnswers / g.totalQuestions : 0), 0) / totalGames
      : 0;

  const gameStats = new Map<GameKey, { count: number; avgAcc: number; totalScore: number }>();
  for (const s of sessions) {
    const e = gameStats.get(s.gameKey) || { count: 0, avgAcc: 0, totalScore: 0 };
    e.count += 1;
    e.avgAcc = (e.avgAcc * (e.count - 1) + (s.totalQuestions > 0 ? s.correctAnswers / s.totalQuestions : 0)) / e.count;
    e.totalScore += s.score;
    gameStats.set(s.gameKey, e);
  }

  const emotionCounts = new Map<EmotionType, number>();
  for (const em of emotions) {
    emotionCounts.set(em.emotion, (emotionCounts.get(em.emotion) || 0) + 1);
  }

  return {
    child,
    totalGames,
    totalTime,
    avgAccuracy,
    gameStats,
    emotionCounts,
    achievements,
    chatMessages,
    days,
  };
}

// ─── Command: /start ───────────────────────────────────────────────────────────

async function handleStart(ctx: Context) {
  await ctx.reply(
    `👋 *Добро пожаловать в DamuBala Bot!*

Я помогу вам следить за прогрессом вашего ребёнка в приложении DamuBala.

🔐 *Для начала свяжите ваш аккаунт:*
Отправьте: \`/login email пароль\`

📋 *Доступные команды:*
/children — список ваших детей
/stats — статистика ребёнка
/report — недельный AI-отчёт
/ask — задать вопрос AI о прогрессе
/help — справка по командам`,
    { parse_mode: "Markdown" },
  );
}

// ─── Command: /help ────────────────────────────────────────────────────────────

async function handleHelp(ctx: Context) {
  await ctx.reply(
    `📋 *Команды DamuBala Bot*

🔐 *Аккаунт:*
/login \`email пароль\` — связать Telegram с аккаунтом
/logout — отвязать аккаунт

👶 *Дети:*
/children — список детей
/stats \`имя\` — статистика ребёнка (30 дней)
/report \`имя\` — подробный AI-отчёт за неделю

🤖 *AI-помощник:*
/ask \`ваш вопрос\` — спросите что угодно о прогрессе

💡 _Если у вас один ребёнок, имя можно не указывать._`,
    { parse_mode: "Markdown" },
  );
}

// ─── Command: /login ───────────────────────────────────────────────────────────

async function handleLogin(ctx: Context) {
  const text = ctx.message?.text || "";
  const parts = text.split(/\s+/);

  if (parts.length < 3) {
    await ctx.reply("❌ Формат: `/login email пароль`", { parse_mode: "Markdown" });
    return;
  }

  const email = parts[1].toLowerCase().trim();
  const password = parts[2];

  const user = await User.findOne({ email });
  if (!user) {
    await ctx.reply("❌ Пользователь с таким email не найден. Проверьте email и попробуйте снова.");
    return;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    await ctx.reply("❌ Неверный пароль. Попробуйте снова.");
    return;
  }

  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await TelegramLink.findOneAndUpdate(
    { telegramChatId: chatId },
    {
      telegramChatId: chatId,
      telegramUsername: ctx.from?.username,
      parentId: user._id,
      language: user.language,
      linkedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  // Delete the message with credentials for security
  try {
    await ctx.deleteMessage();
  } catch {
    // May fail if bot doesn't have delete permission
  }

  await ctx.reply(
    `✅ Аккаунт успешно привязан!\n\n👤 *${user.name}* (${user.email})\n\n🔒 _Ваше сообщение с паролем было удалено для безопасности._\n\nТеперь вы можете использовать /children, /stats и /ask`,
    { parse_mode: "Markdown" },
  );
}

// ─── Command: /logout ──────────────────────────────────────────────────────────

async function handleLogout(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const deleted = await TelegramLink.findOneAndDelete({ telegramChatId: chatId });
  if (deleted) {
    await ctx.reply("✅ Аккаунт отвязан. Используйте /login чтобы привязать снова.");
  } else {
    await ctx.reply("ℹ️ Аккаунт не был привязан.");
  }
}

// ─── Command: /children ────────────────────────────────────────────────────────

async function handleChildren(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const linked = await getLinkedParent(chatId);
  if (!linked) {
    await ctx.reply("🔐 Сначала привяжите аккаунт: `/login email пароль`", { parse_mode: "Markdown" });
    return;
  }

  const children = await getParentChildren(linked.parent._id.toString());

  if (children.length === 0) {
    await ctx.reply("У вас пока нет добавленных детей. Добавьте ребёнка в приложении DamuBala.");
    return;
  }

  let msg = "👶 *Ваши дети:*\n\n";
  for (const child of children) {
    msg += `*${child.name}* (${child.age} лет)\n`;
    msg += `   🏆 Уровень: ${child.level} | Очки: ${child.totalPoints}\n`;
    msg += `   🔥 Серия: ${child.currentStreak} дней (лучшая: ${child.bestStreak})\n`;
    if (child.lastPlayedDate) {
      msg += `   📅 Последняя игра: ${child.lastPlayedDate}\n`;
    }
    msg += "\n";
  }

  msg += "_Используйте_ `/stats имя` _для подробной статистики_";

  await ctx.reply(msg, { parse_mode: "Markdown" });
}

// ─── Command: /stats ───────────────────────────────────────────────────────────

async function handleStats(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const linked = await getLinkedParent(chatId);
  if (!linked) {
    await ctx.reply("🔐 Сначала привяжите аккаунт: `/login email пароль`", { parse_mode: "Markdown" });
    return;
  }

  const children = await getParentChildren(linked.parent._id.toString());
  if (children.length === 0) {
    await ctx.reply("У вас нет добавленных детей.");
    return;
  }

  const text = ctx.message?.text || "";
  const childName = text.replace(/^\/stats\s*/i, "").trim();

  let child: IChild;
  if (children.length === 1) {
    child = children[0];
  } else if (!childName) {
    const names = children.map((c) => c.name).join(", ");
    await ctx.reply(`У вас несколько детей. Укажите имя:\n\`/stats имя\`\n\nДоступные: ${names}`, { parse_mode: "Markdown" });
    return;
  } else {
    const found = children.find((c) => c.name.toLowerCase() === childName.toLowerCase());
    if (!found) {
      const names = children.map((c) => c.name).join(", ");
      await ctx.reply(`Ребёнок "${childName}" не найден.\n\nДоступные: ${names}`);
      return;
    }
    child = found;
  }

  await ctx.reply("⏳ Собираю статистику...");

  const summary = await buildChildSummary(child);

  let msg = `📊 *Статистика: ${child.name}* (${child.age} лет)\n`;
  msg += `_Период: последние ${summary.days} дней_\n\n`;

  msg += `🏆 *Уровень:* ${child.level} | *Очки:* ${child.totalPoints}\n`;
  msg += `🔥 *Серия:* ${child.currentStreak} дней (лучшая: ${child.bestStreak})\n\n`;

  msg += `🎮 *Общая активность:*\n`;
  msg += `   Всего игр: ${summary.totalGames}\n`;
  msg += `   Время в играх: ${formatDuration(summary.totalTime)}\n`;
  msg += `   Средняя точность: ${Math.round(summary.avgAccuracy * 100)}%\n\n`;

  if (summary.gameStats.size > 0) {
    msg += `📈 *По играм:*\n`;
    for (const [gameKey, stats] of summary.gameStats) {
      const name = GAME_NAMES[gameKey] || gameKey;
      msg += `   • ${name}: ${stats.count} игр, точность ${Math.round(stats.avgAcc * 100)}%\n`;
    }
    msg += "\n";
  }

  if (summary.emotionCounts.size > 0) {
    msg += `😊 *Эмоции:*\n`;
    const sorted = [...summary.emotionCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [emotion, count] of sorted.slice(0, 5)) {
      msg += `   • ${EMOTION_NAMES[emotion] || emotion}: ${count} раз\n`;
    }
    msg += "\n";
  }

  if (summary.achievements.length > 0) {
    msg += `🏅 *Последние достижения:*\n`;
    for (const ach of summary.achievements.slice(0, 5)) {
      msg += `   ${ach.icon} ${ach.name}\n`;
    }
    msg += "\n";
  }

  msg += `💬 *Сообщений AI-другу:* ${summary.chatMessages}\n`;

  await ctx.reply(msg, { parse_mode: "Markdown" });
}

// ─── Command: /report ──────────────────────────────────────────────────────────

async function handleReport(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const linked = await getLinkedParent(chatId);
  if (!linked) {
    await ctx.reply("🔐 Сначала привяжите аккаунт: `/login email пароль`", { parse_mode: "Markdown" });
    return;
  }

  const children = await getParentChildren(linked.parent._id.toString());
  if (children.length === 0) {
    await ctx.reply("У вас нет добавленных детей.");
    return;
  }

  const text = ctx.message?.text || "";
  const childName = text.replace(/^\/report\s*/i, "").trim();

  let child: IChild;
  if (children.length === 1) {
    child = children[0];
  } else if (!childName) {
    const names = children.map((c) => c.name).join(", ");
    await ctx.reply(`У вас несколько детей. Укажите имя:\n\`/report имя\`\n\nДоступные: ${names}`, { parse_mode: "Markdown" });
    return;
  } else {
    const found = children.find((c) => c.name.toLowerCase() === childName.toLowerCase());
    if (!found) {
      const names = children.map((c) => c.name).join(", ");
      await ctx.reply(`Ребёнок "${childName}" не найден.\n\nДоступные: ${names}`);
      return;
    }
    child = found;
  }

  await ctx.reply("⏳ Генерирую AI-отчёт за неделю...");

  const summary = await buildChildSummary(child, 7);
  const openai = getOpenAI();

  if (!openai) {
    await ctx.reply("⚠️ AI-сервис временно недоступен. Используйте /stats для базовой статистики.");
    return;
  }

  const gameStatsStr = [...summary.gameStats.entries()]
    .map(([k, v]) => `${GAME_NAMES[k] || k}: ${v.count} игр, точность ${Math.round(v.avgAcc * 100)}%`)
    .join("\n");

  const emotionStr = [...summary.emotionCounts.entries()]
    .map(([k, v]) => `${EMOTION_NAMES[k] || k}: ${v} раз`)
    .join("\n");

  const prompt = `Ты — AI-аналитик приложения DamuBala. Напиши краткий, но информативный недельный отчёт ДЛЯ РОДИТЕЛЯ о прогрессе ребёнка. Формат — текст для Telegram (используй эмодзи). Пиши на русском.

Ребёнок: ${child.name}, ${child.age} лет, уровень ${child.level}, ${child.totalPoints} очков
Серия: ${child.currentStreak} дней (лучшая: ${child.bestStreak})

За последние 7 дней:
- Игр сыграно: ${summary.totalGames}
- Время в играх: ${formatDuration(summary.totalTime)}
- Средняя точность: ${Math.round(summary.avgAccuracy * 100)}%

По играм:
${gameStatsStr || "Нет данных"}

Эмоции:
${emotionStr || "Нет данных"}

Достижения: ${summary.achievements.map((a) => a.name).join(", ") || "Нет новых"}
Сообщений AI-другу: ${summary.chatMessages}

Напиши отчёт для родителя: основные достижения, что улучшить, эмоциональное состояние, и 2-3 конкретных совета. Будь конкретен и дружелюбен. Не более 300 слов.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — профессиональный детский психолог-аналитик. Пишешь краткие, полезные отчёты для родителей на русском языке. Используй эмодзи для структуры.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const report = completion.choices[0]?.message?.content;
    if (report) {
      await ctx.reply(`📋 *Недельный отчёт: ${child.name}*\n\n${report}`, { parse_mode: "Markdown" });
    } else {
      await ctx.reply("⚠️ Не удалось сгенерировать отчёт. Попробуйте позже.");
    }
  } catch (err) {
    console.error("Telegram report AI error:", err);
    await ctx.reply("⚠️ Ошибка AI-сервиса. Попробуйте позже или используйте /stats.");
  }
}

// ─── Command: /ask ─────────────────────────────────────────────────────────────

async function handleAsk(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const linked = await getLinkedParent(chatId);
  if (!linked) {
    await ctx.reply("🔐 Сначала привяжите аккаунт: `/login email пароль`", { parse_mode: "Markdown" });
    return;
  }

  const text = ctx.message?.text || "";
  const question = text.replace(/^\/ask\s*/i, "").trim();

  if (!question) {
    await ctx.reply(
      `❓ Задайте вопрос после команды:\n\`/ask как дела у ребёнка?\`\n\n*Примеры вопросов:*\n• Как дела у ребёнка на этой неделе?\n• В каких играх лучше всего результаты?\n• Какие эмоции чаще всего у ребёнка?\n• Что можно улучшить?\n• Стоит ли менять сложность игр?`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  const children = await getParentChildren(linked.parent._id.toString());
  if (children.length === 0) {
    await ctx.reply("У вас нет добавленных детей в DamuBala.");
    return;
  }

  await ctx.reply("🤔 Анализирую данные...");

  const allSummaries: string[] = [];
  for (const child of children) {
    const s = await buildChildSummary(child, 30);

    const gameStatsStr = [...s.gameStats.entries()]
      .map(([k, v]) => `${GAME_NAMES[k] || k}: ${v.count} игр, точность ${Math.round(v.avgAcc * 100)}%`)
      .join("; ");

    const emotionStr = [...s.emotionCounts.entries()]
      .map(([k, v]) => `${EMOTION_NAMES[k] || k}: ${v}`)
      .join("; ");

    allSummaries.push(
      `Ребёнок: ${child.name}, ${child.age} лет, уровень ${child.level}, ${child.totalPoints} очков, серия ${child.currentStreak} дней.
За 30 дней: ${s.totalGames} игр, ${formatDuration(s.totalTime)}, точность ${Math.round(s.avgAccuracy * 100)}%.
Игры: ${gameStatsStr || "нет данных"}.
Эмоции: ${emotionStr || "нет данных"}.
Достижения: ${s.achievements.map((a) => a.name).join(", ") || "нет"}.
Сообщений AI-другу: ${s.chatMessages}.`,
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    await ctx.reply("⚠️ AI-сервис временно недоступен.");
    return;
  }

  const systemPrompt = `Ты — AI-помощник DamuBala для родителей. У тебя есть данные о детях этого родителя. Отвечай на вопросы о прогрессе, статистике, эмоциях, рекомендациях. Будь конкретным, дружелюбным, используй данные. Если данных нет — скажи об этом. Пиши на русском. Используй эмодзи для структуры. Не более 250 слов.

Данные о детях:
${allSummaries.join("\n\n")}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const answer = completion.choices[0]?.message?.content;
    if (answer) {
      await ctx.reply(answer, { parse_mode: "Markdown" });
    } else {
      await ctx.reply("⚠️ Не удалось получить ответ. Попробуйте позже.");
    }
  } catch (err) {
    console.error("Telegram /ask AI error:", err);
    await ctx.reply("⚠️ Ошибка AI-сервиса. Попробуйте переформулировать вопрос или попробуйте позже.");
  }
}

// ─── Free-text handler (for natural conversation) ──────────────────────────────

async function handleMessage(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const text = ctx.message?.text;
  if (!text || text.startsWith("/")) return;

  const linked = await getLinkedParent(chatId);
  if (!linked) {
    await ctx.reply("👋 Привет! Я бот DamuBala.\n\nСначала привяжите аккаунт: `/login email пароль`\nИли напишите /help для списка команд.", { parse_mode: "Markdown" });
    return;
  }

  // Treat any plain text as an /ask question
  const children = await getParentChildren(linked.parent._id.toString());
  if (children.length === 0) {
    await ctx.reply("У вас нет добавленных детей. Добавьте ребёнка в приложении DamuBala.");
    return;
  }

  await ctx.reply("🤔 Думаю...");

  const allSummaries: string[] = [];
  for (const child of children) {
    const s = await buildChildSummary(child, 30);
    const gameStatsStr = [...s.gameStats.entries()]
      .map(([k, v]) => `${GAME_NAMES[k] || k}: ${v.count} игр, точность ${Math.round(v.avgAcc * 100)}%`)
      .join("; ");
    const emotionStr = [...s.emotionCounts.entries()]
      .map(([k, v]) => `${EMOTION_NAMES[k] || k}: ${v}`)
      .join("; ");

    allSummaries.push(
      `Ребёнок: ${child.name}, ${child.age} лет, уровень ${child.level}, ${child.totalPoints} очков, серия ${child.currentStreak} дней.
За 30 дней: ${s.totalGames} игр, ${formatDuration(s.totalTime)}, точность ${Math.round(s.avgAccuracy * 100)}%.
Игры: ${gameStatsStr || "нет"}.
Эмоции: ${emotionStr || "нет"}.
Достижения: ${s.achievements.map((a) => a.name).join(", ") || "нет"}.
Сообщений AI-другу: ${s.chatMessages}.`,
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    await ctx.reply("⚠️ AI-сервис недоступен. Используйте /stats или /report для получения информации.");
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Ты — AI-помощник DamuBala для родителей. Отвечай на вопросы о детях, давай рекомендации. Будь конкретным и дружелюбным. Пиши на русском. Используй эмодзи. Не более 250 слов.

Данные о детях:
${allSummaries.join("\n\n")}`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const answer = completion.choices[0]?.message?.content;
    if (answer) {
      await ctx.reply(answer, { parse_mode: "Markdown" });
    } else {
      await ctx.reply("⚠️ Не удалось получить ответ. Попробуйте /help для списка команд.");
    }
  } catch (err) {
    console.error("Telegram free-text AI error:", err);
    await ctx.reply("⚠️ Ошибка. Попробуйте использовать /stats или /ask.");
  }
}

// ─── Bot initialization ────────────────────────────────────────────────────────

export async function startTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("ℹ️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  bot = new Bot(token);

  bot.command("start", handleStart);
  bot.command("help", handleHelp);
  bot.command("login", handleLogin);
  bot.command("logout", handleLogout);
  bot.command("children", handleChildren);
  bot.command("stats", handleStats);
  bot.command("report", handleReport);
  bot.command("ask", handleAsk);
  bot.on("message:text", handleMessage);

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Telegram bot error for update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Grammy error:", e.description);
    } else if (e instanceof HttpError) {
      console.error("HTTP error:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  bot.start({
    onStart: (info) => {
      console.log(`🤖 Telegram bot @${info.username} started successfully`);
    },
  });
}

export async function stopTelegramBot(): Promise<void> {
  if (bot) {
    bot.stop();
    console.log("🤖 Telegram bot stopped");
  }
}
