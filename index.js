const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

const logoUrl = 'https://files.catbox.moe/90yqxb.png';

async function startVoidBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();
    
    const client = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    app.use(express.static('public'));
    app.get('/pair', async (req, res) => {
        let num = req.query.number;
        if (!num) return res.status(400).json({ error: "Number required" });
        try {
            let code = await client.requestPairingCode(num);
            res.json({ code: code });
        } catch (err) { res.status(500).json({ error: "Pairing failed" }); }
    });

    client.ev.on("connection.update", async (update) => {
        const { connection } = update;
        if (connection === "open") {
            await client.sendMessage(client.user.id, { 
                image: { url: logoUrl }, 
                caption: "شكراً لاستخدامك تشالاه فويد ٤٠٤. تم تفعيل النظام بنجاح. استعد للسيطرة..." 
            });
        }
    });

    client.ev.on("messages.upsert", async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || "";

        // Auto Status Seen & Like
        if (from === 'status@broadcast') {
            await client.readMessages([m.key]);
            await client.sendMessage(from, { react: { text: "❤️", key: m.key } }, { statusJidList: [m.key.participant] });
        }

        if (text === ".menu") {
            const menu = `               . . . . . . . . . . . . . . .
               ⚠️  S Y S T E M   E R R O R  ⚠️
               . . . . . . . . . . . . . . .
           ╔═══════════════════════════╗
           ║   تشالاه فويد ٤٠٤  ║
           ║      [ CHALAH VOID 404 ]      ║
           ╚═══════════════════════════╝
           [ 📡 ] STATUS  :  E N C R Y P T E D
           [ 👤 ] USER    :  A U T H O R I Z E D

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚡  A U T O M A T I O N  [ ⚙️ ]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ◈  .ᴀᴜᴛᴏꜱᴇᴇɴ   (ꜱᴛᴀᴛᴜꜱ ᴠɪᴇᴡ)
      ◈  .ᴀᴜᴛᴏʟɪᴋᴇ   (ꜱᴛᴀᴛᴜꜱ ❤️)
      ◈  .ᴀɴᴛɪᴄᴀʟʟ   (ᴄᴀʟʟ ʀᴇජᴇᴄᴛ)

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🌐  D O W N L O A D E R  [ 📥 ]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ◈  .ᴘʟᴀʏ / .ᴠɪᴅᴇᴏ / .ᴛɪᴋᴛᴏᴋ

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             © 2026 VOID-404 PROJECT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            await client.sendMessage(from, { image: { url: logoUrl }, caption: menu });
        }
    });

    client.ev.on('call', async (call) => {
        if (call[0].status === 'offer') {
            await client.rejectCall(call[0].id, call[0].from);
            await client.sendMessage(call[0].from, { text: "⚠️ *VOID 404*: Calls are auto-rejected." });
        }
    });

    client.ev.on("creds.update", saveCreds);
}

app.listen(port);
startVoidBot();
