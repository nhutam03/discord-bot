const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách các lệnh có sẵn'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('📚 Danh sách lệnh')
            .setDescription('Dưới đây là các lệnh bạn có thể sử dụng:')
            .addFields(
                {
                    name: '🏓 /ping',
                    value: 'Kiểm tra độ trễ của bot',
                    inline: false
                },
                {
                    name: 'ℹ️ /info',
                    value: 'Hiển thị thông tin về bot, server hoặc user',
                    inline: false
                },
                {
                    name: '🎵 /play',
                    value: 'Phát nhạc từ YouTube, Spotify, SoundCloud',
                    inline: false
                },
                {
                    name: '⏸️ /pause',
                    value: 'Tạm dừng nhạc đang phát',
                    inline: false
                },
                {
                    name: '▶️ /resume',
                    value: 'Tiếp tục phát nhạc',
                    inline: false
                },
                {
                    name: '⏭️ /skip',
                    value: 'Bỏ qua bài hiện tại',
                    inline: false
                },
                {
                    name: '⏹️ /stop',
                    value: 'Dừng nhạc và xóa queue',
                    inline: false
                },
                {
                    name: '🎵 /nowplaying',
                    value: 'Xem bài đang phát',
                    inline: false
                },
                {
                    name: '📋 /queue',
                    value: 'Xem danh sách nhạc chờ',
                    inline: false
                },
                {
                    name: '📝 /lyrics',
                    value: 'Xem lời bài hát đang phát hoặc tìm kiếm',
                    inline: false
                },
                {
                    name: '🚪 /leave',
                    value: 'Bot rời khỏi voice channel',
                    inline: false
                },
                {
                    name: '❓ /help',
                    value: 'Hiển thị danh sách lệnh này',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Sử dụng / để xem các lệnh có sẵn',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};
