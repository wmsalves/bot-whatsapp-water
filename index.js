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
            const userRef = db.collection("agua").doc(user);
            const userData = (await userRef.get()).data() || { total: 0 };
            await userRef.set({ total: userData.total + amount });

            sock.sendMessage(sender, { text: `💧 Adicionado ${amount}ml!\n🥤 Total: ${userData.total + amount}ml` });
        }
        // Comando !consumo
        else if (text === "!consumo") {
            const userRef = db.collection("agua").doc(user);
            const userData = (await userRef.get()).data();
            const total = userData ? userData.total : 0;
            sock.sendMessage(sender, { text: `🚰 Você bebeu ${total}ml hoje!` });
        }
        // Comando !ranking
        else if (text === "!ranking") {
            const users = await db.collection("agua").orderBy("total", "desc").limit(10).get();
            if (users.empty) {
                return sock.sendMessage(sender, { text: "📊 Nenhum consumo registrado ainda!" });
            }
        
            let ranking = "🏆 Ranking de Consumo:\n";
            users.forEach((doc, index) => {
                const userData = doc.data();
                const total = userData ? userData.total : 0;
        
                if (isNaN(total)) {
                    console.log(`Erro no total do usuário ${doc.id}: ${total}`);
                    return;
                }
        
                ranking += `${index + 1}. ${doc.id} - ${total}ml\n`;
            });
            sock.sendMessage(sender, { text: ranking });
        }
        else if (text === "!deletar") {
            const adminUsers = process.env.ADMIN_USERS?.split(","); // Lista de admins através de variável de ambiente
            if (!adminUsers.includes(user)) {
                return sock.sendMessage(sender, { text: "⚠️ Você não tem permissão para executar este comando!" });
            }
        
            // Limpa os dados de todos os usuários na coleção "agua"
            const usersRef = db.collection("agua");
            const snapshot = await usersRef.get();
        
            if (snapshot.empty) {
                return sock.sendMessage(sender, { text: "📊 Nenhum dado encontrado para limpar!" });
            }
        
            snapshot.forEach(async (doc) => {
                await usersRef.doc(doc.id).set({ total: 0 }, { merge: true });
            });
        
            sock.sendMessage(sender, { text: "✅ Todos os dados de consumo foram limpos!" });
        }
    });
}

startBot();
