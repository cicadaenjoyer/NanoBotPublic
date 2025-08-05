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
import { GoogleGenAI } from "@google/genai";
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
const ai = new GoogleGenAI({});

// Used for tracking presence updates
var detectChannel = null;
var detectGuild = null;
var userStatuses = {};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

/**
 * Generates a response using Gemini based on the provided message.
 *
 * @async
 * @function generateResponse
 * @param {Object} message - The message object containing the content to process.
 * @param {string} message.content - The content to send to the AI model.
 * @returns {Promise<Object>} The AI-generated response.
 */
const generateResponse = async (message) => {
    return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message.content,
        config: {
            systemInstruction: config.PERSONALITY,
            thinkingConfig: {
                thinkingBudget: 0,
            },
        }
    });
};

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
                    message.reply(response.text);
                }
            }
            break;

        case constants.CHANNEL_TYPES.DM:
            // Always reply to DMs using Gemini
            const response = await generateResponse(message);
            const text = await response.response.text();
            message.reply(text);
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

// Login to Discord with bot token
client.login(process.env.DISCORD_API_KEY);
