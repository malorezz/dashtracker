import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;
const TRACKER_URL = 'https://dashtracker-one.vercel.app';

// DB frequency_days: Mon=0 … Sun=6
// JS Date.getDay():  Sun=0, Mon=1 … Sat=6
function getTodayDbDay() {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function sendTelegramMessage(chatId, text, replyMarkup) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
  return res.json();
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const todayDbDay = getTodayDbDay();
    const todayDate = getTodayDateString();

    // Fetch all habits for the user
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, emoji, frequency_type, frequency_days')
      .eq('user_id', TELEGRAM_USER_ID)
      .order('order_index', { ascending: true });

    if (habitsError) throw habitsError;

    const todayHabits = (habits || []).filter((h) => {
      if (h.frequency_type === 'daily') return true;
      if (h.frequency_type === 'specific' && Array.isArray(h.frequency_days)) {
        return h.frequency_days.includes(todayDbDay);
      }
      return false;
    });

    if (todayHabits.length === 0) {
      return res.status(200).json({ ok: true, message: 'No habits today' });
    }

    // Fetch today's completed logs
    const habitIds = todayHabits.map((h) => h.id);
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', TELEGRAM_USER_ID)
      .eq('date', todayDate)
      .eq('completed', true)
      .in('habit_id', habitIds);

    if (logsError) throw logsError;

    const completedIds = new Set((logs || []).map((l) => l.habit_id));
    const completedCount = completedIds.size;
    const totalCount = todayHabits.length;
    const percent = Math.round((completedCount / totalCount) * 100);

    const habitList = todayHabits
      .map((h) => {
        const done = completedIds.has(h.id);
        return `${done ? '✅' : '⬜'} ${h.emoji || ''} ${h.name}`.trim();
      })
      .join('\n');

    const text =
      `Як пройшов день? 🌙\n\n` +
      `Виконано: ${completedCount} з ${totalCount} звичок (${percent}%)\n\n` +
      `${habitList}`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: '📱 Відкрити трекер', url: TRACKER_URL }],
      ],
    };

    const result = await sendTelegramMessage(TELEGRAM_USER_ID, text, replyMarkup);

    return res.status(200).json({ ok: true, telegram: result });
  } catch (err) {
    console.error('Evening cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
