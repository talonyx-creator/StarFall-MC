import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

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
        const deferred = await InteractionHelper.safeDefer(interaction, true);
        if (!deferred) return;

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = createEmbed({
                title: '❌ Permission Denied',
                description: 'Only members with Administrator permission can use this command.',
            });

            return InteractionHelper.safeEditReply(interaction, {
                embeds: [embed],
                ephemeral: true
            });
        }

        const text = interaction.options.getString('text');
        const image = interaction.options.getAttachment('image');

        if (!text && !image) {
            const embed = createEmbed({
                title: '⚠️ Missing Content',
                description: 'Please provide text, an image, or both.',
            });

            return InteractionHelper.safeEditReply(interaction, {
                embeds: [embed],
                ephemeral: true
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

        const embed = createEmbed({
            title: '✅ Message Sent',
            description: 'Your message has been sent successfully through the bot.',
        });

        logger.info('[BOT] Message sent using /send', {
            admin: interaction.user.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed],
            ephemeral: true
        });

    }, { command: 'send' })
};
