import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mcstatus')
        .setDescription('Check SkyFall MC server status'),

    async execute(interaction) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) return;

        try {
            const res = await fetch('https://api.mcsrvstat.us/3/play.skyfallmc.fun');
            const data = await res.json();

            const online = data.online;
            const players = data.players?.online || 0;
            const max = data.players?.max || 0;
            const version = data.version || 'Unknown';

            const embed = createEmbed({
                title: '🌌 SkyFall MC Status',
                description: online ? '🟢 Server Online' : '🔴 Server Offline'
            }).addFields(
                {
                    name: '🌐 IP',
                    value: 'play.skyfallmc.fun',
                    inline: false
                },
                {
                    name: '👥 Players',
                    value: `${players}/${max}`,
                    inline: true
                },
                {
                    name: '🎮 Version',
                    value: `${version}`,
                    inline: true
                }
            );

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [embed]
            });

        } catch (error) {
            logger.error('mcstatus error:', error);

            await InteractionHelper.safeEditReply(interaction, {
                content: '❌ Could not fetch server status.'
            });
        }
    }
};
