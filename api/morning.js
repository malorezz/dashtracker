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
  const jsDay = new Date().getDay(); // 0=Sun
  return (jsDay + 6) % 7;           // convert → Mon=0…Sun=6
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
  // Vercel Cron passes Authorization header with CRON_SECRET
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const todayDbDay = getTodayDbDay();

    const { data: habits, error } = await supabase
      .from('habits')
      .select('id, name, emoji, frequency_type, frequency_days')
      .eq('user_id', TELEGRAM_USER_ID)
      .order('order_index', { ascending: true });

    if (error) throw error;

    const todayHabits = (habits || []).filter((h) => {
      if (h.frequency_type === 'daily') return true;
      if (h.frequency_type === 'weekly' && Array.isArray(h.frequency_days)) {
        return h.frequency_days.includes(todayDbDay);
      }
      return false;
    });

    if (todayHabits.length === 0) {
      return res.status(200).json({ ok: true, message: 'No habits today' });
    }

    const habitList = todayHabits
      .map((h) => `${h.emoji || '•'} ${h.name}`)
      .join('\n');

    const text =
      `Доброго ранку! 🌅\n\n` +
      `Твої звички на сьогодні:\n${habitList}`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: '📱 Відкрити трекер', url: TRACKER_URL }],
      ],
    };

    const result = await sendTelegramMessage(TELEGRAM_USER_ID, text, replyMarkup);

    return res.status(200).json({ ok: true, telegram: result });
  } catch (err) {
    console.error('Morning cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
