import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { getEconomyData, getMaxBankCapacity, updateEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription("Check balance or add coins")

        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription("Check your or someone else's balance")
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to check balance for')
                        .setRequired(false)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add coins to a user')
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
                )
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (subcommand === 'check') {
            const targetUser = interaction.options.getUser('user') || interaction.user;

            logger.debug(`[ECONOMY] Balance check for ${targetUser.id}`, {
                userId: targetUser.id,
                guildId
            });

            if (targetUser.bot) {
                throw createError(
                    "Bot user queried for balance",
                    ErrorTypes.VALIDATION,
                    "Bots don't have an economy balance."
                );
            }

            const userData = await getEconomyData(client, guildId, targetUser.id);

            if (!userData) {
                throw createError(
                    "Failed to load economy data",
                    ErrorTypes.DATABASE,
                    "Failed to load economy data. Please try again later.",
                    { userId: targetUser.id, guildId }
                );
            }

            const maxBank = getMaxBankCapacity(userData);

            const wallet = typeof userData.wallet === 'number' ? userData.wallet : 0;
            const bank = typeof userData.bank === 'number' ? userData.bank : 0;

            const embed = createEmbed({
                title: `💰 ${targetUser.username}'s Balance`,
                description: `Here is the current financial status for ${targetUser.username}.`,
            })
                .addFields(
                    {
                        name: "💵 Cash",
                        value: `$${wallet.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "🏦 Bank",
                        value: `$${bank.toLocaleString()} / $${maxBank.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "💎 Total",
                        value: `$${(wallet + bank).toLocaleString()}`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            logger.info(`[ECONOMY] Balance retrieved`, {
                userId: targetUser.id,
                wallet,
                bank
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [embed]
            });
        }

        if (subcommand === 'add') {
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

            if (targetUser.bot) {
                throw createError(
                    "Bot user selected",
                    ErrorTypes.VALIDATION,
                    "You cannot give coins to bots."
                );
            }

            const userData = await getEconomyData(client, guildId, targetUser.id);

            if (!userData) {
                throw createError(
                    "Failed to load economy data",
                    ErrorTypes.DATABASE,
                    "Failed to load economy data. Please try again later.",
                    { userId: targetUser.id, guildId }
                );
            }

            const wallet = typeof userData.wallet === 'number' ? userData.wallet : 0;
            const bank = typeof userData.bank === 'number' ? userData.bank : 0;

            const newWallet = wallet + amount;

            await updateEconomyData(client, guildId, targetUser.id, {
                wallet: newWallet,
                bank: bank
            });

            const embed = createEmbed({
                title: '✅ Coins Added',
                description: `${amount.toLocaleString()} coins have been added to ${targetUser}.`,
            })
                .addFields(
                    {
                        name: '💵 New Wallet Balance',
                        value: `$${newWallet.toLocaleString()}`,
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

            logger.info(`[ECONOMY] Coins added`, {
                admin: interaction.user.id,
                target: targetUser.id,
                amount,
                guildId
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [embed]
            });
        }

    }, { command: 'balance' })
};
export async function updateEconomyData(client, guildId, userId, newData) {
    const key = getEconomyKey(guildId, userId);

    const currentData = await getEconomyData(client, guildId, userId);

    const updatedData = normalizeEconomyData({
        ...DEFAULT_ECONOMY_DATA,
        ...currentData,
        ...newData,
    });

    await client.db.set(key, updatedData);

    logger.info(`[ECONOMY] Economy data updated`, {
        guildId,
        userId,
    });

    return updatedData;
}
