import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { addMoney } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('addcoin')
        .setDescription('Add coins to a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to give coins to')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of coins to add')
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
                'You cannot give coins to bots.'
            );
        }

        const result = await addMoney(client, guildId, targetUser.id, amount, 'wallet');

        if (!result.success) {
            throw createError(
                'Failed to add coins',
                ErrorTypes.DATABASE,
                result.error || 'Failed to add coins. Please try again later.'
            );
        }

        const embed = createEmbed({
            title: '✅ Coins Added',
            description: `${amount.toLocaleString()} coins have been added to ${targetUser}.`,
        })
            .addFields(
                {
                    name: '💵 New Wallet Balance',
                    value: `${result.newBalance.toLocaleString()} coins`,
                    inline: true,
                },
                {
                    name: '👮 Added By',
                    value: `${interaction.user}`,
                    inline: true,
                }
            )
            .setFooter({
                text: `Reward added by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        logger.info('[ECONOMY] Coins added using /addcoin', {
            admin: interaction.user.id,
            target: targetUser.id,
            amount,
            guildId
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
        });

    }, { command: 'addcoin' })
};
