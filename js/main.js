/**
 * 主应用程序
 * 实现所有交互功能和业务逻辑
 */

class BookmarkManager {
    constructor() {
        this.bookmarkAPI = new BookmarkAPI();
        this.aiAPI = new AIOrganizeAPI();
        this.currentBookmarks = [];
        this.currentFolders = [];
        this.filteredBookmarks = [];
        this.selectedFolder = null;
        this.searchKeyword = '';
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.loadStoredData();
        this.setupModals();
        this.setupTabs();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        const { DOM, Throttle } = Utils;

        // 导航按钮事件
        DOM.on(DOM.get('#homeBtn'), 'click', () => this.goHome());
        DOM.on(DOM.get('#getBookmarksBtn'), 'click', () => this.showGetBookmarksModal());
        DOM.on(DOM.get('#organizeBtn'), 'click', () => this.showOrganizeModal());
        DOM.on(DOM.get('#importExportBtn'), 'click', () => this.showImportExportModal());
        DOM.on(DOM.get('#searchToggleBtn'), 'click', () => this.toggleSearch());

        // 搜索功能
        const searchInput = DOM.get('#searchInput');
        DOM.on(searchInput, 'input', Throttle.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));
        DOM.on(DOM.get('#searchBtn'), 'click', () => {
            this.handleSearch(searchInput.value);
        });

        // 模态框确认按钮
        DOM.on(DOM.get('#confirmGetBookmarks'), 'click', () => this.getBookmarks());
        DOM.on(DOM.get('#confirmOrganize'), 'click', () => this.organizeBookmarks());
        DOM.on(DOM.get('#importBtn'), 'click', () => this.importBookmarks());
        DOM.on(DOM.get('#exportBtn'), 'click', () => this.exportBookmarks());

        // 文件选择
        DOM.on(DOM.get('#importFile'), 'change', (e) => this.handleFileSelect(e));

