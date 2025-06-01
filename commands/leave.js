const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Rời khỏi voice channel'),

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

            // Rời khỏi voice channel và dọn dẹp
            interaction.client.musicManager.leave(interaction.guild.id);

            await interaction.reply({
                content: '👋 Đã rời khỏi voice channel!'
            });

        } catch (error) {
            console.error('❌ Lỗi trong command leave:', error);
            await interaction.reply({
                content: '❌ Có lỗi xảy ra khi rời voice channel!',
                ephemeral: true
            });
        }
    }
};
