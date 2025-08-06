/**
 * Discord Bot with Gemini AI Integration.
 *
 * This bot connects to Discord and listens for messages and presence updates.
 * It responds to direct mentions in both servers and DMs, handling simple 
 * commands like role assignment, and uses Gemini to generate conversational replies.
 * Additionally, it monitors user activity (e.g., games being played) and sends
 * direct or channel-based responses based on specific triggers.
 */

import dotenv from "dotenv";
import { Client, GatewayIntentBits, Partials, ChannelType } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import { existsSync } from "fs";
import config from "./constants/config.json" with { type: "json" };
import constants from "./constants/constants.json" with { type: "json" };

dotenv.config();

// Create a new Discord client with required intents and partials
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

// Initialize Gemini AI client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Misc. Constants
const CONV_HIST_PATH = `src/memory/conv_history.json`;

// Chat history
var chatHistory = [];

// Used for tracking presence updates
var detectChannel = null;
var detectGuild = null;
var userStatuses = {};

/**
 * Generates a response using Gemini based on the provided message.
 *
 * Also logs user and bot message to the chat history with a timestamp
 *
 * @async
 * @function generateResponse
 * @param {Object} message - The message object containing the content to process.
 * @returns {Promise<Object>} The AI-generated response.
 */
const generateResponse = async (message) => {
    // Convert chat history to a support format
    var geminiHistory = chatHistory.flatMap(entry => [
        {
            role: "user",
            parts: [
                {
                    text: entry.user_message
                }
            ]
        },
        {
            role: "model",
            parts: [
                {
                    text: entry.bot_message
                }
            ]
        }
    ]);

    // Start a new chat with full history and a system personality
    const chat = model.startChat({
        history: geminiHistory,
        generationConfig: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 1000
        },
        systemInstruction: {
            role: "system",
            parts: [{ text: config.PERSONALITY }]
        }
    });

    // Get the AI response
    const response = await chat.sendMessage(message.content);
    const responseText = response.response.text();

    const timestamp = Date.now();

    chatHistory.push({
        "timestamp": timestamp,
        "user_message": message.content,
        "bot_message": response.response.text()
    });

    return responseText;
};

/**
 * Loads chat history file into a local variable.
 *
 * @async
 * @function localChatHistory
 * @param {string} filepath - The file path leading to the chat history file.
 * @returns {Object} An array containing user/bot conversation history.
 */
const loadChatHistory = async (filepath) => {
    try {
        const chatHistory = await fs.readFile(filepath, 'utf8');
        return JSON.parse(chatHistory);
    } catch (err) {
        // Chat history doesn't exist
        if (err.code === "ENOENT") {
            // Extract the directory path from the full filepath
            const directory = filepath.substring(0, filepath.lastIndexOf('/'));

            // Ensure the directory exists recursively before writing the file
            if (directory) {
                try {
                    await fs.mkdir(directory, { recursive: true });
                } catch (mkdirErr) {
                    console.error("Failed to create directory:", mkdirErr);
                    throw mkdirErr;
                }
            }

            // Write an empty JSON array to the new file
            await fs.writeFile(filepath, "[]", "utf8");
            return [];
        } else {
            console.error("Failed to load memory: ", err);
            throw err;
        }
    }
};

/**
 * Saves chat history into a JSON at a given path.
 * @async
 * @function saveChatHistory
 * @param {string} filepath - The file path leading to the chat history file.
 * @param {string} data - The local chat history.
 */
const saveChatHistory = async (filepath, data) => {
    try {
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf8");
        console.log("Chat history saved.");
    } catch (err) {
        console.error("Failed to save chat history:", err);
    }
};

/**
 * Calls upon save chat history function for smooth shutdown.
 * @async
 * @function gracefulShutdown
 * @param {string} data - The local chat history.
 */
const gracefulShutdown = async () => {
    console.log("Shutting down...");
    await saveChatHistory(CONV_HIST_PATH, chatHistory);
    process.exit(0);
};

// Loads chat history into local memory on startup
client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    chatHistory = await loadChatHistory(CONV_HIST_PATH);
});

// Listens for new messages
client.on("messageCreate", async (message) => {
    // Ignore messages from bots to prevent loops
    if (message.author.bot) return;

    const channelType = message.channel.type;

    switch (channelType) {
        case constants.CHANNEL_TYPES.GUILD:
            // Only respond if the bot is directly mentioned
            const reply = message.mentions.has(client.user);
            if (reply) {
                // Handle role commands
                if (message.content.indexOf("/role") === 0) {
                    if (message.content.includes("/role add")) {
                        // Add a role to the user
                        const rolePT = message.content.replace("/role add ", "");
                        const role = message.guild.roles.cache.find(role => role.name === rolePT);
                        if (!role) {
                            message.reply("That role doesn't exist");
                            return;
                        }
                        const member = message.guild.members.cache.find(member => member.id === message.author.id);
                        member.roles.add(role);
                        message.reply(`Okay! I added the "${role.name}" role for you :)`);
                    } else if (message.content.includes("/role remove")) {
                        // Remove a role from the user
                        const rolePT = message.content.replace("/role remove ", "");
                        const role = message.guild.roles.cache.find(role => role.name === rolePT);
                        if (!role) {
                            message.reply("That role doesn't exist");
                            return;
                        }
                        const member = message.guild.members.cache.find(member => member.id === message.author.id);
                        member.roles.remove(role);
                        message.reply(`Okay! I removed the "${role.name}" role for you :)`);
                    }
                } else {
                    // No command? Just generate an AI reply
                    const response = await generateResponse(message);
                    message.reply(response);
                }
            }
            break;

        case constants.CHANNEL_TYPES.DM:
            // Always reply to DMs using Gemini
            const response = await generateResponse(message);
            message.reply(response);
            break;

        default:
            console.error(`Channel type: ${channelType} unsupported.`);
            break;
    }
});

/**
 * Detects user activity changes and sends witty responses based on
 * what game they are playing.
 *
 * Triggers when users start playing certain games marked as "MID" or "BASED".
 */
client.on("presenceUpdate", async (oldMember, newMember) => {
    const member = newMember.member;

    // Send presence updates to a designated guild/channel if set
    if ((detectGuild != null) && (detectChannel != null)) {
        const guild = detectGuild;
        const channel = detectChannel;

        if (!member.user.bot) {
            try {
                if (member.guild === guild) {
                    const game = member.presence.activities[0].name.toLowerCase();
                    if (constants.GAMES.MID.includes(game)) {
                        if (userStatuses[member] === undefined) {
                            userStatuses[member] = ["", [0, 0]];
                            channel.send(`User <@${member.id}> is playing mid. Ban this man!`);
                        }
                    }
                }
            } catch (error) {
                userStatuses[member] = "Not Playing";
            }
        }
    }

    // DM users directly based on the game they're playing
    const game = member.presence.activities[0]?.name?.toLowerCase();
    if (!game) return;

    if (constants.GAMES.MID.includes(game)) {
        if (userStatuses[member] === undefined) {
            userStatuses[member] = ["", [0, 0]];
            member.user.send(`<@${member.id}> I see you're playing mid... Consider this a warning!`);
        }
    } else if (constants.GAMES.BASED.includes(game)) {
        if (userStatuses[member] === undefined) {
            userStatuses[member] = ["", [0, 0]];
            member.user.send(`You're playing <${game}>? Based.`);
        }
    }
});

// Handling shutdown events
process.on("SIGINT", gracefulShutdown);    // Ctrl+C
process.on("SIGTERM", gracefulShutdown);   // Heroku, etc.

// Login to Discord with bot token
client.login(process.env.DISCORD_API_KEY);
