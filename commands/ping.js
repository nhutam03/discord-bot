const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: 'Đang kiểm tra ping...', 
            fetchReply: true 
        });
        
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply(
            `🏓 **Pong!**\n` +
            `📡 **Độ trễ:** ${ping}ms\n` +
            `💓 **API Ping:** ${apiPing}ms`
        );
    },
};
