const Discord = require("discord.js")
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = "TOKENGOESHERE"

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
})

var midGames = ["umineko when they cry - question arcs", "umineko when they cry - answer arcs", "ys: memories of celceta"]
var basedGames = ["ys origin", "final fantasy ix"]

var statuses = {}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
})
var detectChannel = null
var detectGuild = null

client.on("messageCreate", (message) => {
    try {
        const guild = client.guilds.cache.get(message.guild.id); 
    } catch(TypeError) {
        console.log("Something went wrong!")
    }
    const channel = message.channel;
    if (message.content == "hi") {
        message.reply("Hello!")
    } else if (message.content == "detectHere") {
        detectChannel = message.channel
        detectGuild = client.guilds.cache.get(message.guild.id)
        message.reply("Okay! I've updated the detect channel/guild for you!")
    }
})

client.on("presenceUpdate", async(oldMember, newMember) => {
    if((detectGuild != null) && (detectChannel != null)) {
        const guild = detectGuild
        const channel = detectChannel
        const member = newMember.member

        if (member.user.bot == false) {
            try { 
                if (member.guild = guild) {
                    const game = newMember.member.presence.activities[0].name.toLowerCase();
                    if(midGames.includes(game)) {
                        if(statuses[member] == undefined) {
                            statuses[member] = ["", [0, 0]];
                            channel.send(`User <@${member.id}> is playing mid. Ban this man!`);
                        }
                    }
                }
            } catch (error) {
                statuses[member] = "Not Playing"
            }
        }
    }
    const member = newMember.member
    const game = newMember.member.presence.activities[0].name.toLowerCase();
    if(midGames.includes(game)) {
        if(statuses[member] == undefined) {
            statuses[member] = ["", [0, 0]];
            member.user.send(`<@${member.id}> I see you're playing mid... Consider this a warning!`)
        }
    } else if (basedGames.includes(game)) {
        if(statuses[member] == undefined) {
            statuses[member] = ["", [0, 0]];
            member.user.send(`You're playing <${game}>? Based.`)
        }
    }
})

client.login(TOKEN)