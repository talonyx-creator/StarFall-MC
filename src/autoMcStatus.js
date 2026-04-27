import { EmbedBuilder } from 'discord.js';

const STATUS_CHANNEL_ID = '1495254716047818842';

const SERVER_IP = 'play.skyfallmc.fun';
const BEDROCK_PORT = '19153';

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

async function fetchStatus() {
    const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}`);
    return await response.json();
}

export function startAutoMcStatus(client) {
    async function sendStatus() {
        try {
            const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
            if (!channel) return;

            const data = await fetchStatus();

            const online = data.online;
            const players = data.players?.online || 0;
            const maxPlayers = data.players?.max || 0;
            const version = data.version || 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle('🌌 SkyFall MC Server Status')
                .setColor(online ? '#2ecc71' : '#e74c3c')
                .setDescription(
                    online
                        ? '```🟢 SERVER ONLINE```'
                        : '```🔴 SERVER OFFLINE```'
                )
                .addFields(
                    {
                        name: '📡 Live Server Info',
                        value:
`‎\`\`\`txt
🌐 IP       : ${SERVER_IP}
🔌 Port     : ${BEDROCK_PORT}
👥 Players  : ${players}/${maxPlayers}
🎮 Version  : ${version}
☕ Java     : Supported
📱 Bedrock  : Supported
\`\`\``,
                        inline: false
                    },
                    {
                        name: '🚀 Join Now',
                        value:
`‎\`\`\`txt
☕ Java    : ${SERVER_IP}
📱 Bedrock : ${SERVER_IP}:${BEDROCK_PORT}
\`\`\``,
                        inline: false
                    }
                )
                .setFooter({
                    text: '⏰ Auto updates every 1 hour'
                });

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Auto MC status error:', error);
        }
    }

    sendStatus();
    setInterval(sendStatus, UPDATE_INTERVAL);
}
