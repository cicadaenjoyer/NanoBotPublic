# NanoBot

## Overview 

<img src="src/assets/images/nano.gif"/>

I initially created this bot as an inside joke amongst friends, but I decided to further expand it into a 
virtual AI companion. NanoBot is able to talk with the user via direct messaging (DM) and servers through
direct mentioning.

Nanobot is also equipped with basic commands such as adding and deleting roles from users in a server.

## Getting Started

Run `yarn install` in the root of the project to install all the packages. Once done, run `yarn start` to
start the discord bot locally.

There are example config files found throughout the project ending with the file extension `.example`. These
config files are used to define the bot's personality and API tokens. You will need to go through these files
and fill in the correct information. Once done, you can remove the `.example` extension.

If you want to learn how to setup a bot and/or get API keys, I recommend watching this video:

https://youtu.be/1jtAWZK3Bbk

## Commands

### /role add (role)

Adds a role to the user

### /role remove (role)

Removes a role from a user