        // 键盘快捷键
        DOM.on(document, 'keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * 设置模态框
     */
    setupModals() {
        const { DOM } = Utils;

        // 关闭按钮事件
        DOM.getAll('.close-btn, .btn-secondary').forEach(btn => {
            DOM.on(btn, 'click', (e) => {
                const modalId = e.target.getAttribute('data-modal') || 
                               e.target.closest('.modal').id;
                this.hideModal(modalId);
            });
        });

        // 点击背景关闭
        DOM.getAll('.modal').forEach(modal => {
            DOM.on(modal, 'click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    /**
     * 设置标签页
     */
    setupTabs() {
        const { DOM } = Utils;

        DOM.getAll('.tab-btn').forEach(btn => {
            DOM.on(btn, 'click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    /**
     * 加载存储的数据
     */
    loadStoredData() {
        const { Storage } = Utils;
        
        const storedBookmarks = Storage.get('bookmarks', []);
        const storedFolders = Storage.get('folders', []);
        
        if (storedBookmarks.length > 0) {
            this.currentBookmarks = storedBookmarks;
            this.currentFolders = storedFolders;
            this.filteredBookmarks = [...storedBookmarks];
            this.renderBookmarks();
            this.renderFolders();
        }
    }

    /**
     * 显示获取书签模态框
     */
    showGetBookmarksModal() {
        // 检查是否在Chrome扩展环境中
        if (this.bookmarkAPI.isSupported) {
            // 直接获取书签，不需要弹窗确认
            this.getBookmarks();
        } else {
            // 显示提示信息，说明需要导入书签文件
            const modal = Utils.DOM.get('#getBookmarksModal');
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <p>检测到您不在Chrome扩展环境中。</p>
                <p>请选择以下方式之一来获取书签：</p>
                <div class="bookmark-import-options">
                    <div class="import-option">
                        <h4>方式一：导出Chrome书签文件</h4>
                        <ol>
                            <li>打开Chrome浏览器</li>
                            <li>按 Ctrl+Shift+O 打开书签管理器</li>
                            <li>点击右上角的"⋮"菜单</li>
                            <li>选择"导出书签"</li>
                            <li>保存HTML文件到本地</li>
                        </ol>
                    </div>
                    <div class="import-option">
                        <h4>方式二：安装Chrome扩展</h4>
                        <ol>
                            <li>打开Chrome扩展管理页面 (chrome://extensions/)</li>
                            <li>开启"开发者模式"</li>
                            <li>点击"加载已解压的扩展程序"</li>
                            <li>选择此项目文件夹</li>
                            <li>在扩展中使用此工具</li>
                        </ol>
                    </div>
                </div>
                <p class="note">点击"开始导入"将打开文件选择器，请选择导出的HTML书签文件。</p>
            `;
            
            // 更新按钮文本
            const confirmBtn = modal.querySelector('#confirmGetBookmarks');
            confirmBtn.textContent = '开始导入';
            
            this.showModal('getBookmarksModal');
        }
    }

    /**
     * 显示整理书签模态框
     */
    showOrganizeModal() {
        if (this.currentBookmarks.length === 0) {
            Utils.Notification.warning('请先获取书签数据');
            return;
        }
        this.showModal('organizeModal');
    }

    /**
     * 显示导入导出模态框
     */
    showImportExportModal() {
        this.showModal('importExportModal');
    }

    /**
     * 显示模态框
     * @param {string} modalId - 模态框ID
     */
    showModal(modalId) {
        const modal = Utils.DOM.get(`#${modalId}`);
        Utils.DOM.show(modal);
    }

    /**
     * 隐藏模态框
     * @param {string} modalId - 模态框ID
     */
    hideModal(modalId) {
        const modal = Utils.DOM.get(`#${modalId}`);
        Utils.DOM.hide(modal);
    }

    /**
     * 切换标签页
     * @param {string} tabName - 标签页名称
     */
    switchTab(tabName) {
        const { DOM } = Utils;

        // 更新标签按钮状态
        DOM.getAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        DOM.get(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新标签页内容
        DOM.getAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        DOM.get(`#${tabName}Tab`).classList.add('active');
    }

    /**
     * 获取书签
     */
    async getBookmarks() {
        this.showLoading();
        this.hideModal('getBookmarksModal');

        try {
            const result = await this.bookmarkAPI.getBookmarks();
            
            if (result.success) {
                this.currentBookmarks = result.data.bookmarks;
                this.currentFolders = result.data.folders;
                this.filteredBookmarks = [...this.currentBookmarks];
                
                // 保存到本地存储
                Utils.Storage.set('bookmarks', this.currentBookmarks);
                Utils.Storage.set('folders', this.currentFolders);
                
                this.renderBookmarks();
                this.renderFolders();
                
                Utils.Notification.success(`成功获取 ${result.data.total} 个书签`);
            } else {
                Utils.Notification.error(`获取书签失败: ${result.error}`);
            }
        } catch (error) {
            Utils.Notification.error(`获取书签失败: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 整理书签
     */
    async organizeBookmarks() {
        const apiKey = Utils.DOM.get('#apiKey').value.trim();
        const model = Utils.DOM.get('#aiModel').value;

        if (!apiKey) {
            Utils.Notification.warning('请输入API Key');
            return;
        }

        this.showLoading();
        this.hideModal('organizeModal');

        try {
            this.aiAPI.setConfig({ apiKey, model });
            const result = await this.aiAPI.organizeBookmarks(this.currentBookmarks);
            
            if (result.success) {
                this.currentBookmarks = result.data;
                this.filteredBookmarks = [...this.currentBookmarks];
                
                // 保存到本地存储
                Utils.Storage.set('bookmarks', this.currentBookmarks);
                
                this.renderBookmarks();
                Utils.Notification.success('书签整理完成');
            } else {
                Utils.Notification.error(`整理失败: ${result.error}`);
            }
        } catch (error) {
            Utils.Notification.error(`整理失败: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 处理文件选择
     * @param {Event} event - 文件选择事件
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!Utils.FileUtils.validateType(file, ['.json'])) {
            Utils.Notification.error('请选择JSON格式的文件');
            return;
        }

        // 启用导入按钮
        Utils.DOM.get('#importBtn').disabled = false;
    }

    /**
     * 导入书签
     */
    async importBookmarks() {
        const fileInput = Utils.DOM.get('#importFile');
        const file = fileInput.files[0];

        if (!file) {
            Utils.Notification.warning('请选择要导入的文件');
            return;
        }

        this.showLoading();
        this.hideModal('importExportModal');

        try {
            const content = await Utils.FileUtils.readAsText(file);
            const result = this.bookmarkAPI.importBookmarks(content);
            
            if (result.success) {
                this.currentBookmarks = result.data.bookmarks;
                this.currentFolders = result.data.folders;
                this.filteredBookmarks = [...this.currentBookmarks];
                
                // 保存到本地存储
                Utils.Storage.set('bookmarks', this.currentBookmarks);
                Utils.Storage.set('folders', this.currentFolders);
                
                this.renderBookmarks();
                this.renderFolders();
                
                Utils.Notification.success(`成功导入 ${result.data.total} 个书签`);
            } else {
                Utils.Notification.error(`导入失败: ${result.error}`);
            }
        } catch (error) {
            Utils.Notification.error(`导入失败: ${error.message}`);
        } finally {
            this.hideLoading();
            fileInput.value = '';
        }
    }

    /**
     * 导出书签
     */
    exportBookmarks() {
        if (this.currentBookmarks.length === 0) {
            Utils.Notification.warning('没有可导出的书签数据');
            return;
        }

        try {
            const exportData = this.bookmarkAPI.exportBookmarks();
            const filename = `bookmarks_${Utils.TimeUtils.format(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.json`;
            
            Utils.FileUtils.download(exportData, filename, 'application/json');
            Utils.Notification.success('书签导出成功');
            this.hideModal('importExportModal');
        } catch (error) {
            Utils.Notification.error(`导出失败: ${error.message}`);
        }
    }

    /**
     * 处理搜索
     * @param {string} keyword - 搜索关键词
     */
    handleSearch(keyword) {
        this.searchKeyword = keyword.trim();
        this.applyFilters();
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        let filtered = [...this.currentBookmarks];

        // 应用搜索筛选
        if (this.searchKeyword) {
            filtered = this.bookmarkAPI.searchBookmarks(this.searchKeyword, filtered);
        }

        // 应用文件夹筛选
        if (this.selectedFolder) {
            filtered = this.bookmarkAPI.filterByFolder(this.selectedFolder, filtered);
        }

        this.filteredBookmarks = filtered;
        this.renderBookmarks();
    }

    /**
     * 选择文件夹
     * @param {string} folderName - 文件夹名称
     */
    selectFolder(folderName) {
        // 更新选中状态
        Utils.DOM.getAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });

        if (this.selectedFolder === folderName) {
            // 取消选择
            this.selectedFolder = null;
        } else {
            // 选择新文件夹
            this.selectedFolder = folderName;
            const folderElement = Utils.DOM.get(`[data-folder="${folderName}"]`);
            if (folderElement) {
                folderElement.classList.add('active');
            }
        }

        this.applyFilters();
        this.scrollToBookmarks();
    }

    /**
     * 按标签筛选
     * @param {string} tag - 标签
     */
    filterByTag(tag) {
        this.searchKeyword = tag;
        Utils.DOM.get('#searchInput').value = tag;
        this.applyFilters();
    }

    /**
     * 渲染书签列表
     */
    renderBookmarks() {
        const container = Utils.DOM.get('#bookmarksSection');
        
        if (this.filteredBookmarks.length === 0) {
            container.innerHTML = `
                <div class="welcome-message">
                    <h2>没有找到匹配的书签</h2>
                    <p>尝试调整搜索条件或获取新的书签数据</p>
                </div>
            `;
            return;
        }

        // 按文件夹分组
        const groupedBookmarks = Utils.ArrayUtils.groupBy(this.filteredBookmarks, 'folder');
        
        let html = '';
        Object.keys(groupedBookmarks).forEach(folderName => {
            const bookmarks = groupedBookmarks[folderName];
            const folderId = Utils.StringUtils.generateId();
            
            html += `
                <div class="bookmark-folder" data-folder="${folderName}">
                    <div class="folder-header" onclick="bookmarkManager.toggleFolder('${folderId}')">
                        <h3>${Utils.StringUtils.escapeHtml(folderName)}</h3>
                        <span class="folder-count">${bookmarks.length}</span>
                        <button class="folder-toggle" id="toggle-${folderId}">▼</button>
                    </div>
                    <div class="bookmark-grid" id="grid-${folderId}">
                        ${bookmarks.map(bookmark => this.renderBookmarkCard(bookmark)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.bindBookmarkEvents();
    }

    /**
     * 渲染书签卡片
     * @param {Object} bookmark - 书签对象
     * @returns {string}
     */
    renderBookmarkCard(bookmark) {
        const highlightedTitle = this.searchKeyword ? 
            Utils.StringUtils.highlight(bookmark.title, this.searchKeyword) : 
            Utils.StringUtils.escapeHtml(bookmark.title);
        
        const highlightedDescription = this.searchKeyword ? 
            Utils.StringUtils.highlight(bookmark.description, this.searchKeyword) : 
            Utils.StringUtils.escapeHtml(bookmark.description);

        return `
            <div class="bookmark-card" onclick="bookmarkManager.openBookmark('${bookmark.url}')">
                <div class="bookmark-title">${highlightedTitle}</div>
                <div class="bookmark-url">${Utils.StringUtils.escapeHtml(bookmark.domain)}</div>
                <div class="bookmark-description">${highlightedDescription}</div>
                <div class="bookmark-tags">
                    ${bookmark.tags.map(tag => 
                        `<span class="bookmark-tag" onclick="event.stopPropagation(); bookmarkManager.filterByTag('${tag}')">${Utils.StringUtils.escapeHtml(tag)}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染文件夹列表
     */
    renderFolders() {
        const container = Utils.DOM.get('#folderList');
        
        if (this.currentFolders.length === 0) {
            container.innerHTML = '<div class="loading">暂无文件夹</div>';
            return;
        }

        const html = this.currentFolders.map(folder => `
            <div class="folder-item" data-folder="${folder.title}" onclick="bookmarkManager.selectFolder('${folder.title}')">
                <svg class="folder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="folder-name">${Utils.StringUtils.escapeHtml(folder.title)}</span>
                <span class="folder-count">${folder.children.length}</span>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * 绑定书签相关事件
     */
    bindBookmarkEvents() {
        // 事件已通过onclick属性绑定，这里可以添加其他需要的事件
    }

    /**
     * 切换文件夹展开/折叠
     * @param {string} folderId - 文件夹ID
     */
    toggleFolder(folderId) {
        const grid = Utils.DOM.get(`#grid-${folderId}`);
        const toggle = Utils.DOM.get(`#toggle-${folderId}`);
        
        if (grid.style.display === 'none') {
            grid.style.display = 'grid';
            toggle.textContent = '▼';
        } else {
            grid.style.display = 'none';
            toggle.textContent = '▶';
        }
    }

    /**
     * 打开书签
     * @param {string} url - 书签URL
     */
    openBookmark(url) {
        window.open(url, '_blank');
    }

    /**
     * 切换搜索框显示
     */
    toggleSearch() {
        const searchSection = Utils.DOM.get('.search-section');
        const searchInput = Utils.DOM.get('#searchInput');
        
        if (searchSection.style.display === 'none') {
            searchSection.style.display = 'block';
            searchInput.focus();
        } else {
            searchSection.style.display = 'none';
        }
    }

    /**
     * 回到首页
     */
    goHome() {
        this.selectedFolder = null;
        this.searchKeyword = '';
        Utils.DOM.get('#searchInput').value = '';
        
        // 重置文件夹选中状态
        Utils.DOM.getAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.applyFilters();
    }

    /**
     * 滚动到书签区域
     */
    scrollToBookmarks() {
        const bookmarksSection = Utils.DOM.get('#bookmarksSection');
        bookmarksSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyboard(event) {
        // Ctrl/Cmd + F: 聚焦搜索框
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            const searchInput = Utils.DOM.get('#searchInput');
            searchInput.focus();
            searchInput.select();
        }
        
        // Escape: 关闭模态框
        if (event.key === 'Escape') {
            const openModal = Utils.DOM.get('.modal.show');
            if (openModal) {
                this.hideModal(openModal.id);
            }
        }
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        const loading = Utils.DOM.get('#loadingOverlay');
        Utils.DOM.show(loading);
    }

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        const loading = Utils.DOM.get('#loadingOverlay');
        Utils.DOM.hide(loading);
    }
}

// 初始化应用
let bookmarkManager;

document.addEventListener('DOMContentLoaded', () => {
    bookmarkManager = new BookmarkManager();
    
    // 添加通知样式
    const notificationStyles = `
        <style>
        .notification-container {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 4000;
            max-width: 400px;
        }
        
        .notification {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification-success {
            border-left: 4px solid #34a853;
        }
        
        .notification-error {
            border-left: 4px solid #ea4335;
        }
        
        .notification-warning {
            border-left: 4px solid #fbbc04;
        }
        
        .notification-info {
            border-left: 4px solid #4285f4;
        }
        
        .notification-message {
            flex: 1;
            color: #202124;
            font-weight: 500;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            color: #5f6368;
            cursor: pointer;
            padding: 4px;
            margin-left: 12px;
        }
        
        .notification-close:hover {
            color: #202124;
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', notificationStyles);
});

// 导出全局实例
window.bookmarkManager = bookmarkManager;