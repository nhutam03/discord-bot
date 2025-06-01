const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

class PaginationManager {
    constructor() {
        this.activeCollectors = new Map();
    }

    /**
     * Tạo pagination cho embed
     * @param {Object} interaction - Discord interaction
     * @param {Array} pages - Mảng các embed pages
     * @param {Object} options - Tùy chọn pagination
     */
    async createPagination(interaction, pages, options = {}) {
        const {
            timeout = 300000, // 5 phút
            showPageNumbers = true,
            showFirstLast = true,
            ephemeral = false
        } = options;

        if (!pages || pages.length === 0) {
            throw new Error('Không có trang nào để hiển thị');
        }

        // Nếu chỉ có 1 trang, không cần pagination
        if (pages.length === 1) {
            return await interaction.editReply({
                embeds: [pages[0]],
                ephemeral
            });
        }

        let currentPage = 0;

        // Tạo buttons
        const createButtons = (page, total) => {
            const row = new ActionRowBuilder();

            if (showFirstLast && total > 2) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('first')
                        .setLabel('⏮️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0)
                );
            }

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === total - 1)
            );

            if (showFirstLast && total > 2) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('last')
                        .setLabel('⏭️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === total - 1)
                );
            }

            // Thêm button đóng
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('❌')
                    .setStyle(ButtonStyle.Danger)
            );

            return row;
        };

        // Cập nhật footer với số trang
        const updatePageFooter = (embed, page, total) => {
            if (showPageNumbers) {
                const originalFooter = embed.data.footer?.text || '';
                const pageInfo = `Trang ${page + 1}/${total}`;
                
                if (originalFooter) {
                    embed.setFooter({
                        text: `${originalFooter} • ${pageInfo}`,
                        iconURL: embed.data.footer?.icon_url
                    });
                } else {
                    embed.setFooter({ text: pageInfo });
                }
            }
            return embed;
        };

        // Gửi trang đầu tiên
        const currentEmbed = updatePageFooter(pages[currentPage], currentPage, pages.length);
        const response = await interaction.editReply({
            embeds: [currentEmbed],
            components: [createButtons(currentPage, pages.length)],
            ephemeral
        });

        // Tạo collector
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: timeout,
            filter: i => i.user.id === interaction.user.id
        });

        // Lưu collector để có thể dọn dẹp sau
        this.activeCollectors.set(interaction.id, collector);

        collector.on('collect', async (buttonInteraction) => {
            try {
                const action = buttonInteraction.customId;

                switch (action) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'previous':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(pages.length - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = pages.length - 1;
                        break;
                    case 'close':
                        collector.stop('user_closed');
                        return;
                }

                // Cập nhật embed và buttons
                const updatedEmbed = updatePageFooter(pages[currentPage], currentPage, pages.length);
                await buttonInteraction.update({
                    embeds: [updatedEmbed],
                    components: [createButtons(currentPage, pages.length)]
                });

            } catch (error) {
                console.error('❌ Lỗi trong pagination collector:', error);
                try {
                    await buttonInteraction.reply({
                        content: '❌ Có lỗi xảy ra!',
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('❌ Không thể reply error:', replyError);
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            try {
                // Xóa collector khỏi map
                this.activeCollectors.delete(interaction.id);

                // Vô hiệu hóa tất cả buttons
                const disabledRow = new ActionRowBuilder();
                const buttons = createButtons(currentPage, pages.length).components;

                buttons.forEach(button => {
                    disabledRow.addComponents(
                        ButtonBuilder.from(button).setDisabled(true)
                    );
                });

                if (reason === 'user_closed') {
                    try {
                        await interaction.editReply({
                            content: '✅ Đã đóng pagination.',
                            embeds: [],
                            components: []
                        });
                    } catch (editError) {
                        // Bỏ qua lỗi ChannelNotCached và các lỗi cache khác
                        if (editError.code === 'ChannelNotCached' || editError.code === 'UnknownMessage' || editError.code === 'UnknownChannel') {
                            console.log('⚠️ Pagination message không thể edit (channel/message not cached), bỏ qua...');
                        } else {
                            console.error('❌ Lỗi khi edit reply trong pagination end:', editError);
                        }
                    }
                } else {
                    try {
                        await interaction.editReply({
                            components: [disabledRow]
                        });
                    } catch (editError) {
                        // Bỏ qua lỗi ChannelNotCached và các lỗi cache khác
                        if (editError.code === 'ChannelNotCached' || editError.code === 'UnknownMessage' || editError.code === 'UnknownChannel') {
                            console.log('⚠️ Pagination message không thể edit (channel/message not cached), bỏ qua...');
                        } else {
                            console.error('❌ Lỗi khi edit reply trong pagination end:', editError);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Lỗi khi kết thúc pagination:', error);
            }
        });

        return collector;
    }

    /**
     * Chia nội dung thành các trang
     * @param {Array} items - Mảng items cần chia trang
     * @param {number} itemsPerPage - Số items mỗi trang
     * @param {Function} formatFunction - Hàm format mỗi item
     */
    chunkItems(items, itemsPerPage, formatFunction) {
        const chunks = [];
        for (let i = 0; i < items.length; i += itemsPerPage) {
            const chunk = items.slice(i, i + itemsPerPage);
            chunks.push(chunk.map(formatFunction));
        }
        return chunks;
    }

    /**
     * Chia text dài thành các trang
     * @param {string} text - Text cần chia
     * @param {number} maxLength - Độ dài tối đa mỗi trang
     */
    chunkText(text, maxLength = 4000) {
        if (text.length <= maxLength) {
            return [text];
        }

        const chunks = [];
        let currentChunk = '';
        const lines = text.split('\n');

        for (const line of lines) {
            if ((currentChunk + line + '\n').length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                
                // Nếu một dòng quá dài, chia nhỏ hơn
                if (line.length > maxLength) {
                    const subChunks = this.chunkLongLine(line, maxLength);
                    chunks.push(...subChunks.slice(0, -1));
                    currentChunk = subChunks[subChunks.length - 1] + '\n';
                } else {
                    currentChunk = line + '\n';
                }
            } else {
                currentChunk += line + '\n';
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Chia một dòng quá dài
     */
    chunkLongLine(line, maxLength) {
        const chunks = [];
        for (let i = 0; i < line.length; i += maxLength) {
            chunks.push(line.slice(i, i + maxLength));
        }
        return chunks;
    }

    /**
     * Dọn dẹp tất cả collectors đang hoạt động
     */
    cleanup() {
        for (const [id, collector] of this.activeCollectors) {
            try {
                collector.stop('cleanup');
            } catch (error) {
                console.error(`❌ Lỗi khi dọn dẹp collector ${id}:`, error);
            }
        }
        this.activeCollectors.clear();
    }
}

module.exports = PaginationManager;
