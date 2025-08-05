import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

var midGames = ["umineko when they cry - question arcs", "umineko when they cry - answer arcs", "ys: memories of celceta"]
var basedGames = ["ys origin", "final fantasy ix"]

var statuses = {}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
})
var detectChannel = null
var detectGuild = null

client.on("messageCreate", async (message) => {
    try {
        const guild = client.guilds.cache.get(message.guild.id); 
    } catch(TypeError) {
        console.log("Something went wrong!")
    }
    const channel = message.channel;

    switch (message.content) {
        case "hi":
            message.reply("Hello!")
            return
        case "detectHere":
            detectChannel = message.channel
            detectGuild = client.guilds.cache.get(message.guild.id)
            message.reply("Okay! I've updated the detect channel/guild for you!")
            return
        case "a":
            const guild = client.guilds.cache.get(message.guild.id)
            console.log(guild.members)
            guild.members.addRole('1064374566564134922')
            message.reply("Done!")
            return 
        default:
            break
    }

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: "Nano is talking wit ChatGPT rn..."},
                {role: "user", content: message.content}
            ]
        })

        const content = response.data.choices[0].message
        return message.reply(content)
    } catch (e) {
        return message.reply("ChatGPT errored out! Sorry!")
    }

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

client.login(process.env.DISCORD_API_KEY)
