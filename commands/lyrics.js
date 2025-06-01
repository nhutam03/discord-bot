const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { Client } = require('genius-lyrics');

// Khởi tạo Genius client (có thể sử dụng token hoặc không)
const genius = new Client();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Hiển thị lời bài hát đang phát')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Tên bài hát (để trống để lấy bài đang phát)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            let songTitle = interaction.options.getString('song');
            let artistName = '';

            // Nếu không có input, lấy bài đang phát
            if (!songTitle) {
                const currentSong = interaction.client.musicManager.getNowPlaying(interaction.guild.id);

                if (!currentSong) {
                    return await interaction.editReply({
                        content: '❌ Không có bài hát nào đang phát! Sử dụng `/lyrics <tên bài hát>` để tìm lời bài hát cụ thể.',
                        ephemeral: true
                    });
                }

                songTitle = currentSong.title;
                artistName = currentSong.author || currentSong.artist || '';

                // Làm sạch title (loại bỏ các ký tự đặc biệt, official video, etc.)
                songTitle = songTitle
                    .replace(/\(official.*?\)/gi, '')
                    .replace(/\[official.*?\]/gi, '')
                    .replace(/official video/gi, '')
                    .replace(/official audio/gi, '')
                    .replace(/lyrics/gi, '')
                    .replace(/\(.*?remix.*?\)/gi, '')
                    .replace(/\[.*?remix.*?\]/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Tìm kiếm lời bài hát
            console.log(`🔍 Searching lyrics for: "${songTitle}" by "${artistName}"`);

            const searchQuery = artistName ? `${artistName} ${songTitle}` : songTitle;
            const searches = await genius.songs.search(searchQuery);

            if (!searches || searches.length === 0) {
                return await interaction.editReply({
                    content: `❌ Không tìm thấy lời bài hát cho: **${songTitle}**\n💡 Thử tìm kiếm với tên chính xác hơn bằng cách sử dụng \`/lyrics <tên bài hát>\``
                });
            }

            // Nếu có nhiều kết quả, hiển thị menu lựa chọn
            if (searches.length > 1) {
                const options = searches.slice(0, 10).map((song, index) => ({
                    label: song.title.length > 100 ? song.title.substring(0, 97) + '...' : song.title,
                    description: `Nghệ sĩ: ${song.artist.name}`,
                    value: index.toString()
                }));

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('lyrics_select')
                    .setPlaceholder('Chọn bài hát bạn muốn xem lời...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🔍 Kết quả tìm kiếm')
                    .setDescription(`Tìm thấy **${searches.length}** kết quả cho: **${songTitle}**\nVui lòng chọn bài hát bạn muốn xem lời:`)
                    .setTimestamp();

                const response = await interaction.editReply({
                    embeds: [embed],
                    components: [row]
                });

                // Chờ người dùng chọn
                try {
                    const confirmation = await response.awaitMessageComponent({
                        componentType: ComponentType.StringSelect,
                        time: 60000,
                        filter: i => i.user.id === interaction.user.id
                    });

                    const selectedIndex = parseInt(confirmation.values[0]);
                    const selectedSong = searches[selectedIndex];

                    await confirmation.deferUpdate();
                    await this.displayLyrics(interaction, selectedSong);

                } catch (error) {
                    await interaction.editReply({
                        content: '⏰ Hết thời gian chờ! Vui lòng thử lại.',
                        embeds: [],
                        components: []
                    });
                }
            } else {
                // Chỉ có 1 kết quả, hiển thị luôn
                await this.displayLyrics(interaction, searches[0]);
            }

        } catch (error) {
            console.error('❌ Lỗi trong command lyrics:', error);

            let errorMessage = '❌ Có lỗi xảy ra khi tìm lời bài hát!';

            if (error.message.includes('No result was found')) {
                errorMessage = '❌ Không tìm thấy lời bài hát cho bài hát này!';
            } else if (error.message.includes('rate limit')) {
                errorMessage = '❌ Đã vượt quá giới hạn tìm kiếm. Vui lòng thử lại sau!';
            }

            await interaction.editReply({
                content: errorMessage,
                ephemeral: true,
                embeds: [],
                components: []
            });
        }
    },

    async displayLyrics(interaction, song) {
        try {
            console.log(`📝 Getting lyrics for: "${song.title}" by "${song.artist.name}"`);

            // Lấy lời bài hát
            const lyrics = await song.lyrics();

            if (!lyrics || lyrics.trim().length === 0) {
                return await interaction.editReply({
                    content: `❌ Không tìm thấy lời bài hát cho: **${song.title}** - **${song.artist.name}**`,
                    embeds: [],
                    components: []
                });
            }

            // Tạo embed với lời bài hát
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🎵 ${song.title}`)
                .setAuthor({
                    name: song.artist.name,
                    iconURL: song.artist.image || undefined
                })
                .setTimestamp()
                .setFooter({
                    text: 'Lời bài hát từ Genius',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            // Thêm thumbnail nếu có
            if (song.image) {
                embed.setThumbnail(song.image);
            }

            // Format lời bài hát đẹp hơn (không dùng code block)
            const maxLength = 4000;
            let lyricsText = lyrics.trim();

            // Làm sạch lời bài hát - chỉ loại bỏ metadata ở đầu
            // Tìm và bắt đầu từ [Verse] hoặc [Intro] đầu tiên
            const firstSectionMatch = lyricsText.match(/\[(Verse|Intro|Chorus|Pre-Chorus|Bridge|Outro)/i);
            if (firstSectionMatch) {
                const startIndex = lyricsText.indexOf(firstSectionMatch[0]);
                lyricsText = lyricsText.substring(startIndex);
            }

            // Chỉ loại bỏ các URL nếu có
            lyricsText = lyricsText.replace(/https?:\/\/[^\s]+/g, '');

            if (lyricsText.length > maxLength) {
                lyricsText = lyricsText.substring(0, maxLength) + '\n\n**[Lời bài hát bị cắt ngắn...]**';
            }

            // Format lời bài hát với các đoạn rõ ràng
            lyricsText = lyricsText
                .replace(/\[([^\]]+)\]/g, '**[$1]**') // Format [Verse 1], [Chorus] etc.
                .replace(/\n\n/g, '\n\n') // Giữ nguyên line breaks
                .trim();

            embed.setDescription(lyricsText);

            // Thêm link đến Genius
            embed.addFields({
                name: '🔗 Xem đầy đủ',
                value: `[Xem trên Genius](${song.url})`,
                inline: true
            });

            await interaction.editReply({
                embeds: [embed],
                components: []
            });

        } catch (error) {
            console.error('❌ Lỗi khi hiển thị lời bài hát:', error);
            await interaction.editReply({
                content: '❌ Có lỗi xảy ra khi lấy lời bài hát!',
                embeds: [],
                components: []
            });
        }
    }
};