const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Xem bài hát đang phát'),

    async execute(interaction) {
        try {
            const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
            const currentSong = interaction.client.musicManager.getNowPlaying(interaction.guild.id);

            if (!currentSong || !queue) {
                return await interaction.reply({
                    content: '❌ Không có bài hát nào đang phát!',
                    ephemeral: true
                });
            }

            // Lấy thông tin thời gian phát
            const timestamp = queue.node.getTimestamp();
            const currentTime = timestamp ? timestamp.current.label : '00:00';
            const totalTime = timestamp ? timestamp.total.label : currentSong.duration || '00:00';

            // Tính progress dựa trên thời gian thực tế
            let progress = 0;
            if (timestamp && timestamp.current && timestamp.total) {
                const currentMs = timestamp.current.value || 0;
                const totalMs = timestamp.total.value || 1;
                progress = Math.max(0, Math.min(1, currentMs / totalMs));
            }

            // Tạo progress bar
            const progressBar = this.createProgressBar(progress);

            // Lấy thông tin queue và vị trí
            const queueList = interaction.client.musicManager.getQueueList(interaction.guild.id);
            // Bài đang phát luôn là vị trí số 1
            const currentPosition = 1;
            const totalInQueue = queueList.length + 1; // +1 để tính cả bài đang phát
            const queuePosition = `${currentPosition} / ${totalInQueue}`;

            const embed = new EmbedBuilder()
                .setColor('#1DB954') // Spotify green color
                .setTitle('🎵 Now Playing')
                .setDescription(`**${currentSong.title}**\n${currentSong.author || currentSong.artist || 'Unknown Artist'}`)
                .addFields(
                    {
                        name: 'Position',
                        value: `\`${currentTime}\``,
                        inline: true
                    },
                    {
                        name: 'Length',
                        value: `\`${totalTime}\``,
                        inline: true
                    },
                    {
                        name: 'Position in queue',
                        value: queuePosition,
                        inline: true
                    },
                    {
                        name: '\u200b', // Invisible character for spacing
                        value: `\`${currentTime}\` ${progressBar} \`${totalTime}\``,
                        inline: false
                    },
                    {
                        name: '👤 Requested by',
                        value: `${currentSong.requestedBy}`,
                        inline: true
                    }
                )
                .setTimestamp();

            // Thêm thumbnail nếu có
            if (currentSong.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            // Thêm footer với thông tin nguồn
            const source = currentSong.source || currentSong.extractor?.identifier || 'Unknown';
            embed.setFooter({
                text: `Source: ${source}`,
                iconURL: interaction.client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Lỗi trong command nowplaying:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi hiển thị bài hát hiện tại!',
                ephemeral: true
            });
        }
    },

    // Tạo progress bar giống như Spotify/Discord
    createProgressBar(progress) {
        // Đảm bảo progress luôn hợp lệ
        const safeProgress = Math.max(0, Math.min(1, progress || 0));

        const totalLength = 25;
        const currentPos = Math.round(safeProgress * totalLength);

        // Tạo thanh progress với chấm tròn chỉ vị trí
        let progressBar = '';

        for (let i = 0; i <= totalLength; i++) {
            if (i === currentPos) {
                progressBar += '🔘'; // Chấm tròn chỉ vị trí hiện tại
            } else if (i < currentPos) {
                progressBar += '━'; // Phần đã phát
            } else {
                progressBar += '━'; // Phần chưa phát
            }
        }

        return progressBar;
    },

    // Tạo progress dots (alternative style)
    createProgressDots(progress) {
        // Đảm bảo progress luôn hợp lệ
        const safeProgress = Math.max(0, Math.min(1, progress || 0));

        const totalDots = 30;
        const filledDots = Math.max(0, Math.min(totalDots, Math.round(safeProgress * totalDots)));
        const emptyDots = Math.max(0, totalDots - filledDots);

        return '●'.repeat(filledDots) + '○'.repeat(emptyDots);
    }
};
