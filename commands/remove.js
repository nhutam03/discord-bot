const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Xóa một bài hát khỏi queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Vị trí của bài hát trong queue (1, 2, 3...)')
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
                    content: '❌ Không có queue nào để xóa!',
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

            const position = interaction.options.getInteger('position');

            // Thực hiện xóa bài hát
            const result = interaction.client.musicManager.removeTrack(interaction.guild.id, position);

            if (result.success) {
                await interaction.editReply({
                    content: `🗑️ ${result.message}\n💡 Sử dụng \`/queue\` để xem queue hiện tại`
                });
            } else {
                await interaction.editReply({
                    content: `❌ ${result.message}`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command remove:', error);
            
            const errorMessage = '❌ Có lỗi xảy ra khi xóa bài hát!';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};
