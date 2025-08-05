# NanoBot

## Overview 

<img src="src/assets/images/nano.gif"/>

I created this bot in response to overhearing one of my friends playing a game that I didn't particularly like. 
NanoBot scans the gaming activities of the server that they're in and identifies what I consider to be a 'cringe' 
game. NanoBot then sends a direct message to the user, giving them a stern warning for next time.

Moreover, NanoBot has the ability to detect messages and add or remove roles for any user in the server."

## Getting Started

If this is your first time creating a Discord bot, you may want to begin by installing a few things.

To start, you should install Node (specifically version 16). You can download it from this link: 
https://nodejs.org/en/download/

Next, create the directory where you want your bot to be located and run the command `npm install` 
in the same directory.

Finally, you can install the necessary libraries by running the command `npm install discord.js dotenv openai`
in the same directory.

The dotenv library is used to read from .env files that store crucial information like API keys. In order for
your bot to properly work, an env file must be made in the following format

```
API_KEY:"KEY GOES HERE"
BOT_KEY:"OTHER KEY HERE"
```

Once completed, you can paste the index.js file containing the code and replace the placeholder token with your 
bot's token.

NOTE: If you plan to create a repository with your token in the index file, make sure to set it to 'private'.

Congratulations! You now have a bot. However, to run it, you need to host it on your server. To learn more about 
how to host and run your bot, I recommend watching this video:

https://youtu.be/1jtAWZK3Bbk

## Commands

### -n add (role)

Adds a role to the user

### -n remove (role)

Removes a role from a user


