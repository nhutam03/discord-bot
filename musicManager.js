const { Player } = require('discord-player');

class MusicManager {
    constructor(client) {
        this.client = client;
        this.player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                filter: 'audioonly',
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }
            },
            // Configure for better compatibility
            useLegacyFFmpeg: false,
            skipFFmpeg: false,
            connectionTimeout: 30000, // Tăng timeout
            lagMonitor: 30000,
            // Thêm fallback options
            overrideFallbackContext: true
        });

        // Setup player asynchronously
        this.setupPlayer().catch(console.error);
    }

    async setupPlayer() {
        // Load extractors for discord-player v7
        try {
            // Load YouTube extractor first với retry mechanism
            let youtubeLoaded = false;
            try {
                const { YoutubeiExtractor } = require('discord-player-youtubei');
                await this.player.extractors.register(YoutubeiExtractor, {
                    authentication: process.env.YOUTUBE_COOKIE || undefined,
                    // Thêm options để tăng tính ổn định
                    streamOptions: {
                        useClient: 'ANDROID',
                        highWaterMark: 1 << 25
                    }
                });
                console.log('✅ YouTube extractor loaded successfully');
                youtubeLoaded = true;
            } catch (ytError) {
                console.log('⚠️ YouTube extractor failed to load:', ytError.message);
                console.log('🔄 Will try to use default YouTube support...');
            }

            // Load default extractors
            try {
                const { DefaultExtractors } = require('@discord-player/extractor');
                await this.player.extractors.loadMulti(DefaultExtractors);
                console.log('✅ Default extractors loaded successfully');
            } catch (defaultError) {
                console.error('❌ Failed to load default extractors:', defaultError);

                // Fallback: Load individual extractors
                console.log('🔄 Trying to load individual extractors...');
                try {
                    const { AttachmentExtractor } = require('@discord-player/extractor');
                    await this.player.extractors.register(AttachmentExtractor);
                    console.log('✅ Attachment extractor loaded');
                } catch (attachError) {
                    console.log('⚠️ Attachment extractor failed:', attachError.message);
                }
            }

            // Log loaded extractors
            console.log('📋 Loaded extractors:', this.player.extractors.store.map(e => e.identifier));

        } catch (error) {
            console.error('❌ Failed to load extractors:', error);
            console.log('⚠️ Bot will continue with limited functionality');
        }

        // Player events
        this.player.events.on('playerStart', (queue, track) => {
            console.log(`🎵 Started playing: ${track.title} by ${track.author}`);
            queue.metadata.channel.send(`🎵 Đang phát: **${track.title}** - ${track.author}`);
        });

        this.player.events.on('audioTrackAdd', (queue, track) => {
            console.log(`✅ Track added to queue: ${track.title}`);
            // Không gửi message ở đây vì play command sẽ xử lý việc hiển thị
        });

        this.player.events.on('audioTracksAdd', (queue, tracks) => {
            console.log(`✅ Multiple tracks added to queue: ${tracks.length} tracks`);
            // Không gửi message ở đây vì play command sẽ xử lý việc hiển thị
        });

        this.player.events.on('disconnect', (queue) => {
            console.log('👋 Disconnected from voice channel');
            queue.metadata.channel.send('👋 Đã ngắt kết nối khỏi voice channel!');
        });

        this.player.events.on('emptyChannel', (queue) => {
            console.log('❌ Voice channel is empty');
            queue.metadata.channel.send('❌ Voice channel trống, bot sẽ rời sau 5 phút!');
        });

        this.player.events.on('emptyQueue', (queue) => {
            console.log('✅ Queue is empty');
            queue.metadata.channel.send('✅ Queue đã hết, bot sẽ rời voice channel!');
        });

        this.player.events.on('error', (queue, error) => {
            console.error(`❌ Player error: ${error.message}`, error);
            queue.metadata.channel.send(`❌ Có lỗi xảy ra: ${error.message}`);
        });

        // Thêm event listener cho playerError để tránh UnhandledEventsWarning
        this.player.events.on('playerError', (queue, error) => {
            console.error(`❌ Player error occurred:`, {
                message: error.message,
                code: error.code,
                timestamp: error.timestamp,
                track: queue.currentTrack ? {
                    title: queue.currentTrack.title,
                    url: queue.currentTrack.url,
                    extractor: queue.currentTrack.extractor?.identifier
                } : null
            });

            // Thử skip track hiện tại nếu có lỗi stream
            if (error.code === 'ERR_NO_RESULT' || error.message.includes('Could not extract stream')) {
                console.log('🔄 Attempting to handle problematic track...');

                if (queue.currentTrack) {
                    const failedTrack = queue.currentTrack;
                    queue.metadata.channel.send(`❌ Không thể phát **${failedTrack.title}**. Đang tìm bài thay thế...`);

                    // Thử tìm track thay thế
                    setTimeout(async () => {
                        try {
                            const retrySuccess = await this.retryTrack(queue, failedTrack);

                            if (retrySuccess) {
                                queue.metadata.channel.send(`🔄 Đã tìm thấy bài thay thế cho **${failedTrack.title}**!`);
                            } else {
                                queue.metadata.channel.send(`❌ Không tìm thấy bài thay thế. Đang chuyển sang bài tiếp theo...`);
                            }

                            // Skip track hiện tại
                            if (queue.tracks.data.length > 0) {
                                queue.node.skip();
                            } else {
                                queue.metadata.channel.send('❌ Không có bài nào khác trong queue!');
                            }
                        } catch (skipError) {
                            console.error('❌ Error while handling failed track:', skipError);
                            queue.metadata.channel.send('❌ Có lỗi xảy ra khi xử lý track!');
                        }
                    }, 1000);
                } else {
                    queue.metadata.channel.send(`❌ Có lỗi xảy ra khi phát nhạc: ${error.message}`);
                }
            } else {
                queue.metadata.channel.send(`❌ Có lỗi xảy ra: ${error.message}`);
            }
        });

        // Thêm event listener cho track skip
        this.player.events.on('playerSkip', (queue, track) => {
            console.log(`⏭️ Skipped track: ${track.title}`);
        });
    }

    // Phát nhạc
    async play(interaction, query) {
        try {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                return null;
            }

            // Tìm kiếm bài hát
            console.log(`🔍 Searching for: ${query}`);
            const searchResult = await this.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: 'auto' // Tự động detect: YouTube, Spotify, SoundCloud, etc.
            });

            console.log(`📊 Search result:`, {
                hasTracks: searchResult.hasTracks(),
                tracksCount: searchResult.tracks?.length || 0,
                playlist: searchResult.playlist || null,
                firstTrack: searchResult.tracks?.[0] ? {
                    title: searchResult.tracks[0].title,
                    author: searchResult.tracks[0].author,
                    duration: searchResult.tracks[0].duration,
                    url: searchResult.tracks[0].url
                } : null
            });

            if (!searchResult.hasTracks()) {
                return null;
            }

            // Tạo hoặc lấy queue
            const queue = this.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    requestedBy: interaction.user
                },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000, // 5 phút
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000 // 5 phút
            });

            // Kết nối voice channel
            try {
                if (!queue.connection) await queue.connect(channel);
            } catch (connectError) {
                console.error('❌ Connection error:', connectError);
                this.player.nodes.delete(interaction.guild.id);
                return null;
            }

            // Thêm track(s) vào queue
            let addedTracks = [];
            // Chỉ coi là playlist khi có searchResult.playlist (user đưa link playlist thực sự)
            // Không coi search results với nhiều tracks là playlist
            const isPlaylist = !!searchResult.playlist;

            if (isPlaylist) {
                // Playlist - thêm tất cả tracks
                console.log(`📋 Adding playlist with ${searchResult.tracks.length} tracks`);
                console.log(`📋 Playlist info:`, {
                    title: searchResult.playlist.title,
                    description: searchResult.playlist.description,
                    url: searchResult.playlist.url
                });

                await queue.addTrack(searchResult.tracks);
                addedTracks = searchResult.tracks;
                console.log(`✅ Added ${searchResult.tracks.length} tracks from playlist`);
            } else {
                // Single track - chỉ lấy track đầu tiên từ search results
                const track = searchResult.tracks[0];
                await queue.addTrack(track);
                addedTracks.push(track);
                console.log(`✅ Added single track: ${track.title} (from ${searchResult.tracks.length} search results)`);
            }

            // Phát nhạc nếu chưa phát
            if (!queue.isPlaying()) {
                try {
                    await queue.node.play();
                    console.log('🎵 Started playing queue');
                } catch (playError) {
                    console.error('❌ Error starting playback:', playError);

                    // Nếu lỗi stream, thử với track khác
                    if (playError.code === 'ERR_NO_RESULT' || playError.message.includes('Could not extract stream')) {
                        console.log('🔄 Stream error detected, will be handled by playerError event');
                        // playerError event sẽ xử lý việc skip track
                    } else {
                        throw playError;
                    }
                }
            }

            console.log(`✅ Track(s) added:`, {
                count: addedTracks.length,
                firstTrack: addedTracks[0] ? {
                    title: addedTracks[0].title,
                    author: addedTracks[0].author,
                    duration: addedTracks[0].duration,
                    url: addedTracks[0].url,
                    extractor: addedTracks[0].extractor?.identifier
                } : null
            });

            // Return object with track info and playlist info
            return {
                track: addedTracks[0] || null,
                isPlaylist: isPlaylist,
                totalTracks: addedTracks.length,
                playlist: searchResult.playlist || null
            };

        } catch (error) {
            console.error('❌ Lỗi trong play:', error);

            // Cleanup nếu có lỗi
            if (error.message.includes('Connection') || error.message.includes('Voice')) {
                try {
                    this.player.nodes.delete(interaction.guild.id);
                } catch (cleanupError) {
                    console.error('❌ Error during cleanup:', cleanupError);
                }
            }

            throw error;
        }
    }

    // Lấy queue của guild
    getQueue(guildId) {
        return this.player.nodes.get(guildId);
    }

    // Dừng nhạc
    stop(guildId) {
        const queue = this.getQueue(guildId);
        if (queue) {
            queue.node.stop();
            return true;
        }
        return false;
    }

    // Tạm dừng
    pause(guildId) {
        const queue = this.getQueue(guildId);
        if (queue) {
            return queue.node.pause();
        }
        return false;
    }

    // Tiếp tục
    resume(guildId) {
        const queue = this.getQueue(guildId);
        if (queue) {
            return queue.node.resume();
        }
        return false;
    }

    // Skip bài hiện tại
    skip(guildId) {
        const queue = this.getQueue(guildId);
        if (queue) {
            return queue.node.skip();
        }
        return false;
    }

    // Rời voice channel
    leave(guildId) {
        const queue = this.getQueue(guildId);
        if (queue) {
            queue.delete();
            return true;
        }
        return false;
    }

    // Lấy thông tin bài đang phát
    getNowPlaying(guildId) {
        const queue = this.getQueue(guildId);
        return queue ? queue.currentTrack : null;
    }

    // Lấy danh sách queue
    getQueueList(guildId) {
        const queue = this.getQueue(guildId);
        return queue ? queue.tracks.data : [];
    }

    // Trộn playlist (sử dụng discord-player built-in shuffle)
    shuffle(guildId) {
        const queue = this.getQueue(guildId);
        if (!queue || !queue.tracks || queue.tracks.size < 2) {
            console.log('❌ Cannot shuffle: insufficient tracks or no queue');
            return false;
        }

        // Log trước khi shuffle để debug
        const beforeShuffle = queue.tracks.data.map((t, i) => `${i}: ${t.title}`);
        console.log('🔀 Before shuffle:', beforeShuffle);

        try {
            // Sử dụng built-in shuffle method của discord-player
            queue.tracks.shuffle();

            // Log sau khi shuffle để debug
            const afterShuffle = queue.tracks.data.map((t, i) => `${i}: ${t.title}`);
            console.log('🔀 After shuffle:', afterShuffle);
            console.log(`🔀 Successfully shuffled ${queue.tracks.size} tracks`);

            return true;
        } catch (error) {
            console.error('❌ Error shuffling queue:', error);
            return false;
        }
    }

    // Xóa bài hát khỏi queue theo vị trí
    removeTrack(guildId, position) {
        const queue = this.getQueue(guildId);
        if (!queue || !queue.tracks || queue.tracks.size === 0) {
            console.log('❌ Cannot remove track: no queue or empty queue');
            return { success: false, message: 'Queue trống hoặc không tồn tại!' };
        }

        // Kiểm tra position hợp lệ (1-based index)
        if (position < 1 || position > queue.tracks.size) {
            console.log(`❌ Invalid position: ${position}, queue size: ${queue.tracks.size}`);
            return { success: false, message: `Vị trí không hợp lệ! Chọn từ 1 đến ${queue.tracks.size}` };
        }

        try {
            // Chuyển từ 1-based sang 0-based index
            const index = position - 1;
            const trackToRemove = queue.tracks.data[index];

            if (!trackToRemove) {
                return { success: false, message: 'Không tìm thấy bài hát tại vị trí này!' };
            }

            // Sử dụng discord-player's built-in removeTrack method
            const removedTrack = queue.removeTrack(trackToRemove);

            if (removedTrack) {
                console.log(`🗑️ Removed track at position ${position}: ${removedTrack.title}`);
                return {
                    success: true,
                    track: removedTrack,
                    message: `Đã xóa **${removedTrack.title}** khỏi queue!`
                };
            } else {
                return { success: false, message: 'Không thể xóa bài hát!' };
            }
        } catch (error) {
            console.error('❌ Error removing track:', error);
            return { success: false, message: 'Có lỗi xảy ra khi xóa bài hát!' };
        }
    }

    // Di chuyển bài hát từ vị trí này sang vị trí khác
    moveTrack(guildId, fromPosition, toPosition) {
        const queue = this.getQueue(guildId);
        if (!queue || !queue.tracks || queue.tracks.size === 0) {
            console.log('❌ Cannot move track: no queue or empty queue');
            return { success: false, message: 'Queue trống hoặc không tồn tại!' };
        }

        // Kiểm tra positions hợp lệ (1-based index)
        if (fromPosition < 1 || fromPosition > queue.tracks.size) {
            return { success: false, message: `Vị trí nguồn không hợp lệ! Chọn từ 1 đến ${queue.tracks.size}` };
        }

        if (toPosition < 1 || toPosition > queue.tracks.size) {
            return { success: false, message: `Vị trí đích không hợp lệ! Chọn từ 1 đến ${queue.tracks.size}` };
        }

        if (fromPosition === toPosition) {
            return { success: false, message: 'Vị trí nguồn và đích giống nhau!' };
        }

        try {
            // Chuyển từ 1-based sang 0-based index
            const fromIndex = fromPosition - 1;
            const toIndex = toPosition - 1;

            console.log(`🔄 Debug moveTrack: fromPosition=${fromPosition}, toPosition=${toPosition}, fromIndex=${fromIndex}, toIndex=${toIndex}`);
            console.log(`🔄 Queue tracks size: ${queue.tracks.size}, data length: ${queue.tracks.data.length}`);

            const trackToMove = queue.tracks.data[fromIndex];
            if (!trackToMove) {
                return { success: false, message: 'Không tìm thấy bài hát tại vị trí nguồn!' };
            }

            console.log(`🔄 Track to move: ${trackToMove.title}`);

            // Sử dụng discord-player's built-in moveTrack method
            // moveTrack(track, newIndex) - newIndex là 0-based
            queue.moveTrack(trackToMove, toIndex);

            console.log(`🔄 Moved track "${trackToMove.title}" from position ${fromPosition} to ${toPosition}`);
            return {
                success: true,
                track: trackToMove,
                message: `Đã di chuyển **${trackToMove.title}** từ vị trí ${fromPosition} đến vị trí ${toPosition}!`
            };
        } catch (error) {
            console.error('❌ Error moving track:', error);
            return { success: false, message: 'Có lỗi xảy ra khi di chuyển bài hát!' };
        }
    }

    // Retry failed track với fallback search
    async retryTrack(queue, failedTrack) {
        try {
            console.log(`🔄 Retrying track: ${failedTrack.title}`);

            // Thử search lại với query khác
            const fallbackQueries = [
                `${failedTrack.cleanTitle || failedTrack.title}`, // Clean title
                `${failedTrack.author} ${failedTrack.title}`, // Author + title
                failedTrack.title.split(' - ')[0], // Phần đầu của title
                failedTrack.title.replace(/\(.*?\)/g, '').trim() // Bỏ ngoặc đơn
            ];

            for (const query of fallbackQueries) {
                try {
                    console.log(`🔍 Trying fallback search: "${query}"`);
                    const searchResult = await this.player.search(query, {
                        requestedBy: failedTrack.requestedBy,
                        searchEngine: 'auto'
                    });

                    if (searchResult.hasTracks()) {
                        const newTrack = searchResult.tracks[0];
                        // Kiểm tra track mới có khác track cũ không
                        if (newTrack.url !== failedTrack.url) {
                            await queue.addTrack(newTrack);
                            console.log(`✅ Found alternative track: ${newTrack.title}`);
                            return true;
                        }
                    }
                } catch (searchError) {
                    console.log(`⚠️ Fallback search failed for "${query}":`, searchError.message);
                    continue;
                }
            }

            console.log(`❌ No alternative found for: ${failedTrack.title}`);
            return false;

        } catch (error) {
            console.error('❌ Error in retryTrack:', error);
            return false;
        }
    }
}

module.exports = MusicManager;

process.env.FFMPEG_PATH = require('ffmpeg-static');
