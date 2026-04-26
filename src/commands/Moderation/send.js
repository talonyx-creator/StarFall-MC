import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

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

    async execute(interaction) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Send interaction defer failed', {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                commandName: 'send'
            });
            return;
        }

        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        createEmbed({
                            title: '❌ Permission Denied',
                            description: 'Only administrators can use this command.',
                            color: 'error'
                        })
                    ]
                });
            }

            const text = interaction.options.getString('text');
            const image = interaction.options.getAttachment('image');

            if (!text && !image) {
                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        createEmbed({
                            title: '⚠️ Missing Content',
                            description: 'Please provide text, image, or both.',
                            color: 'warning'
                        })
                    ]
                });
            }

            const payload = {};

            if (text) {
                payload.content = text;
            }

            if (image) {
                payload.files = [
                    {
                        attachment: image.url,
                        name: image.name || 'image.png'
                    }
                ];
            }

            await interaction.channel.send(payload);

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    createEmbed({
                        title: '✅ Message Sent',
                        description: 'The message was sent successfully through the bot.',
                        color: 'success'
                    })
                ]
            });

            logger.info('Message sent using /send', {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                channelId: interaction.channelId
            });

        } catch (error) {
            logger.error('Send command error:', error);

            try {
                return await InteractionHelper.safeReply(interaction, {
                    embeds: [
                        createEmbed({
                            title: 'System Error',
                            description: 'Could not send the message at this time.',
                            color: 'error'
                        })
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            } catch (replyError) {
                logger.error('Failed to send send-command error reply:', replyError);
            }
        }
    },
};
