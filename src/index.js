import dotenv from "dotenv";
import { Client, GatewayIntentBits, Partials, ChannelType } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import config from "./constants/config.json" with { type: "json" };
import constants from "./constants/constants.json" with { type: "json" };

dotenv.config();

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
const ai = new GoogleGenAI({});

var detectChannel = null;
var detectGuild = null;
var userStatuses = {};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
});

/**
 * Connects to Gemini to generate a response
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

/**
 * Replies to user message through DM or Servers.
 *
 * Handles role handling in servers.
 */
client.on("messageCreate", async (message) => {
    // check if new message is from the user; avoids infinite
    // feedback loops
    if (message.author.bot) return;

    // behaviour differs if chatting through DMS or a server
    const channelType = message.channel.type;
    switch (channelType) {
        case constants.CHANNEL_TYPES.GUILD:

            // only reply if Nano is mentioned in the DM
            const reply = message.mentions.has(client.user);
            if (reply) {
                // Reserved keyword handling for bot commands
                if (message.content.indexOf("/role") == 0) {
                    if (message.content.includes("/role add")) { // give a role to a user
                        var rolePT = message.content.replace("/role add ", "")
                        var role = message.guild.roles.cache.find(role => role.name === rolePT)
                        if (!role) {
                            message.reply("That role doesn't exist")
                            return
                        }
                        var member = message.guild.members.cache.find(member => member.id === message.author.id)
                        member.roles.add(role)
                        message.reply("Okay! I added the \"" + role.name + "\" role for you :)")
                    } else if (message.content.includes("/role remove")) { // remove a role from a user
                        var rolePT = message.content.replace("/role remove ", "")
                        var role = message.guild.roles.cache.find(role => role.name === rolePT)
                        if (!role) {
                            message.reply("That role doesn't exist")
                            return
                        }
                        var member = message.guild.members.cache.find(member => member.id === message.author.id)
                        member.roles.remove(role)
                        message.reply("Okay! I removed the \"" + role.name + "\" role for you :)")
                    }
                } else {
                    // Generate a response by default
                    const response = await generateResponse(message);
                    message.reply(response.text);
                }
            }
 
            break;
        case constants.CHANNEL_TYPES.DM:
            // generate a response
            const response = await generateResponse(message);
            message.reply(response.text);
            break;
        default:
            console.error(`Channel type: ${channelType} unsupported.`);
            break;
    }
})

/**
 * Detects a user's activity status and DMs the user a witty comment
 * depending on the game they're playing
*/
client.on("presenceUpdate", async(oldMember, newMember) => {
    if((detectGuild != null) && (detectChannel != null)) {
        const guild = detectGuild
        const channel = detectChannel
        const member = newMember.member

        if (member.user.bot == false) {
            try { 
                if (member.guild = guild) {
                    const game = newMember.member.presence.activities[0].name.toLowerCase();
                    if(constants.GAMES.MID.includes(game)) {
                        if(userStatuses[member] == undefined) {
                            userStatuses[member] = ["", [0, 0]];
                            channel.send(`User <@${member.id}> is playing mid. Ban this man!`);
                        }
                    }
                }
            } catch (error) {
                userStatuses[member] = "Not Playing"
            }
        }
    }
    const member = newMember.member
    const game = newMember.member.presence.activities[0].name.toLowerCase();
    if(constants.GAMES.MID.includes(game)) {
        if(userStatuses[member] == undefined) {
            userStatuses[member] = ["", [0, 0]];
            member.user.send(`<@${member.id}> I see you're playing mid... Consider this a warning!`)
        }
    } else if (constants.GAMES.BASED.includes(game)) {
        if(userStatuses[member] == undefined) {
            userStatuses[member] = ["", [0, 0]];
            member.user.send(`You're playing <${game}>? Based.`)
        }
    }
})

client.login(process.env.DISCORD_API_KEY)
