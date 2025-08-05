import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import config from "./constants/config.json" with { type: "json" };
import constants from "./constants/constants.json" with { type: "json" };

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});
const ai = new GoogleGenAI({});

var userStatuses = {}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
})
var detectChannel = null
var detectGuild = null

client.on("messageCreate", async (message) => {
    // check if new message is from the user; avoids infinite
    // feedback loops
    if (message.author.bot) return;

    try {
        const guild = client.guilds.cache.get(message.guild.id); 
    } catch(TypeError) {
        console.log("Something went wrong!")
    }
    const channel = message.channel;

    // generating a response
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message.content,
        config: {
            systemInstruction: config.PERSONALITY,
            thinkingConfig: {
                thinkingBudget: 0,
            },
        }
    });
    message.reply(response.text)

    if (message.content.includes("-n add ")) {
        var rolePT = message.content.replace("-n add ", "")
        var role = message.guild.roles.cache.find(role => role.name === rolePT)
        if (!role) {
            message.reply("That role doesn't exist")
            return
        }
        var member = message.guild.members.cache.find(member => member.id === message.author.id)
        member.roles.add(role)
        message.reply("Okay! I added the \"" + role.name + "\" role for you :)")
    } else if (message.content.includes("-n addAll ")) {
        message.reply("I'm working on it!")
    } else if (message.content.includes("-n remove ")) {
        var rolePT = message.content.replace("-n remove ", "")
        var role = message.guild.roles.cache.find(role => role.name === rolePT)
        if (!role) {
            message.reply("That role doesn't exist")
            return
        }
        var member = message.guild.members.cache.find(member => member.id === message.author.id)
        member.roles.remove(role)
        message.reply("Okay! I removed the \"" + role.name + "\" role for you :)")
    } else if (message.content.includes("-n")) {
        message.reply("You messed up boy!")
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
