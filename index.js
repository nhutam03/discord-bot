require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Tạo client Discord với các intents cần thiết
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Tạo collection để lưu trữ commands
client.commands = new Collection();

// Load commands từ thư mục commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
        }
    }
}

// Event: Bot sẵn sàng
client.once(Events.ClientReady, readyClient => {
    console.log(`🚀 Bot đã sẵn sàng! Đăng nhập với tên: ${readyClient.user.tag}`);

    // Set bot status
    client.user.setActivity('Đang phục vụ server!', { type: 'WATCHING' });
});

// Event: Xử lý slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Không tìm thấy command: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`✅ Executed command: ${interaction.commandName} by ${interaction.user.tag}`);
    } catch (error) {
        console.error(`❌ Error executing command ${interaction.commandName}:`, error);

        const errorMessage = 'Có lỗi xảy ra khi thực hiện lệnh này!';

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Event: Xử lý tin nhắn (cho prefix commands nếu cần)
client.on(Events.MessageCreate, message => {
    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    // Có thể thêm logic xử lý prefix commands ở đây
    // Ví dụ: if (message.content.startsWith('!')) { ... }
});

// Event: Thành viên mới join server
client.on(Events.GuildMemberAdd, member => {
    console.log(`👋 Thành viên mới: ${member.user.tag} đã join server ${member.guild.name}`);

    // Có thể gửi tin nhắn chào mừng
    const channel = member.guild.systemChannel;
    if (channel) {
        channel.send(`Chào mừng ${member} đến với server!`);
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Đăng nhập bot
client.login(process.env.YOUR_BOT_TOKEN);
