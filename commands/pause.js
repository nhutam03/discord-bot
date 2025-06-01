const { SlashCommandBuilder } = require('discord.js');
const musicManager = require('../musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Tạm dừng nhạc'),

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
            if (!queue || !queue.isPlaying) {
                return await interaction.reply({
                    content: '❌ Không có nhạc nào đang phát!',
                    ephemeral: true
                });
            }

            // Tạm dừng nhạc
            const success = musicManager.pause(interaction.guild.id);
            
            if (success) {
                await interaction.reply({
                    content: '⏸️ Đã tạm dừng nhạc!'
                });
            } else {
                await interaction.reply({
                    content: '❌ Không thể tạm dừng nhạc!',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command pause:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi tạm dừng nhạc!',
                ephemeral: true
            });
        }
    }
};
