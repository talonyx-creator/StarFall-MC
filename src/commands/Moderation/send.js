import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { withErrorHandling } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send text or image using the bot')
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

        const text = interaction.options.getString('text');
        const image = interaction.options.getAttachment('image');

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply({
                content: '❌ Only administrators can use this command.'
            });
        }

        if (!text && !image) {
            return interaction.editReply({
                content: '⚠️ Please provide text, image, or both.'
            });
        }

        const payload = {};

        if (text) payload.content = text;

        if (image) {
            payload.files = [{
                attachment: image.url,
                name: image.name || 'image.png'
            }];
        }

        await interaction.channel.send(payload);

        return interaction.editReply({
            content: '✅ Message sent successfully.'
        });

    }, { command: 'send' })
};
