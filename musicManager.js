const { Player } = require('discord-player');

class MusicManager {
    constructor(client) {
        this.client = client;
        this.player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                filter: 'audioonly'
            },
            // Configure for ytdl-core
            useLegacyFFmpeg: false,
            skipFFmpeg: false
        });

        // Setup player asynchronously
        this.setupPlayer().catch(console.error);
    }

    async setupPlayer() {
        // Load extractors for discord-player v7
        try {
            // Load YouTube extractor first
            try {
                const { YoutubeiExtractor } = require('discord-player-youtubei');
                await this.player.extractors.register(YoutubeiExtractor, {
                    authentication: process.env.YOUTUBE_COOKIE || undefined
                });
                console.log('✅ YouTube extractor loaded successfully');
            } catch (ytError) {
                console.log('⚠️ YouTube extractor failed to load:', ytError.message);
            }

            // Load default extractors
            const { DefaultExtractors } = require('@discord-player/extractor');
            await this.player.extractors.loadMulti(DefaultExtractors);
            console.log('✅ Default extractors loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load extractors:', error);
        }

        // Player events
        this.player.events.on('playerStart', (queue, track) => {
            queue.metadata.channel.send(`🎵 Đang phát: **${track.title}** - ${track.author}`);
        });

        this.player.events.on('audioTrackAdd', (queue, track) => {
            queue.metadata.channel.send(`✅ Đã thêm **${track.title}** vào queue!`);
        });

        this.player.events.on('disconnect', (queue) => {
            queue.metadata.channel.send('👋 Đã ngắt kết nối khỏi voice channel!');
        });

        this.player.events.on('emptyChannel', (queue) => {
            queue.metadata.channel.send('❌ Voice channel trống, bot sẽ rời sau 5 phút!');
        });

        this.player.events.on('emptyQueue', (queue) => {
            queue.metadata.channel.send('✅ Queue đã hết, bot sẽ rời voice channel!');
        });

        this.player.events.on('error', (queue, error) => {
            console.log(`❌ Lỗi player: ${error.message}`);
            queue.metadata.channel.send(`❌ Có lỗi xảy ra: ${error.message}`);
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
            const track = searchResult.tracks[0];
            await queue.addTrack(track);

            // Phát nhạc nếu chưa phát
            if (!queue.isPlaying()) await queue.node.play();

            console.log(`✅ Track added:`, {
                title: track.title,
                author: track.author,
                duration: track.duration
            });

            return track;

        } catch (error) {
            console.error('❌ Lỗi trong play:', error);
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
}

module.exports = MusicManager;
