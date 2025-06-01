const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Di chuyển một bài hát từ vị trí này sang vị trí khác trong queue')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Vị trí hiện tại của bài hát (1, 2, 3...)')
                .setRequired(true)
                .setMinValue(1)
        )
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('Vị trí mới muốn di chuyển đến (1, 2, 3...)')
                .setRequired(true)
                .setMinValue(1)
        ),

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

            // Kiểm tra bot có trong cùng voice channel không
            const botVoiceChannel = interaction.guild.members.me.voice.channel;
            if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
                return await interaction.reply({
                    content: '❌ Bạn cần ở cùng voice channel với bot!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Kiểm tra có queue không
            const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
            if (!queue) {
                return await interaction.editReply({
                    content: '❌ Không có queue nào để di chuyển!',
                    ephemeral: true
                });
            }

            // Kiểm tra queue có bài hát không
            if (queue.tracks.size === 0) {
                return await interaction.editReply({
                    content: '❌ Queue hiện tại trống!',
                    ephemeral: true
                });
            }

            // Kiểm tra queue có ít nhất 2 bài hát
            if (queue.tracks.size < 2) {
                return await interaction.editReply({
                    content: '❌ Cần ít nhất 2 bài hát trong queue để di chuyển!',
                    ephemeral: true
                });
            }

            const fromPosition = interaction.options.getInteger('from');
            const toPosition = interaction.options.getInteger('to');

            // Thực hiện di chuyển bài hát
            const result = interaction.client.musicManager.moveTrack(interaction.guild.id, fromPosition, toPosition);

            if (result.success) {
                await interaction.editReply({
                    content: `🔄 ${result.message}\n💡 Sử dụng \`/queue\` để xem thứ tự mới`
                });
            } else {
                await interaction.editReply({
                    content: `❌ ${result.message}`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command move:', error);
            
            const errorMessage = '❌ Có lỗi xảy ra khi di chuyển bài hát!';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};
