const Discord = require('discord.js');
const updateClientActivity = require('@/utils/updateClientActivity');

module.exports = async guild => {
  logger.info(`Kicked from guild ${guild.name} (${guild.id}).`);

  updateClientActivity();

  const channel = client.guilds.cache.get(config.guildId).channels.cache.get(config.joinLeaveLogsChannelId);
  
  const embeds = [
    new Discord.EmbedBuilder()
      .setAuthor({ name: 'Kicked from Guild', iconURL: guild.iconURL() })
      .setColor(Discord.Colors.Red)
      .setFields([
        {
          name: 'Guild',
          value: `${guild.name} (${guild.id})`
        },
        {
          name: 'Members',
          value: guild.memberCount.toString()
        }
      ])
      .setFooter({ text: guild.name, iconUrl: guild.iconURL() })
      .setTimestamp()
  ];

  channel.send({ embeds });
};