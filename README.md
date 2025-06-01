# Discord Music Bot 🎵

Bot Discord chuyên dụng để phát nhạc từ YouTube với đầy đủ tính năng điều khiển.

## ✨ Tính năng

### 🎵 Phát nhạc
- `/play <url/tìm kiếm>` - Phát nhạc từ YouTube URL hoặc tìm kiếm theo từ khóa
- `/pause` - Tạm dừng nhạc
- `/resume` - Tiếp tục phát nhạc
- `/stop` - Dừng nhạc và xóa queue
- `/skip` - Bỏ qua bài hiện tại
- `/shuffle` - Trộn thứ tự playlist (đã sửa lỗi)
- `/nowplaying` - Xem bài đang phát
- `/queue` - Xem danh sách nhạc chờ (có phân trang cho queue dài)
- `/lyrics [tên bài]` - Xem lời bài hát (có phân trang cho lời dài)
- `/leave` - Rời khỏi voice channel

### 🔧 Tiện ích
- `/ping` - Kiểm tra độ trễ
- `/help` - Xem danh sách lệnh
- `/info` - Thông tin về bot

### 📄 Tính năng phân trang
- **Queue dài**: Tự động chia thành nhiều trang (10 bài/trang)
- **Lời bài hát dài**: Tự động chia thành nhiều trang
- **Navigation**: Sử dụng nút ⏮️ ◀️ ▶️ ⏭️ để điều hướng
- **Đóng**: Nút ❌ để đóng pagination
- **Timeout**: Tự động hết hạn sau 5-10 phút

## 🚀 Cài đặt

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
```bash
node deploy-commands.js
```

### 4. Chạy bot
```bash
npm start
```

## 📋 Yêu cầu hệ thống

- Node.js 16.9.0 trở lên
- FFmpeg (để xử lý audio)
- Bot cần có quyền:
  - Connect (kết nối voice channel)
  - Speak (nói trong voice channel)
  - Use Slash Commands

## 🛠️ Dependencies chính

- `discord.js` - Discord API wrapper
- `@discordjs/voice` - Voice connection handling
- `ytdl-core` - YouTube downloader
- `play-dl` - Multi-platform music streaming
- `genius-lyrics` - Lấy lời bài hát từ Genius
- `ffmpeg-static` - FFmpeg binary
- `libsodium-wrappers` - Audio encryption

## 🎯 Cách sử dụng

1. Mời bot vào server với đủ quyền
2. Vào voice channel
3. Sử dụng `/play <tên bài hát>` để bắt đầu phát nhạc
4. Sử dụng các lệnh khác để điều khiển

## 🛠️ Cấu trúc project

```
discord-bot/
├── commands/           # Thư mục chứa các slash commands
│   ├── play.js        # Phát nhạc
│   ├── stop.js        # Dừng nhạc
│   ├── pause.js       # Tạm dừng
│   ├── resume.js      # Tiếp tục
│   ├── skip.js        # Bỏ qua
│   ├── shuffle.js     # Trộn playlist
│   ├── queue.js       # Xem queue (có pagination)
│   ├── lyrics.js      # Xem lời bài hát (có pagination)
│   ├── nowplaying.js  # Bài đang phát
│   ├── leave.js       # Rời voice channel
│   ├── ping.js        # Kiểm tra ping
│   ├── info.js        # Thông tin
│   └── help.js        # Trợ giúp
├── utils/             # Thư mục tiện ích
│   └── pagination.js  # Hệ thống phân trang
├── musicManager.js    # Quản lý nhạc và queue
├── .env              # File cấu hình (chứa tokens)
├── index.js          # File chính của bot
├── deploy-commands.js # Script deploy slash commands
├── package.json      # Dependencies và scripts
└── README.md         # Hướng dẫn này
```

## 🔐 Bảo mật

- Không chia sẻ file `.env` hoặc bot token
- Thêm `.env` vào `.gitignore` nếu sử dụng git

## 📝 Lưu ý

- Bot chỉ hỗ trợ YouTube hiện tại
- Queue tự động xóa khi bot rời voice channel
- Slash commands global có thể mất đến 1 giờ để cập nhật
- Để test nhanh, có thể deploy commands cho guild cụ thể