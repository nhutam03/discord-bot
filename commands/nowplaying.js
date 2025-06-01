const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicManager = require('../musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Xem bài hát đang phát'),

    async execute(interaction) {
        try {
            const currentSong = musicManager.getNowPlaying(interaction.guild.id);
            
            if (!currentSong) {
                return await interaction.reply({
                    content: '❌ Không có bài hát nào đang phát!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🎵 Đang phát')
                .setDescription(`**${currentSong.title}**`)
                .addFields(
                    { name: '⏱️ Thời lượng', value: currentSong.duration || 'N/A', inline: true },
                    { name: '👤 Yêu cầu bởi', value: currentSong.requestedBy.toString(), inline: true },
                    { name: '🔗 URL', value: `[Link](${currentSong.url})`, inline: true }
                )
                .setTimestamp();

            if (currentSong.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Lỗi trong command nowplaying:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi hiển thị bài hát hiện tại!',
                ephemeral: true
            });
        }
    }
};
