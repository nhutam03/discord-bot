const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PaginationManager = require('../utils/pagination');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Xem danh sách nhạc chờ'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const queue = interaction.client.musicManager.getQueue(interaction.guild.id);

            if (!queue) {
                return await interaction.editReply({
                    content: '❌ Không có queue nào!',
                    ephemeral: true
                });
            }

            const currentSong = interaction.client.musicManager.getNowPlaying(interaction.guild.id);
            const queueList = interaction.client.musicManager.getQueueList(interaction.guild.id);

            // Nếu queue trống
            if (!currentSong && queueList.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('🎵 Queue nhạc')
                    .setDescription('Queue hiện tại trống. Sử dụng `/play` để thêm nhạc!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Nếu queue ngắn (≤ 10 bài), hiển thị bình thường
            if (queueList.length <= 10) {
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
                    for (let i = 0; i < queueList.length; i++) {
                        const song = queueList[i];
                        queueText += `**${i + 1}.** ${song.title}\n👤 ${song.requestedBy}\n\n`;
                    }

                    embed.addFields({
                        name: `📋 Danh sách chờ (${queueList.length} bài)`,
                        value: queueText,
                        inline: false
                    });
                } else {
                    embed.addFields({
                        name: '📋 Danh sách chờ',
                        value: 'Trống',
                        inline: false
                    });
                }

                return await interaction.editReply({ embeds: [embed] });
            }

            // Queue dài - sử dụng pagination
            await this.createPaginatedQueue(interaction, currentSong, queueList);

        } catch (error) {
            console.error('❌ Lỗi trong command queue:', error);
            await interaction.editReply({
                content: '❌ Có lỗi xảy ra khi hiển thị queue!',
                ephemeral: true
            });
        }
    },

    async createPaginatedQueue(interaction, currentSong, queueList) {
        const songsPerPage = 10;
        const pagination = new PaginationManager();

        // Chia queue thành các trang
        const pages = [];

        for (let i = 0; i < queueList.length; i += songsPerPage) {
            const pageItems = queueList.slice(i, i + songsPerPage);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎵 Queue nhạc')
                .setTimestamp();

            // Thêm bài đang phát vào trang đầu tiên
            if (i === 0 && currentSong) {
                embed.addFields({
                    name: '🎵 Đang phát',
                    value: `**${currentSong.title}**\n👤 Yêu cầu bởi: ${currentSong.requestedBy}`,
                    inline: false
                });
            }

            // Tạo nội dung cho trang hiện tại
            let queueText = '';
            pageItems.forEach((song, index) => {
                const globalIndex = i + index + 1;
                queueText += `**${globalIndex}.** ${song.title}\n👤 ${song.requestedBy}\n\n`;
            });

            embed.addFields({
                name: `📋 Danh sách chờ (${queueList.length} bài)`,
                value: queueText,
                inline: false
            });

            pages.push(embed);
        }

        // Tạo pagination
        await pagination.createPagination(interaction, pages, {
            timeout: 300000, // 5 phút
            showPageNumbers: true,
            showFirstLast: true
        });
    }
};
