import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { withErrorHandling } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message or image using the bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('Text to send')
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option
                .setName('image')
                .setDescription('Image to send')
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply({
                content: '❌ Only administrators can use this command.'
            });
        }

        const text = interaction.options.getString('text');
        const image = interaction.options.getAttachment('image');

        if (!text && !image) {
            return interaction.editReply({
                content: '⚠️ Please provide text, an image, or both.'
            });
        }

        const messageOptions = {};

        if (text) {
            messageOptions.content = text;
        }

        if (image) {
            messageOptions.files = [image.url];
        }

        await interaction.channel.send(messageOptions);

        return interaction.editReply({
            content: '✅ Message sent successfully.'
        });

    }, { command: 'send' })
};
