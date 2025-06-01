const { SlashCommandBuilder } = require('discord.js');
const musicManager = require('../musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Bỏ qua bài hiện tại'),

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

            // Kiểm tra có nhạc đang phát không
            const queue = musicManager.getQueue(interaction.guild.id);
            if (!queue || !queue.currentSong) {
                return await interaction.reply({
                    content: '❌ Không có nhạc nào đang phát!',
                    ephemeral: true
                });
            }

            // Lấy tên bài hiện tại
            const currentSong = queue.currentSong.title;

            // Skip bài hiện tại
            const success = musicManager.skip(interaction.guild.id);
            
            if (success) {
                await interaction.reply({
                    content: `⏭️ Đã bỏ qua: **${currentSong}**`
                });
            } else {
                await interaction.reply({
                    content: '❌ Không thể bỏ qua bài này!',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command skip:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi bỏ qua bài hát!',
                ephemeral: true
            });
        }
    }
};
