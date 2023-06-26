const { SlashCommandBuilder, EmbedBuilder, bold } = require('discord.js');
const { randomKey } = require('./../../config.json');
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
            option.setName('modifier')
            .setDescription('How much to add to the dice roll total')
            .setRequired(true)),
	async execute(interaction) {
		let dice = interaction.options.getString('dice', true).toLowerCase();
        let diceNum = 0;
        let diceType = 0;
        if (dice.charAt(0) == 'd') {
            dice = dice.substring(1);

            diceNum = 1;
            diceType = parseInt(dice);
        } else {
            const diceParams = dice.split('d');
            if (diceParams.length != 2) {
                await interaction.reply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
                return;
            }

            diceNum = parseInt(diceParams[0]);
            diceType = parseInt(diceParams[1]);
        }

        if (isNaN(diceNum) || isNaN(diceType)) {
            await interaction.reply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
            return;
        }

        if (diceNum < 1 || diceType < 2) {
            await interaction.reply(`${interaction.options.getString('dice', true)} is not a valid dice!`);
            return;
        }

        const modifier = interaction.options.getInteger('modifier');
        if (modifier < 0) {
            await interaction.reply(`${interaction.options.getInteger('modifier')} is not a valid modifier!`);
            return;
        }

        try {
            const randomResponse = await roc.generateIntegers(diceNum, 1, diceType);

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

            for (i; i < randomResponse.length; i++) {
                total += randomResponse[i];

                if (i % 5 == 0 && i != 0) {
                    if (i == 5) {
                        await embed.addFields({ name: 'Result:', value: resultString });
                    } else {
                        await embed.addFields({ name: '\u200B', value: resultString });
                    }
                    resultString = '';
                }

                if (randomResponse[i] == 1) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(9, '⠀') + ' ');
                    nat1 = true;
                } else if (randomResponse[i] == diceType) {
                    resultString = resultString.concat(bold(randomResponse[i].toString()).padEnd(9, '⠀') + ' ');
                    nat20 = true;
                } else {
                    resultString = resultString.concat(randomResponse[i].toString().padEnd(5, '⠀') + ' ');
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

            await interaction.reply({ embeds: [embed] });
            return;
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occured while rolling the dice.');
            return;
        }
	},
};