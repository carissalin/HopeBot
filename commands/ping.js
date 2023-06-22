// Taken from https://discordjs.guide/creating-your-bot/slash-commands.html#individual-command-files
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong!'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};