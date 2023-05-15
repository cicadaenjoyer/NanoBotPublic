# NanoBot

## Overview 

<img src="/images/nano.gif"/>
This is a bot that I made as a response to hearing one of my friends playing a game 
I wasn't really fond of.

NanoBot looks through the game activity of whatever server they're in and detects what 
I think is a "cringe" game. Nano will dm the user giving them a stern warning for next time.

But wait, there's more!

NanoBot is able to detect messages and add/remove roles to any user in the server

## Getting Started

If this is your first time making a bot for Discord, you would want to start by installing a couple things

Start by installing **Node** (specifically v16). You can install it from here: `https://nodejs.org/en/download/`

Next, create the directory where you want your bot to reside in and run `npm install` in the same directory.

Finally, install the **Discord.JS** by running the following command in the same directory `npm i discord.js`

From here, you can paste the index.js file that contains the code we care about and replace the placeholder 
token with your own bot's token.

**NOTE**
**If you're planning on making a repo with your token in your index file, make sure to set it to 'private'**

You now have a bot!....kinda. There are tons of videos on how you can host the bot in your server and run it,
I recommend watching this video: 

`https://youtu.be/1jtAWZK3Bbk`

## Commands

### -n add <role>

Adds a role to the user

### -n remove <role>

Removes a role from a user


