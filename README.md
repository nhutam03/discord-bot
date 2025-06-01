# Discord Bot

Bot Discord được xây dựng với discord.js v14

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình bot
File `.env` đã được thiết lập với:
- `YOUR_APP_ID`: Application ID của bot
- `YOUR_PUBLIC_KEY`: Public key của bot
- `YOUR_BOT_TOKEN`: Token của bot

### 3. Deploy slash commands
Trước khi chạy bot, bạn cần deploy các slash commands:
```bash
node deploy-commands.js
```

### 4. Chạy bot
```bash
npm start
```
hoặc
```bash
node index.js
```

## 📋 Commands có sẵn

- `/ping` - Kiểm tra độ trễ của bot
- `/info` - Hiển thị thông tin về bot, server hoặc user
- `/help` - Hiển thị danh sách lệnh

## 🔧 Thêm commands mới

1. Tạo file mới trong thư mục `commands/`
2. Sử dụng template:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tên-command')
        .setDescription('Mô tả command'),

    async execute(interaction) {
        await interaction.reply('Phản hồi của command!');
    },
};
```

3. Chạy lại `node deploy-commands.js` để deploy command mới
4. Restart bot

## 🛠️ Cấu trúc project

```
discord-bot/
├── commands/           # Thư mục chứa các slash commands
│   ├── ping.js
│   ├── info.js
│   └── help.js
├── .env               # File cấu hình (chứa tokens)
├── index.js           # File chính của bot
├── deploy-commands.js # Script deploy slash commands
├── package.json       # Dependencies và scripts
└── README.md         # Hướng dẫn này
```

## 🔐 Bảo mật

- Không chia sẻ file `.env` hoặc bot token
- Thêm `.env` vào `.gitignore` nếu sử dụng git

## 📝 Ghi chú

- Slash commands global có thể mất đến 1 giờ để cập nhật
- Để test nhanh, có thể deploy commands cho guild cụ thể (xem trong `deploy-commands.js`)
- Bot cần các permissions phù hợp trong server Discord