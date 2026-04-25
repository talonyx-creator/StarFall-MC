import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { removeMoney } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('removecoin')
        .setDescription('Remove coins from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to remove coins from')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of coins to remove')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = createEmbed({
                title: '❌ Permission Denied',
                description: 'Only members with Administrator permission can use this command.',
            });

            return InteractionHelper.safeEditReply(interaction, {
                embeds: [embed]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;

        if (targetUser.bot) {
            throw createError(
                'Bot user selected',
                ErrorTypes.VALIDATION,
                'You cannot remove coins from bots.'
            );
        }

        const result = await removeMoney(client, guildId, targetUser.id, amount, 'wallet');

        if (!result.success) {
            throw createError(
                'Failed to remove coins',
                ErrorTypes.DATABASE,
                result.error || 'Failed to remove coins.'
            );
        }

        const embed = createEmbed({
            title: '🗑️ Coins Removed',
            description: `${amount.toLocaleString()} coins have been removed from ${targetUser}.`,
        })
            .addFields(
                {
                    name: '💵 New Wallet Balance',
                    value: `${result.newBalance.toLocaleString()} coins`,
                    inline: true,
                },
                {
                    name: '👮 Removed By',
                    value: `${interaction.user}`,
                    inline: true,
                }
            )
            .setFooter({
                text: `Action by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        logger.info('[ECONOMY] Coins removed using /removecoin', {
            admin: interaction.user.id,
            target: targetUser.id,
            amount,
            guildId
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: 'removecoin' })
};
