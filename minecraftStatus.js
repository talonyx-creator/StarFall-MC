import { EmbedBuilder } from 'discord.js';

const STATUS_CHANNEL_ID = '1495254716047818842';
const SERVER_IP = 'play.skyfallmc.fun';
const SERVER_PORT = '19153';

let statusMessageId = null;

async function getStatus() {
    const res = await fetch(`https://api.mcsrvstat.us/bedrock/3/${SERVER_IP}:${SERVER_PORT}`);
    return await res.json();
}

export function startMinecraftStatus(client) {
    async function updateStatus() {
        try {
            const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
            if (!channel) return;

            const data = await getStatus();

            const online = data.online;
            const players = data.players?.online || 0;
            const maxPlayers = data.players?.max || 0;
            const version = data.version || 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle('🌌 SkyFall MC Status')
                .setColor(online ? '#2ecc71' : '#e74c3c')
                .setDescription(
                    online ? '🟢 **Server Online**' : '🔴 **Server Offline**'
                )
                .addFields(
                    {
                        name: '🌐 IP',
                        value: `\`${SERVER_IP}:${SERVER_PORT}\``,
                        inline: false
                    },
                    {
                        name: '👥 Players',
                        value: `\`${players}/${maxPlayers}\``,
                        inline: true
                    },
                    {
                        name: '🎮 Version',
                        value: `\`${version}\``,
                        inline: true
                    },
                    {
                        name: '⏰ Updated',
                        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                        inline: false
                    }
                );

            if (statusMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(statusMessageId);
                    await oldMessage.edit({ embeds: [embed] });
                    return;
                } catch {
                    statusMessageId = null;
                }
            }

            const newMessage = await channel.send({ embeds: [embed] });
            statusMessageId = newMessage.id;

        } catch (error) {
            console.error('Minecraft status update error:', error);
        }
    }

    updateStatus();
    setInterval(updateStatus, 30 * 60 * 1000);
}
