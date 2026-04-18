export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, id, telegram_id, username, amount, proof, address } = req.body;
    
    // We need environment variables configured in Vercel
    const BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;
    const ADMIN_ID = process.env.ADMIN_ID;

    if (!BOT_TOKEN || !ADMIN_ID) {
        console.error("Missing ADMIN_BOT_TOKEN or ADMIN_ID in env");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    let messageText = '';
    let keyboard = null;

    if (type === 'deposit') {
        messageText = `💰 *YENİ BAKİYE YÜKLEME TALEBİ*\n\n` +
                      `Kullanıcı: @${username || 'Bilinmiyor'} (ID: \`${telegram_id}\`)\n` +
                      `Yüklenen Miktar: *$${amount}*\n\n` +
                      `Dekont/Kanıt URL:\n${proof}`;

        keyboard = {
            inline_keyboard: [[
                { text: "✅ Onayla ($" + amount + " Ekle)", callback_data: `action_approve_deposit_${id}` },
                { text: "❌ Reddet", callback_data: `action_reject_deposit_${id}` }
            ]]
        };
    } else if (type === 'withdraw') {
        messageText = `💸 *YENİ ÇEKİM TALEBİ*\n\n` +
                      `Kullanıcı: @${username || 'Bilinmiyor'} (ID: \`${telegram_id}\`)\n` +
                      `Çekilecek Miktar: *$${amount}*\n\n` +
                      `Solana Adresi:\n\`${address}\``;

        keyboard = {
            inline_keyboard: [[
                { text: "✅ Ödendi Olarak İşaretle", callback_data: `action_approve_withdraw_${id}` },
                { text: "❌ Reddet (İade Et)", callback_data: `action_reject_withdraw_${id}` }
            ]]
        };
    } else {
        return res.status(400).json({ error: 'Invalid type' });
    }

    // Send to Telegram using Bot API natively
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const tgRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: messageText,
                parse_mode: 'Markdown',
                reply_markup: keyboard
            })
        });

        if (!tgRes.ok) {
            const errBody = await tgRes.text();
            console.error("Telegram API Error:", errBody);
            throw new Error('Telegram API failed');
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Notify error:", err);
        return res.status(500).json({ error: 'Notification failed' });
    }
}
