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
