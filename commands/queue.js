const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicManager = require('../musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Xem danh sách nhạc chờ'),

    async execute(interaction) {
        try {
            const queue = musicManager.getQueue(interaction.guild.id);
            
            if (!queue) {
                return await interaction.reply({
                    content: '❌ Không có queue nào!',
                    ephemeral: true
                });
            }

            const currentSong = musicManager.getNowPlaying(interaction.guild.id);
            const queueList = musicManager.getQueueList(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎵 Queue nhạc')
                .setTimestamp();

            // Bài đang phát
            if (currentSong) {
                embed.addFields({
                    name: '🎵 Đang phát',
                    value: `**${currentSong.title}**\n👤 Yêu cầu bởi: ${currentSong.requestedBy}`,
                    inline: false
                });
            }

            // Danh sách chờ
            if (queueList.length > 0) {
                let queueText = '';
                const maxSongs = 10; // Hiển thị tối đa 10 bài

                for (let i = 0; i < Math.min(queueList.length, maxSongs); i++) {
                    const song = queueList[i];
                    queueText += `**${i + 1}.** ${song.title}\n👤 ${song.requestedBy}\n\n`;
                }

                if (queueList.length > maxSongs) {
                    queueText += `... và ${queueList.length - maxSongs} bài khác`;
                }

                embed.addFields({
                    name: `📋 Danh sách chờ (${queueList.length} bài)`,
                    value: queueText || 'Trống',
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '📋 Danh sách chờ',
                    value: 'Trống',
                    inline: false
                });
            }

            // Thông tin thêm
            if (!currentSong && queueList.length === 0) {
                embed.setDescription('Queue hiện tại trống. Sử dụng `/play` để thêm nhạc!');
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Lỗi trong command queue:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi hiển thị queue!',
                ephemeral: true
            });
        }
    }
};
