const { SlashCommandBuilder, EmbedBuilder, bold } = require('discord.js');
const { randomKey } = require('../config.json');
const randomOrgClient = require('@randomorg/core').RandomOrgClient;
const roc = new randomOrgClient(randomKey);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rolldis')
		.setDescription('Rolls dice with disadvantage.')
        .addStringOption(option =>
            option.setName('dice')
            .setDescription('The dice type, and how many to roll. Defaults to 2 dice. e.g. "d20", "4d8"')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('modifier')
            .setDescription('How much to add to the worst dice roll')
            .setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply();

		let dice = interaction.options.getString('dice', true).toLowerCase();
        let diceNum = 0;
        let diceType = 0;

        // Checks if the roll is for a single dice. e.g. "d20" "d8"
        if (dice.charAt(0) == 'd') {
            dice = dice.substring(1);

            diceNum = 2;
            diceType = parseInt(dice);
        } else {
            // Checks if the roll is for multiple dice
            const diceParams = dice.split('d');
            if (diceParams.length != 2) {
                await interaction.editReply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
                return;
            }

            diceNum = parseInt(diceParams[0]);
            diceType = parseInt(diceParams[1]);
        }

        if (isNaN(diceNum) || isNaN(diceType)) {
            await interaction.editReply(`\:x: ${interaction.options.getString('dice', true)} is not a valid dice, please use the format xdx when inputting the command (e.g. 2d20, 4d8).`);
            return;
        }

        // Min amount of dice is 2 and it must be at least a d2
        if (diceNum < 2 || diceType < 2) {
            await interaction.editReply(`\:x: ${interaction.options.getString('dice', true)} is not a valid dice, you must have at least 2 dice with 2 faces.`);
            return;
        }

        if (diceNum > 100) {
            await interaction.editReply(`\:x: ${interaction.options.getString('dice', true)} is not a valid, the max amount of dice that can be rolled is 100.`);
            return;
        }

        // Negative modifiers are not allowed
        const modifier = interaction.options.getInteger('modifier');
        if (modifier < 0) {
            await interaction.editReply(`\:x: ${interaction.options.getInteger('modifier')} is not a valid modifier, modifiers must be 0 or a positive number.`);
            return;
        }

        try {
            // Generate integers from random.org
            const randomResponse = await roc.generateIntegers(diceNum, 1, diceType);

            // Format in an embed for prettier viewing
            const embed = await new EmbedBuilder()
            .setColor(0xde2c42)
            .setAuthor({ name: 'Disadvantage Roll', iconURL: 'https://cdn.discordapp.com/attachments/1123028376219811853/1123028406947303444/red_dice.png' });

            if (modifier > 0) {
                await embed.setDescription(`You rolled with disadvantage using ${diceNum} d${diceType}s + ${modifier}`);
            } else {
                await embed.setDescription(`You rolled with disadvantage using ${diceNum} d${diceType}s`);
            }

            let nat1 = 0;
            let nat20 = 0;
            let resultString = '';
            let i = 0;
            let min = Infinity;

            // Adds rows to the embed based on how many dice results were retrieved
            for (i; i < randomResponse.length; i++) {
                if (randomResponse[i] < min) {
                    min = randomResponse[i];
                }

                // Displays max 5 results per row
                if (i % 5 == 0 && i != 0) {
                    if (i == 5) {
                        await embed.addFields({ name: 'Rolls:', value: resultString });
                    } else {
                        await embed.addFields({ name: '\u200B', value: resultString });
                    }
                    resultString = '';
                }

                if (randomResponse[i] == 1) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(7, '⠀') + '⠀');
                    nat1 += 1;
                } else if (randomResponse[i] == diceType) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(7, '⠀') + '⠀');
                    nat20 += 1;
                } else {
                    resultString = resultString.concat(randomResponse[i].toString().padEnd(3, '⠀') + '⠀');
                }
            }

            if (i <= 5) {
                await embed.addFields({ name: 'Rolls:', value: resultString });
            } else {
                await embed.addFields({ name: '\u200B', value: resultString });
            }

            if (modifier == 0) {
                await embed.addFields({ name: 'Result:', value: `${min}` });
            } else {
                await embed.addFields({ name: 'Result:', value: `${min} + ${modifier} = **${min + modifier}**` });
            }
            
            if (nat1 == diceNum) {
                embed.setFooter({ text: 'Now that\'s just unfortunate...' });
            } else if (nat20 == diceNum) {
                embed.setFooter({ text: 'I guess it didn\'t matter that you had disadvantage.' });
            } else if (nat1 > 0) {
                embed.setFooter({ text: 'Unfortunately, you got a 1...' });
            } else if (nat20 > 0) {
                embed.setFooter({ text: 'You missed out on a max roll, too bad!' });
            }
            
            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occured while rolling the dice.');
            return;
        }
	},
};