const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát nhạc từ YouTube hoặc URL')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('URL YouTube hoặc từ khóa tìm kiếm')
                .setRequired(true)
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

            // Kiểm tra bot có quyền join và speak không
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return await interaction.reply({
                    content: '❌ Bot không có quyền vào voice channel hoặc nói!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const query = interaction.options.getString('query');

            try {
                console.log(`🎵 Play command called with query: "${query}"`);
                console.log(`👤 User: ${interaction.user.tag}`);
                console.log(`🏠 Guild: ${interaction.guild.name}`);
                console.log(`📢 Voice channel: ${interaction.member.voice.channel?.name || 'None'}`);

                // Sử dụng MusicManager mới để phát nhạc
                const result = await interaction.client.musicManager.play(interaction, query);

                console.log(`🔄 Play method returned:`, result);

                if (!result || !result.track) {
                    return await interaction.editReply({
                        content: '❌ Không thể phát bài hát này!'
                    });
                }

                // Lấy thông tin từ result
                const track = result.track;
                const isPlaylist = result.isPlaylist;
                const totalTracks = result.totalTracks;
                const playlistInfo = result.playlist;

                // Debug: Log track properties
                console.log('Track object:', {
                    title: track.title,
                    author: track.author,
                    artist: track.artist,
                    duration: track.duration,
                    source: track.source,
                    extractor: track.extractor?.identifier,
                    thumbnail: track.thumbnail,
                    isPlaylist: isPlaylist,
                    totalTracks: totalTracks,
                    playlistTitle: playlistInfo?.title
                });

                // Tạo embed response với các thuộc tính đúng của discord-player v7
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTimestamp();

                if (isPlaylist) {
                    // Hiển thị thông tin playlist
                    const playlistTitle = playlistInfo?.title || 'Playlist';
                    embed.setTitle('📋 Đã thêm playlist vào queue')
                        .setDescription(`**${playlistTitle}**\nBắt đầu với: **${track.title}**`)
                        .addFields(
                            { name: '📊 Tổng số bài', value: String(totalTracks), inline: true },
                            { name: '👤 Nghệ sĩ', value: String(track.author || track.artist || 'N/A'), inline: true },
                            { name: '🔗 Nguồn', value: String(track.source || track.extractor?.identifier || 'Unknown'), inline: true },
                            { name: '👤 Yêu cầu bởi', value: interaction.user.toString(), inline: true }
                        );
                } else {
                    // Hiển thị thông tin single track
                    embed.setTitle('🎵 Đã thêm vào queue')
                        .setDescription(`**${track.title}**`)
                        .addFields(
                            { name: '👤 Nghệ sĩ', value: String(track.author || track.artist || 'N/A'), inline: true },
                            { name: '⏱️ Thời lượng', value: String(track.duration || 'N/A'), inline: true },
                            { name: '🔗 Nguồn', value: String(track.source || track.extractor?.identifier || 'Unknown'), inline: true },
                            { name: '👤 Yêu cầu bởi', value: interaction.user.toString(), inline: true }
                        );
                }

                if (track.thumbnail) {
                    embed.setThumbnail(track.thumbnail);
                }

                await interaction.editReply({ embeds: [embed] });

            } catch (playError) {
                console.error('❌ Lỗi phát nhạc:', playError);
                await interaction.editReply({
                    content: `❌ Có lỗi xảy ra khi phát nhạc: ${playError.message}`
                });
            }

        } catch (error) {
            console.error('❌ Lỗi trong command play:', error);
            
            const errorMessage = '❌ Có lỗi xảy ra khi thực hiện lệnh!';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};
