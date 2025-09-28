/**
 * API 接口模块
 * 包含Chrome书签获取和AI整理功能的接口
 */

class BookmarkAPI {
    constructor() {
        this.bookmarks = [];
        this.folders = [];
        this.isSupported = this.checkSupport();
    }

    /**
     * 检查浏览器支持
     * @returns {boolean}
     */
    checkSupport() {
        return typeof chrome !== 'undefined' && 
               chrome.bookmarks && 
               typeof chrome.bookmarks.getTree === 'function';
    }

    /**
     * 获取Chrome书签
     * @returns {Promise<Object>}
     */
    async getBookmarks() {
        try {
            // 检查是否在Chrome扩展环境中
            if (this.isSupported) {
                return await this.getChromeBookmarks();
            }
            
            // 如果不在扩展环境中，提供文件导入方式
            return await this.getBookmarksFromFile();
            
        } catch (error) {
            console.error('获取书签失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 从Chrome扩展API获取书签
     * @returns {Promise<Object>}
     */
    async getChromeBookmarks() {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                const result = this.parseBookmarkTree(bookmarkTreeNodes);
                this.bookmarks = result.bookmarks;
                this.folders = result.folders;
                
                resolve({
                    success: true,
                    data: {
                        bookmarks: this.bookmarks,
                        folders: this.folders,
                        total: this.bookmarks.length
                    }
                });
            });
        });
    }

    /**
     * 通过文件导入获取书签（Chrome书签导出文件）
     * @returns {Promise<Object>}
     */
    async getBookmarksFromFile() {
        return new Promise((resolve, reject) => {
            // 创建文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.html,.json';
            fileInput.style.display = 'none';
            
            fileInput.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }

                try {
                    const content = await Utils.FileUtils.readAsText(file);
                    let result;

                    if (file.name.endsWith('.html')) {
                        // 解析Chrome导出的HTML书签文件
                        result = this.parseHTMLBookmarks(content);
                    } else if (file.name.endsWith('.json')) {
                        // 解析JSON格式的书签文件
                        result = this.parseJSONBookmarks(content);
                    } else {
                        throw new Error('不支持的文件格式，请选择HTML或JSON文件');
                    }

                    this.bookmarks = result.bookmarks;
                    this.folders = result.folders;

                    resolve({
                        success: true,
                        data: {
                            bookmarks: this.bookmarks,
                            folders: this.folders,
                            total: this.bookmarks.length
                        }
                    });
                } catch (error) {
                    reject(error);
                } finally {
                    document.body.removeChild(fileInput);
                }
            };

            fileInput.oncancel = () => {
                document.body.removeChild(fileInput);
                reject(new Error('用户取消了文件选择'));
            };

            document.body.appendChild(fileInput);
            fileInput.click();
        });
    }

    /**
     * 解析Chrome导出的HTML书签文件
     * @param {string} htmlContent - HTML内容
     * @returns {Object}
     */
    // parseHTMLBookmarks(htmlContent) {
    //     console.log('开始解析HTML书签文件...');
        
    //     try {
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(htmlContent, 'text/html');
    //         const bookmarks = [];
    //         const folders = [];
            
    //         function walk(dlElement, currentPath = '') {
    //             // 获取所有直接子元素，包括DT和DL
    //             const children = Array.from(dlElement.children);
                
    //             for (let i = 0; i < children.length; i++) {
    //                 const child = children[i];
                    
    //                 if (child.tagName === 'DT') {
    //                     const firstChild = child.firstElementChild;
    //                     if (!firstChild) continue;
                        
    //                     if (firstChild.tagName === 'H3') {
    //                         // 这是一个文件夹
    //                         const folderTitle = firstChild.textContent.trim();
    //                         const folderPath = currentPath ? `${currentPath}/${folderTitle}` : folderTitle;
                            
    //                         const folder = {
    //                             id: Utils.StringUtils.generateId(),
    //                             title: folderTitle,
    //                             path: folderPath,
    //                             parentPath: currentPath,
    //                             children: []
    //                         };
    //                         folders.push(folder);
    //                         console.log('解析到文件夹:', folderTitle, '路径:', folderPath);
                            
    //                         // 查找紧跟的DL元素（文件夹内容）
    //                         if (i + 1 < children.length && children[i + 1].tagName === 'DL') {
    //                             walk(children[i + 1], folderPath);
    //                             i++; // 跳过已处理的DL元素
    //                         }
                            
    //                     } else if (firstChild.tagName === 'A') {
    //                         // 这是一个书签
    //                         let url = firstChild.getAttribute('HREF') || '';
    //                         // 清理URL中的反引号和多余空格
    //                         url = url.replace(/`/g, '').trim();
                            
    //                         const bookmark = {
    //                             id: Utils.StringUtils.generateId(),
    //                             title: firstChild.textContent.trim() || '无标题',
    //                             url: url,
    //                             folder: currentPath || '根目录',
    //                             dateAdded: firstChild.getAttribute('ADD_DATE') ? 
    //                                 new Date(parseInt(firstChild.getAttribute('ADD_DATE')) * 1000) : 
    //                                 new Date(),
    //                             description: this.generateDescription(firstChild.textContent, url),
    //                             tags: this.generateTags(firstChild.textContent, url),
    //                             domain: Utils.StringUtils.extractDomain(url)
    //                         };
    //                         bookmarks.push(bookmark);
    //                         console.log('解析到书签:', bookmark.title, 'URL:', bookmark.url, '文件夹:', currentPath);
    //                     }
    //                 }
    //             }
    //         }
            
    //         // 从根DL开始解析
    //         const rootDL = doc.querySelector('DL');
    //         if (!rootDL) {
    //             throw new Error('无效的书签文件：找不到根DL元素');
    //         }
            
    //         walk(rootDL);
            
    //         console.log('解析完成！');
    //         console.log('总共找到', bookmarks.length, '个书签');
    //         console.log('总共找到', folders.length, '个文件夹');
    //         console.log('书签详情:', bookmarks.map(b => `${b.title} (${b.folder})`));
    //         console.log('文件夹详情:', folders.map(f => f.path));
            
    //         return { bookmarks, folders };
            
    //     } catch (error) {
    //         console.error('解析HTML书签时出错:', error);
    //         throw error;
    //     }
    // }
    parseHTMLBookmarks(htmlContent) {
        console.log('开始解析HTML书签文件...');
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // 修复 this 指向问题：提前绑定方法或使用箭头函数
            const generateDescription = (title, url) => this.generateDescription?.(title, url) || '';
            const generateTags = (title, url) => this.generateTags?.(title, url) || [];

            function walk(dlElement, currentPath = '') {
            const result = [];
            // 过滤掉 <p> 等无关元素，只保留 DT 和 DL
            const nodes = Array.from(dlElement.children).filter(el => 
                el.tagName === 'DT' || el.tagName === 'DL'
            );

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.tagName === 'DT') {
                const firstChild = node.firstElementChild;
                if (!firstChild) continue;

                if (firstChild.tagName === 'H3') {
                    // 文件夹
                    const title = firstChild.textContent.trim();
                    const folderPath = currentPath ? `${currentPath}/${title}` : title;
                    const folder = {
                    type: 'folder',
                    id: Utils.StringUtils.generateId(),
                    title,
                    path: folderPath,
                    parentPath: currentPath,
                    children: []
                    };

                    // 查看下一个是否是 DL（内容）
                    if (i + 1 < nodes.length && nodes[i + 1].tagName === 'DL') {
                    folder.children = walk(nodes[i + 1], folderPath);
                    i++; // 跳过 DL
                    }

                    result.push(folder);
                } else if (firstChild.tagName === 'A') {
                    // 书签
                    const url = (firstChild.getAttribute('HREF') || '').replace(/`/g, '').trim();
                    const bookmark = {
                    type: 'bookmark',
                    id: Utils.StringUtils.generateId(),
                    title: firstChild.textContent.trim() || '无标题',
                    url,
                    folder: currentPath || '根目录',
                    path: currentPath ? `${currentPath}/${firstChild.textContent.trim()}` : firstChild.textContent.trim(),
                    dateAdded: firstChild.getAttribute('ADD_DATE') ? 
                        new Date(parseInt(firstChild.getAttribute('ADD_DATE')) * 1000) : 
                        new Date(),
                    description: generateDescription(firstChild.textContent, url),
                    tags: generateTags(firstChild.textContent, url),
                    domain: Utils.StringUtils.extractDomain(url)
                    };
                    result.push(bookmark);
                }
                }
            }
            return result;
            }

            const rootDL = doc.querySelector('DL');
            if (!rootDL) throw new Error('无效的书签文件：找不到根DL元素');

            const tree = walk(rootDL);
            
            // 如果你仍需要扁平数组，可以额外遍历 tree 提取
            const bookmarks = [];
            const folders = [];
            function flatten(items, parentPath = '') {
            for (const item of items) {
                if (item.type === 'bookmark') {
                bookmarks.push(item);
                } else if (item.type === 'folder') {
                folders.push(item);
                flatten(item.children, item.path);
                }
            }
            }
            flatten(tree);

            console.log('解析完成！');
            console.log('总共找到', bookmarks.length, '个书签');
            console.log('总共找到', folders.length, '个文件夹');

            return { tree, bookmarks, folders }; // 同时返回树和扁平结构

        } catch (error) {
            console.error('解析HTML书签时出错:', error);
            throw error;
        }
    }

    /**
     * 解析JSON格式的书签文件
     * @param {string} jsonContent - JSON内容
     * @returns {Object}
     */
    parseJSONBookmarks(jsonContent) {
        try {
            const data = JSON.parse(jsonContent);
            
            // 如果是我们自己导出的格式
            if (data.bookmarks && Array.isArray(data.bookmarks)) {
                return {
                    bookmarks: data.bookmarks,
                    folders: data.folders || []
                };
            }
            
            // 如果是Chrome原生JSON格式
            if (data.roots) {
                return this.parseBookmarkTree([data.roots.bookmark_bar, data.roots.other, data.roots.synced]);
            }
            
            throw new Error('无法识别的JSON书签格式');
        } catch (error) {
            throw new Error(`解析JSON文件失败: ${error.message}`);
        }
    }

    /**
     * 解析书签树
     * @param {Array} bookmarkTreeNodes - 书签树节点
     * @returns {Object}
     */
    parseBookmarkTree(bookmarkTreeNodes) {
        const bookmarks = [];
        const folders = [];
        const folderMap = new Map();

        const traverse = (nodes, parentPath = '') => {
            nodes.forEach(node => {
                if (node.children) {
                    // 文件夹
                    const folderPath = parentPath ? `${parentPath}/${node.title}` : node.title;
                    
                    if (node.title && node.title !== '书签栏' && node.title !== '其他书签') {
                        const folder = {
                            id: node.id,
                            title: node.title,
                            path: folderPath,
                            parentPath: parentPath,
                            children: []
                        };
                        
                        folders.push(folder);
                        folderMap.set(node.id, folder);
                    }
                    
                    // 递归处理子节点
                    traverse(node.children, folderPath);
                } else if (node.url) {
                    // 书签
                    const bookmark = {
                        id: node.id,
                        title: node.title || '无标题',
                        url: node.url,
                        folder: parentPath || '根目录',
                        dateAdded: node.dateAdded ? new Date(node.dateAdded) : new Date(),
                        description: this.generateDescription(node.title, node.url),
                        tags: this.generateTags(node.title, node.url),
                        domain: Utils.StringUtils.extractDomain(node.url)
                    };
                    
                    bookmarks.push(bookmark);
                    
                    // 添加到对应文件夹
                    const parentFolder = Array.from(folderMap.values())
                        .find(f => f.path === parentPath);
                    if (parentFolder) {
                        parentFolder.children.push(bookmark);
                    }
                }
            });
        };

        traverse(bookmarkTreeNodes);
        
        return { bookmarks, folders };
    }

    /**
     * 生成书签描述
     * @param {string} title - 标题
     * @param {string} url - URL
     * @returns {string}
     */
    generateDescription(title, url) {
        const domain = Utils.StringUtils.extractDomain(url);
        return `来自 ${domain} 的书签`;
    }

    /**
     * 生成书签标签
     * @param {string} title - 标题
     * @param {string} url - URL
     * @returns {Array<string>}
     */
    generateTags(title, url) {
        const tags = [];
        const domain = Utils.StringUtils.extractDomain(url);
        
        // 根据域名生成标签
        if (domain.includes('github')) tags.push('开发');
        if (domain.includes('stackoverflow')) tags.push('编程');
        if (domain.includes('youtube')) tags.push('视频');
        if (domain.includes('bilibili')) tags.push('视频');
        if (domain.includes('zhihu')) tags.push('问答');
        if (domain.includes('baidu') || domain.includes('google')) tags.push('搜索');
        if (domain.includes('taobao') || domain.includes('jd')) tags.push('购物');
        if (domain.includes('weibo') || domain.includes('twitter')) tags.push('社交');
        
        // 根据标题生成标签
        const titleLower = title.toLowerCase();
        if (titleLower.includes('doc') || titleLower.includes('文档')) tags.push('文档');
        if (titleLower.includes('tutorial') || titleLower.includes('教程')) tags.push('教程');
        if (titleLower.includes('news') || titleLower.includes('新闻')) tags.push('新闻');
        if (titleLower.includes('blog') || titleLower.includes('博客')) tags.push('博客');
        
        return Utils.ArrayUtils.unique(tags);
    }

    /**
     * 获取模拟书签数据（用于演示）
     * @returns {Promise<Object>}
     */
    async getMockBookmarks() {
        const mockData = {
            bookmarks: [
                {
                    id: '1',
                    title: 'GitHub',
                    url: 'https://github.com',
                    folder: '开发工具',
                    dateAdded: new Date('2024-01-01'),
                    description: '全球最大的代码托管平台',
                    tags: ['开发', '代码'],
                    domain: 'github.com'
                },
                {
                    id: '2',
                    title: 'Stack Overflow',
                    url: 'https://stackoverflow.com',
                    folder: '开发工具',
                    dateAdded: new Date('2024-01-02'),
                    description: '程序员问答社区',
                    tags: ['编程', '问答'],
                    domain: 'stackoverflow.com'
                },
                {
                    id: '3',
                    title: 'MDN Web Docs',
                    url: 'https://developer.mozilla.org',
                    folder: '文档',
                    dateAdded: new Date('2024-01-03'),
                    description: 'Web开发文档',
                    tags: ['文档', '开发'],
                    domain: 'developer.mozilla.org'
                },
                {
                    id: '4',
                    title: 'Vue.js',
                    url: 'https://vuejs.org',
                    folder: '前端框架',
                    dateAdded: new Date('2024-01-04'),
                    description: '渐进式JavaScript框架',
                    tags: ['前端', '框架'],
                    domain: 'vuejs.org'
                },
                {
                    id: '5',
                    title: 'React',
                    url: 'https://reactjs.org',
                    folder: '前端框架',
                    dateAdded: new Date('2024-01-05'),
                    description: '用于构建用户界面的JavaScript库',
                    tags: ['前端', '框架'],
                    domain: 'reactjs.org'
                }
            ],
            folders: [
                {
                    id: 'f1',
                    title: '开发工具',
                    path: '开发工具',
                    parentPath: '',
                    children: []
                },
                {
                    id: 'f2',
                    title: '文档',
                    path: '文档',
                    parentPath: '',
                    children: []
                },
                {
                    id: 'f3',
                    title: '前端框架',
                    path: '前端框架',
                    parentPath: '',
                    children: []
                }
            ]
        };

        // 将书签分配到对应文件夹
        mockData.bookmarks.forEach(bookmark => {
            const folder = mockData.folders.find(f => f.title === bookmark.folder);
            if (folder) {
                folder.children.push(bookmark);
            }
        });

        this.bookmarks = mockData.bookmarks;
        this.folders = mockData.folders;

        return {
            success: true,
            data: {
                bookmarks: mockData.bookmarks,
                folders: mockData.folders,
                total: mockData.bookmarks.length
            }
        };
    }

    /**
     * 搜索书签
     * @param {string} keyword - 搜索关键词
     * @param {Array} bookmarks - 书签数组
     * @returns {Array}
     */
    searchBookmarks(keyword, bookmarks = null) {
        const targetBookmarks = bookmarks || this.bookmarks;
        
        if (!keyword || !keyword.trim()) {
            return targetBookmarks;
        }

        const searchTerm = keyword.toLowerCase().trim();
        
        return targetBookmarks.filter(bookmark => {
            return bookmark.title.toLowerCase().includes(searchTerm) ||
                   bookmark.url.toLowerCase().includes(searchTerm) ||
                   bookmark.description.toLowerCase().includes(searchTerm) ||
                   bookmark.folder.toLowerCase().includes(searchTerm) ||
                   bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * 按文件夹筛选书签
     * @param {string} folderName - 文件夹名称
     * @param {Array} bookmarks - 书签数组
     * @returns {Array}
     */
    filterByFolder(folderName, bookmarks = null) {
        const targetBookmarks = bookmarks || this.bookmarks;
        
        if (!folderName) {
            return targetBookmarks;
        }

        return targetBookmarks.filter(bookmark => bookmark.folder === folderName);
    }

    /**
     * 按标签筛选书签
     * @param {string} tag - 标签
     * @param {Array} bookmarks - 书签数组
     * @returns {Array}
     */
    filterByTag(tag, bookmarks = null) {
        const targetBookmarks = bookmarks || this.bookmarks;
        
        if (!tag) {
            return targetBookmarks;
        }

        return targetBookmarks.filter(bookmark => 
            bookmark.tags.includes(tag)
        );
    }

    /**
     * 导出书签数据
     * @returns {string}
     */
    exportBookmarks() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bookmarks: this.bookmarks,
            folders: this.folders,
            total: this.bookmarks.length
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 导入书签数据
     * @param {string} jsonData - JSON数据
     * @returns {Object}
     */
    importBookmarks(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
                throw new Error('无效的书签数据格式');
            }

            this.bookmarks = data.bookmarks;
            this.folders = data.folders || [];

            return {
                success: true,
                data: {
                    bookmarks: this.bookmarks,
                    folders: this.folders,
                    total: this.bookmarks.length
                }
            };
        } catch (error) {
            console.error('导入书签失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * AI整理API类
 */
class AIOrganizeAPI {
    constructor() {
        this.apiKey = '';
        this.model = 'gpt-3.5-turbo';
        this.baseURL = 'https://api.openai.com/v1';
    }

    /**
     * 设置API配置
     * @param {Object} config - 配置对象
     */
    setConfig(config) {
        this.apiKey = config.apiKey || this.apiKey;
        this.model = config.model || this.model;
        this.baseURL = config.baseURL || this.baseURL;
    }

    /**
     * 整理书签标题和描述
     * @param {Array} bookmarks - 书签数组
     * @returns {Promise<Object>}
     */
    async organizeBookmarks(bookmarks) {
        try {
            if (!this.apiKey) {
                throw new Error('请先设置API Key');
            }

            // 模拟AI整理结果（实际项目中需要调用真实的AI API）
            const organizedBookmarks = await this.mockOrganizeBookmarks(bookmarks);

            return {
                success: true,
                data: organizedBookmarks
            };
        } catch (error) {
            console.error('AI整理失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 模拟AI整理书签（演示用）
     * @param {Array} bookmarks - 书签数组
     * @returns {Promise<Array>}
     */
    async mockOrganizeBookmarks(bookmarks) {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 2000));

        return bookmarks.map(bookmark => ({
            ...bookmark,
            title: this.optimizeTitle(bookmark.title),
            description: this.optimizeDescription(bookmark.title, bookmark.url),
            tags: this.optimizeTags(bookmark.title, bookmark.url, bookmark.tags)
        }));
    }

    /**
     * 优化标题
     * @param {string} title - 原标题
     * @returns {string}
     */
    optimizeTitle(title) {
        // 简单的标题优化逻辑
        return title
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^(.{50}).*/, '$1...');
    }

    /**
     * 优化描述
     * @param {string} title - 标题
     * @param {string} url - URL
     * @returns {string}
     */
    optimizeDescription(title, url) {
        const domain = Utils.StringUtils.extractDomain(url);
        
        // 根据域名生成更详细的描述
        const descriptions = {
            'github.com': '开源代码托管和协作平台',
            'stackoverflow.com': '程序员技术问答社区',
            'developer.mozilla.org': 'Web开发技术文档',
            'vuejs.org': 'Vue.js官方文档和资源',
            'reactjs.org': 'React官方文档和教程'
        };

        return descriptions[domain] || `${title} - 来自 ${domain}`;
    }

    /**
     * 优化标签
     * @param {string} title - 标题
     * @param {string} url - URL
     * @param {Array} existingTags - 现有标签
     * @returns {Array}
     */
    optimizeTags(title, url, existingTags = []) {
        const newTags = [...existingTags];
        const domain = Utils.StringUtils.extractDomain(url);
        const titleLower = title.toLowerCase();

        // 智能标签建议
        const tagSuggestions = {
            'github.com': ['开源', '代码', 'Git'],
            'stackoverflow.com': ['问答', '编程', '技术'],
            'developer.mozilla.org': ['文档', 'Web', 'API'],
            'vuejs.org': ['Vue', '前端', '框架'],
            'reactjs.org': ['React', '前端', '组件']
        };

        if (tagSuggestions[domain]) {
            newTags.push(...tagSuggestions[domain]);
        }

        // 根据标题内容添加标签
        if (titleLower.includes('tutorial')) newTags.push('教程');
        if (titleLower.includes('guide')) newTags.push('指南');
        if (titleLower.includes('api')) newTags.push('API');
        if (titleLower.includes('doc')) newTags.push('文档');

        return Utils.ArrayUtils.unique(newTags);
    }

    /**
     * 调用真实的AI API（预留接口）
     * @param {string} prompt - 提示词
     * @returns {Promise<string>}
     */
    async callAI(prompt) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的书签整理助手，帮助用户优化书签的标题、描述和分类。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI API调用失败:', error);
            throw error;
        }
    }
}

// 导出API实例
window.BookmarkAPI = BookmarkAPI;
window.AIOrganizeAPI = AIOrganizeAPI;