// From https://discordjs.guide/creating-your-bot/event-handling.html#individual-event-files
const { Events } = require('discord.js');

// Sends a message to the console once the bot is logged in
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};