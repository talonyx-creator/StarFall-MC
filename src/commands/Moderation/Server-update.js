import { EmbedBuilder } from 'discord.js';

const STATUS_CHANNEL_ID = '1495254716047818842';

const JAVA_IP = 'play.skyfallmc.fun';
const BEDROCK_IP = 'play.skyfallmc.fun';
const BEDROCK_PORT = '19153';

const SERVER_NAME = 'SkyFall MC';
const UPDATE_INTERVAL = 5 * 60 * 1000;

let peakPlayers = 0;

async function fetchStatus(url) {
    const response = await fetch(url);
    return await response.json();
}

function formatTime() {
    return new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export async function startMinecraftStatus(client) {
    const updateStatus = async () => {
        try {
            const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
            if (!channel) return;

            const javaData = await fetchStatus(`https://api.mcsrvstat.us/3/${JAVA_IP}`);
            const bedrockData = await fetchStatus(`https://api.mcsrvstat.us/bedrock/3/${BEDROCK_IP}:${BEDROCK_PORT}`);

            const javaOnline = javaData.online;
            const bedrockOnline = bedrockData.online;

            const javaPlayers = javaData.players?.online || 0;
            const javaMax = javaData.players?.max || 0;

            const bedrockPlayers = bedrockData.players?.online || 0;
            const bedrockMax = bedrockData.players?.max || 0;

            const totalPlayers = javaPlayers + bedrockPlayers;
            const totalMax = javaMax + bedrockMax;

            if (totalPlayers > peakPlayers) {
                peakPlayers = totalPlayers;
            }

            const isOnline = javaOnline || bedrockOnline;

            const embed = new EmbedBuilder()
                .setTitle(`🌌 ${SERVER_NAME} STATUS`)
                .setColor(isOnline ? '#2ecc71' : '#e74c3c')
                .setDescription(
                    isOnline
                        ? '🟢 **ONLINE!**\nThe server is live and ready to join.'
                        : '🔴 **OFFLINE!**\nThe server is currently unavailable.'
                )
                .addFields(
                    {
                        name: '🌐 Java Server',
                        value:
                            `**Status:** ${javaOnline ? '🟢 Online' : '🔴 Offline'}\n` +
                            `**IP:** \`${JAVA_IP}\`\n` +
                            `**Players:** \`${javaPlayers}/${javaMax}\`\n` +
                            `**Version:** \`${javaData.version || 'Unknown'}\``,
                        inline: false
                    },
                    {
                        name: '📱 Bedrock Server',
                        value:
                            `**Status:** ${bedrockOnline ? '🟢 Online' : '🔴 Offline'}\n` +
                            `**IP:** \`${BEDROCK_IP}\`\n` +
                            `**Port:** \`${BEDROCK_PORT}\`\n` +
                            `**Players:** \`${bedrockPlayers}/${bedrockMax}\`\n` +
                            `**Version:** \`${bedrockData.version || 'Unknown'}\``,
                        inline: false
                    },
                    {
                        name: '👥 Total Players',
                        value: `\`${totalPlayers}/${totalMax}\``,
                        inline: true
                    },
                    {
                        name: '🏆 Peak Players',
                        value: `\`${peakPlayers}\``,
                        inline: true
                    },
                    {
                        name: '⏰ Uptime',
                        value: isOnline ? '`24/7`' : '`Offline`',
                        inline: true
                    },
                    {
                        name: '📢 Join Now',
                        value:
                            `Java: \`${JAVA_IP}\`\n` +
                            `Bedrock: \`${BEDROCK_IP}:${BEDROCK_PORT}\``,
                        inline: false
                    }
                )
                .setThumbnail('https://chatgpt.com/s/m_69eeda37257c81918745439be7cd37f2')
                .setImage('https://chatgpt.com/s/m_69eeda37257c81918745439be7cd37f2')
                .setFooter({
                    text: `Last Updated: ${formatTime()} • Auto updates every 5 minutes`
                });

            const messages = await channel.messages.fetch({ limit: 10 });

            const oldMessage = messages.find(
                msg =>
                    msg.author.id === client.user.id &&
                    msg.embeds[0]?.title?.includes(`${SERVER_NAME} STATUS`)
            );

            if (oldMessage) {
                await oldMessage.edit({ embeds: [embed] });
            } else {
                await channel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Minecraft status update error:', error);
        }
    };

    await updateStatus();
    setInterval(updateStatus, UPDATE_INTERVAL);
                      }
