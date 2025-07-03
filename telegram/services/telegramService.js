const {TelegramClient} = require("telegram");
const {StringSession} = require("telegram/sessions");
const {NewMessage} = require("telegram/events");
const readline = require('readline');
const sessionService = require('./sessionService');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question
const input = {
    text: (question) => new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    })
};

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;

// Client state
let client = null;
let isInitialized = false;
let isConnecting = false;

/**
 * Initialize the Telegram client
 * @returns {Promise<TelegramClient>} The initialized client
 */
async function init() {
    if (isConnecting) {
        console.log("Client initialization already in progress...");
        // Wait for initialization to complete
        while (isConnecting) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return client;
    }

    isConnecting = true;

    try {
        console.log("Initializing Telegram client...");

        // Try to get session from persistent storage first
        let sessionString = sessionService.getSession();

        // Fall back to environment variable if no saved session
        if (!sessionString) {
            sessionString = process.env.TELEGRAM_SESSION || "";
            console.log("Using session from environment variable");
        } else {
            console.log("Using saved session from storage");
        }

        const stringSession = new StringSession(sessionString);

        // Create a new client instance
        client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });

        // Start the client
        await client.start({
            phoneNumber: process.env.PHONE_NUMBER,
            password: async () => await input.text("Password: "),
            phoneCode: async () => await input.text("Code: "),
            onError: (err) => console.error("Client initialization error:", err),
        });

        console.log("You are now connected to Telegram.");

        // Save the session for future use
        const savedSession = client.session.save();
        console.log("Session string:", savedSession);
        sessionService.saveSession(savedSession);

        // Setup message listener
        setupMessageListener();

        await new Promise(resolve => setTimeout(resolve, 1000));

        isInitialized = true;
        console.log("Telegram client initialized successfully");

        return client;
    } catch (error) {
        console.error("Failed to initialize Telegram client:", error);
        throw error;
    } finally {
        isConnecting = false;
    }
}

/**
 * Ensure the client is connected before performing operations
 * @returns {Promise<TelegramClient>} The connected client
 */
async function ensureConnected() {
    if (!client || !isInitialized) {
        return await init();
    }

    try {
        if (!client.connected) {
            console.log("Client disconnected, reconnecting...");
            await client.connect();
        }
        return client;
    } catch (error) {
        console.error("Error reconnecting client:", error);
        // If reconnection fails, try to reinitialize
        return await init();
    }
}

/**
 * Setup message listener for Telegram messages
 */
let messageResolver = null;
let messagePromise = null;
function setupMessageListener() {
    if (!client) return;

    client.addEventHandler(async (event) => {
        const message = event.message;

        try {
            // Get sender and chat information
            const sender = await message.getSender();
            const chat = await message.getChat();

            // console.log("=== NUOVO MESSAGGIO ===");
            // console.log("Da:", sender.username || sender.firstName || sender.id);
            // console.log("Chat:", chat.title || chat.username || chat.id);
            // console.log("Messaggio:", message.text);
            // console.log("Data:", new Date(message.date * 1000));
            // console.log("========================");

            if (messageResolver) {
                console.log("Resolving message...");
                messageResolver(message);
                console.log("Message resolved");
                messageResolver = null;
                messagePromise = null;
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    }, new NewMessage({chats: ['@SpacoBot']}));
}


function getClient() {
    return client;
}


async function spacoCall(message) {
    try {
        // Ensure client is connected before sending message
        await ensureConnected();

        console.log(`Sending message to SpacoBot: ${message}`);
        await client.sendMessage("@SpacoBot", {message: message});
        console.log("Message sent successfully");

        // Create new promise for awaiting response
        messagePromise = new Promise(resolve => {
            messageResolver = resolve;
        });

        const receivedMessage = await messagePromise;
        const result = receivedMessage.message;
        console.log("Message received", result);
        
        return result; // ← Aggiungi questo return!
        
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

module.exports = {
    spacoCall
}