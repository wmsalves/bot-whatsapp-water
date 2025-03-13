const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const admin = require("firebase-admin");
require("dotenv").config(); // Certifique-se de carregar as variáveis de ambiente

// Verificação de variáveis de ambiente
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_ID || !process.env.FIREBASE_CLIENT_X509_CERT_URL) {
    console.error("⚠️ Erro: As variáveis de ambiente do Firebase não estão configuradas corretamente!");
    process.exit(1); // Encerra o bot se as variáveis não estiverem configuradas
}

if (!process.env.WA_AUTH_STATE_FILE) {
    console.error("⚠️ Erro: A variável de ambiente WA_AUTH_STATE_FILE não está configurada!");
    process.exit(1); // Encerra o bot se WA_AUTH_STATE_FILE não estiver configurada
}

if (!process.env.ALLOWED_GROUP_ID) {
    console.error("⚠️ Erro: A variável de ambiente ALLOWED_GROUP_ID não está configurada!");
    process.exit(1); // Encerra o bot se ALLOWED_GROUP_ID não estiver configurada
}

if (!process.env.ADMIN_USERS) {
    console.error("⚠️ Erro: A variável de ambiente ADMIN_USERS não está configurada!");
    process.exit(1); // Encerra o bot se ADMIN_USERS não estiver configurada
}

const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Corrige quebras de linha no private_key
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); // Referência ao Firestore
console.log('Firebase initialized');

// Função que inicia o bot
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(process.env.WA_AUTH_STATE_FILE || "auth"); // Usar variáveis de ambiente para o arquivo de autenticação
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Gera QR code no terminal
    });

    sock.ev.on("creds.update", saveCreds); // Atualiza as credenciais

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Gera o QR Code para ser escaneado
            console.log("QR Code gerado:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("🤖 Bot conectado!");
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("🔄 Tentando reconectar...");
                startBot();
            } else {
                console.log("❌ Bot desconectado. Faça login novamente.");
            }
        }
    });

    const allowedGroupId = process.env.ALLOWED_GROUP_ID; // Usar variáveis de ambiente para o ID do grupo permitido

    sock.ev.on("messages.upsert", async (msg) => {
        const message = msg.messages[0];
        if (!message?.message) return;

        const sender = message.key.remoteJid; // Identifica o remetente
        const isGroup = sender.endsWith("@g.us"); // Verifica se é um grupo
        const user = isGroup ? message.key.participant : sender;

        if (sender !== allowedGroupId) {
            return;  // Ignora mensagens de outros grupos
        }
    
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            "";
    
        if (!text) return;
        // Comando !agua <quantidade>
        if (text.startsWith("!agua")) {
            const amount = parseInt(text.split(" ")[1]);
            if (isNaN(amount)) return sock.sendMessage(sender, { text: "⚠️ Use: !agua 500" });
            
            const dailyRef = db.collection("agua_diario").doc(user);
            const weeklyRef = db.collection("agua_semanal").doc(user);
            const dailyData = (await dailyRef.get()).data() || { total: 0 };
            const weeklyData = (await weeklyRef.get()).data() || { total: 0 };
            
            await dailyRef.set({ total: dailyData.total + amount });
            await weeklyRef.set({ total: weeklyData.total + amount });
            
            sock.sendMessage(sender, { text: `💧 Adicionado ${amount}ml!\n🥤 Total diário: ${dailyData.total + amount}ml` });
        }
        // Comando !diminuir <quantidade>
        else if (text.startsWith("!diminuir")) {
            const amount = parseInt(text.split(" ")[1]);
            if (isNaN(amount)) return sock.sendMessage(sender, { text: "⚠️ Use: !diminuir 500" });
            
            const dailyRef = db.collection("agua_diario").doc(user);
            const weeklyRef = db.collection("agua_semanal").doc(user);
            const dailyData = (await dailyRef.get()).data() || { total: 0 };
            const weeklyData = (await weeklyRef.get()).data() || { total: 0 };
            
            await dailyRef.set({ total: Math.max(dailyData.total - amount, 0) });
            await weeklyRef.set({ total: Math.max(weeklyData.total - amount, 0) });
            
            sock.sendMessage(sender, { text: `💧 Removido ${amount}ml!\n🥤 Total diário: ${Math.max(dailyData.total - amount, 0)}ml` });
        }
        // Comando !consumo
        else if (text === "!consumo") {
            const dailyRef = db.collection("agua_diario").doc(user);
            const dailyData = (await dailyRef.get()).data();
            const total = dailyData ? dailyData.total : 0;
            sock.sendMessage(sender, { text: `🚰 Você bebeu ${total}ml hoje!` });
        }
        // Comando !rakingdiario
        else if (text === "!rankingdiario") {
            const users = await db.collection("agua_diario").orderBy("total", "desc").limit(10).get();
            let ranking = "🏆 Ranking Diário:\n";
            users.forEach((doc, index) => ranking += `${index + 1}. ${doc.id} - ${doc.data().total}ml\n`);
            sock.sendMessage(sender, { text: ranking });
        }
        // Comando !rankingsemanal
        else if (text === "!rankingsemanal") {
            const users = await db.collection("agua_semanal").orderBy("total", "desc").limit(10).get();
            let ranking = "🏆 Ranking Semanal:\n";
            users.forEach((doc, index) => ranking += `${index + 1}. ${doc.id} - ${doc.data().total}ml\n`);
            sock.sendMessage(sender, { text: ranking });
        }
        // Comando !limpardiaria
        else if (text === "!limpardiario") {
            await db.collection("agua_diario").get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            sock.sendMessage(sender, { text: "✅ Todos os dados diários foram apagados!" });
        }
        // Comando !limparsemanal
        else if (text === "!limparsemanal") {
            await db.collection("agua_semanal").get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            sock.sendMessage(sender, { text: "✅ Todos os dados semanais foram apagados!" });
        }
    });
}

startBot();
