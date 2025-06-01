require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Đọc tất cả command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

// Tạo REST instance
const rest = new REST().setToken(process.env.YOUR_BOT_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Bắt đầu deploy ${commands.length} slash commands...`);

        // Deploy commands globally (có thể mất 1 giờ để cập nhật)
        const data = await rest.put(
            Routes.applicationCommands(process.env.YOUR_APP_ID),
            { body: commands },
        );

        console.log(`✅ Đã deploy thành công ${data.length} slash commands globally!`);

        // Để deploy cho guild cụ thể (nhanh hơn), sử dụng:
        // const data = await rest.put(
        //     Routes.applicationGuildCommands(process.env.YOUR_APP_ID, 'YOUR_GUILD_ID'),
        //     { body: commands },
        // );
        
    } catch (error) {
        console.error('❌ Lỗi khi deploy commands:', error);
    }
})();
