const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Tiếp tục phát nhạc'),

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

            // Kiểm tra có nhạc để tiếp tục không
            const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
            if (!queue || !queue.currentTrack) {
                return await interaction.reply({
                    content: '❌ Không có nhạc nào để tiếp tục!',
                    ephemeral: true
                });
            }

            // Tiếp tục phát nhạc
            const success = interaction.client.musicManager.resume(interaction.guild.id);
            
            if (success) {
                await interaction.reply({
                    content: '▶️ Đã tiếp tục phát nhạc!'
                });
            } else {
                await interaction.reply({
                    content: '❌ Không thể tiếp tục phát nhạc!',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command resume:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi tiếp tục phát nhạc!',
                ephemeral: true
            });
        }
    }
};
