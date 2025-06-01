const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Hiển thị thông tin về bot hoặc server')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Loại thông tin muốn xem')
                .setRequired(true)
                .addChoices(
                    { name: 'Bot', value: 'bot' },
                    { name: 'Server', value: 'server' },
                    { name: 'User', value: 'user' }
                )),

    async execute(interaction) {
        const type = interaction.options.getString('type');

        if (type === 'bot') {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🤖 Thông tin Bot')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields(
                    { name: '📛 Tên', value: interaction.client.user.tag, inline: true },
                    { name: '🆔 ID', value: interaction.client.user.id, inline: true },
                    { name: '📅 Tạo lúc', value: `<t:${Math.floor(interaction.client.user.createdTimestamp / 1000)}:F>`, inline: false },
                    { name: '🌐 Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
                    { name: '👥 Users', value: `${interaction.client.users.cache.size}`, inline: true },
                    { name: '💓 Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (type === 'server') {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🏰 Thông tin Server')
                .addFields(
                    { name: '📛 Tên', value: guild.name, inline: true },
                    { name: '🆔 ID', value: guild.id, inline: true },
                    { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Thành viên', value: `${guild.memberCount}`, inline: true },
                    { name: '📅 Tạo lúc', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
                )
                .setTimestamp();

            // Chỉ set thumbnail nếu server có icon
            if (guild.iconURL()) {
                embed.setThumbnail(guild.iconURL());
            }

            await interaction.reply({ embeds: [embed] });

        } else if (type === 'user') {
            const user = interaction.user;
            const member = interaction.member;

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('👤 Thông tin User')
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: '📛 Tên', value: user.tag, inline: true },
                    { name: '🆔 ID', value: user.id, inline: true },
                    { name: '📅 Tạo tài khoản', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
                    { name: '📅 Join server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
