const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Trộn thứ tự playlist'),

    async execute(interaction) {
        try {
            // Kiểm tra user có trong voice channel không
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return await interaction.reply({
                    content: '❌ Bạn cần vào voice channel trước!',
                    ephemeral: true
                });
            }

            // Kiểm tra bot có đang trong voice channel không
            const botVoiceChannel = interaction.guild.members.me.voice.channel;
            if (!botVoiceChannel) {
                return await interaction.reply({
                    content: '❌ Bot không đang trong voice channel nào!',
                    ephemeral: true
                });
            }

            // Kiểm tra user và bot có cùng voice channel không
            if (voiceChannel.id !== botVoiceChannel.id) {
                return await interaction.reply({
                    content: '❌ Bạn cần ở cùng voice channel với bot!',
                    ephemeral: true
                });
            }

            // Kiểm tra có queue không
            const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
            if (!queue) {
                return await interaction.reply({
                    content: '❌ Không có queue nào để trộn!',
                    ephemeral: true
                });
            }

            // Kiểm tra có đủ bài để shuffle không (cần ít nhất 2 bài)
            if (queue.tracks.size < 2) {
                return await interaction.reply({
                    content: '❌ Cần ít nhất 2 bài trong queue để trộn!',
                    ephemeral: true
                });
            }

            // Lấy danh sách trước khi shuffle để so sánh
            const queueList = interaction.client.musicManager.getQueueList(interaction.guild.id);
            const beforeShuffle = queueList.map(track => track.title);

            // Thực hiện shuffle
            const success = interaction.client.musicManager.shuffle(interaction.guild.id);

            if (success) {
                // Lấy danh sách sau khi shuffle
                const afterShuffle = interaction.client.musicManager.getQueueList(interaction.guild.id).map(track => track.title);

                console.log('🔀 Shuffle comparison:', {
                    before: beforeShuffle,
                    after: afterShuffle,
                    changed: JSON.stringify(beforeShuffle) !== JSON.stringify(afterShuffle)
                });

                await interaction.reply({
                    content: `🔀 Đã trộn playlist! (${queueList.length} bài)\n💡 Sử dụng \`/queue\` để xem thứ tự mới`
                });
            } else {
                await interaction.reply({
                    content: '❌ Không thể trộn playlist!',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command shuffle:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi trộn playlist!',
                ephemeral: true
            });
        }
    }
};