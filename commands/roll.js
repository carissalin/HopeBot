const { SlashCommandBuilder, EmbedBuilder, bold } = require('discord.js');
const { randomKey } = require('../config.json');
const randomOrgClient = require('@randomorg/core').RandomOrgClient;
const roc = new randomOrgClient(randomKey);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Rolls a dice.')
        .addStringOption(option =>
            option.setName('dice')
            .setDescription('The dice type, and how many to roll. e.g. "1d20", "4d8"')
            .setRequired(true))
        .addIntegerOption(option =>
            // TODO: Ask friends if they prefer this to be set to optional
            option.setName('modifier')
            .setDescription('How much to add to the dice roll total')
            .setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply();

		let dice = interaction.options.getString('dice', true).toLowerCase();
        let diceNum = 0;
        let diceType = 0;

        // Checks if the roll is for a single dice. e.g. "d20" "d8"
        if (dice.charAt(0) == 'd') {
            dice = dice.substring(1);

            diceNum = 1;
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
            await interaction.editReply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
            return;
        }

        // Min amount of dice is 1 and it must be at least a d2
        if (diceNum < 1 || diceType < 2) {
            await interaction.editReply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
            return;
        }

        // Negative modifiers are not allowed
        const modifier = interaction.options.getInteger('modifier');
        if (modifier < 0) {
            await interaction.editReply(`${interaction.options.getInteger('modifier')} is not a valid modifier!`);
            return;
        }

        try {
            // Generate integers from random.org
            const randomResponse = await roc.generateIntegers(diceNum, 1, diceType);

            // Format in an embed for prettier viewing
            const embed = await new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({ name: 'Dice Roll', iconURL: 'https://www.pngall.com/wp-content/uploads/2016/04/Dice-PNG.png' });

            if (diceNum == 1) {
                if (modifier > 0) {
                    await embed.setDescription(`You rolled a d${diceType} + ${modifier}`);
                } else {
                    await embed.setDescription(`You rolled a d${diceType}`);
                }
            } else if (modifier > 0) {
                await embed.setDescription(`You rolled ${diceNum} d${diceType}s + ${modifier}`);
            } else {
                await embed.setDescription(`You rolled ${diceNum} d${diceType}s`);
            }

            let nat1 = false;
            let nat20 = false;
            let resultString = '';
            let i = 0;
            let total = 0;

            // Adds rows to the embed based on how many dice results were retrieved
            for (i; i < randomResponse.length; i++) {
                total += randomResponse[i];

                // Displays max 5 results per row
                if (i % 5 == 0 && i != 0) {
                    if (i == 5) {
                        await embed.addFields({ name: 'Result:', value: resultString });
                    } else {
                        await embed.addFields({ name: '\u200B', value: resultString });
                    }
                    resultString = '';
                }

                if (randomResponse[i] == 1) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(7, '⠀') + '⠀');
                    nat1 = true;
                } else if (randomResponse[i] == diceType) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(7, '⠀') + '⠀');
                    nat20 = true;
                } else {
                    resultString = resultString.concat(randomResponse[i].toString().padEnd(3, '⠀') + '⠀');
                }
            }

            if (i <= 5) {
                await embed.addFields({ name: 'Result:', value: resultString });
            } else {
                await embed.addFields({ name: '\u200B', value: resultString });
            }

            if (modifier > 0) {
                await embed.addFields({ name: 'Total:', value: `${total} + ${modifier} = **${total + modifier}**` });
            } else {
                await embed.addFields({ name: 'Total:', value: total.toString() });
            }

            if (nat1 && nat20) {
                embed.setFooter({ text: 'Looks like you got a mix of good and bad rolls.' });
            } else if (nat1) {
                embed.setFooter({ text: 'You got a 1, that\'s rather unfortunate...' });
            } else if (nat20) {
                embed.setFooter({ text: 'Congrats, you got the max roll!' });
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