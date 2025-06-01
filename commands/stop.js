const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng nhạc và xóa queue'),

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

            // Dừng nhạc và xóa queue
            interaction.client.musicManager.stop(interaction.guild.id);

            await interaction.reply({
                content: '⏹️ Đã dừng nhạc và xóa queue!'
            });

        } catch (error) {
            console.error('❌ Lỗi trong command stop:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi dừng nhạc!',
                ephemeral: true
            });
        }
    }
};
