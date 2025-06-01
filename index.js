require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const MusicManager = require('./musicManager');

// Tạo client Discord với các intents cần thiết
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Tạo collection để lưu trữ commands
client.commands = new Collection();

// Khởi tạo Music Manager
client.musicManager = new MusicManager(client);

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

// Event: Xử lý tin nhắn (cho prefix commands)
client.on(Events.MessageCreate, async message => {
    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    // Kiểm tra prefix "t"
    const prefix = 't';
    if (!message.content.startsWith(prefix)) return;

    // Parse command và arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();

    // Command aliases mapping
    const aliases = {
        'np': 'nowplaying'
    };

    // Check if command is an alias
    if (aliases[commandName]) {
        commandName = aliases[commandName];
    }

    // Tìm command
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        // Tạo mock interaction object để tương thích với slash commands
        const mockInteraction = {
            // Basic properties
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client: message.client,
            createdTimestamp: message.createdTimestamp,

            // Command properties
            commandName: commandName,
            options: {
                getString: (name) => {
                    // Lấy argument đầu tiên làm string option
                    if (name === 'query' || name === 'song' || name === 'search') {
                        return args.join(' ') || null;
                    }
                    return null;
                },
                getSubcommand: () => args[0] || null
            },

            // Response methods
            replied: false,
            deferred: false,

            reply: async (options) => {
                mockInteraction.replied = true;
                if (typeof options === 'string') {
                    return await message.reply(options);
                }

                // Handle fetchReply option for ping command
                if (options.fetchReply) {
                    const reply = await message.reply({
                        content: options.content,
                        embeds: options.embeds,
                        components: options.components,
                        ephemeral: false // Can't be ephemeral in regular messages
                    });
                    return reply;
                }

                return await message.reply(options);
            },

            editReply: async (options) => {
                if (!mockInteraction.lastReply) {
                    return await mockInteraction.reply(options);
                }
                if (typeof options === 'string') {
                    return await mockInteraction.lastReply.edit(options);
                }
                return await mockInteraction.lastReply.edit(options);
            },

            followUp: async (options) => {
                if (typeof options === 'string') {
                    return await message.channel.send(options);
                }
                return await message.channel.send(options);
            },

            deferReply: async () => {
                mockInteraction.deferred = true;
                // Gửi typing indicator
                await message.channel.sendTyping();
                return Promise.resolve();
            }
        };

        // Store reference to reply for editing
        const originalReply = mockInteraction.reply;
        mockInteraction.reply = async (options) => {
            const reply = await originalReply.call(mockInteraction, options);
            mockInteraction.lastReply = reply;
            return reply;
        };

        await command.execute(mockInteraction);
        console.log(`✅ Executed prefix command: ${commandName} by ${message.author.tag}`);
    } catch (error) {
        console.error(`❌ Error executing prefix command ${commandName}:`, error);

        const errorMessage = 'Có lỗi xảy ra khi thực hiện lệnh này!';
        try {
            await message.reply(errorMessage);
        } catch (replyError) {
            console.error('❌ Error sending error message:', replyError);
        }
    }
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
