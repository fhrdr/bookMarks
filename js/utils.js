/**
 * 工具函数库
 * 包含通用的辅助函数和DOM操作方法
 */

// DOM 操作工具
const DOM = {
    /**
     * 获取元素
     * @param {string} selector - CSS选择器
     * @returns {Element|null}
     */
    get(selector) {
        return document.querySelector(selector);
    },

    /**
     * 获取所有匹配的元素
     * @param {string} selector - CSS选择器
     * @returns {NodeList}
     */
    getAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * 创建元素
     * @param {string} tag - 标签名
     * @param {Object} attributes - 属性对象
     * @param {string} content - 内容
     * @returns {Element}
     */
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    },

    /**
     * 添加事件监听器
     * @param {Element} element - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    on(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    },

    /**
     * 移除事件监听器
     * @param {Element} element - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    },

    /**
     * 显示元素
     * @param {Element} element - 目标元素
     */
    show(element) {
        if (element) {
            element.style.display = '';
            element.classList.add('show');
        }
    },

    /**
     * 隐藏元素
     * @param {Element} element - 目标元素
     */
    hide(element) {
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.style.display = 'none';
            }, 300);
        }
    },

    /**
     * 切换元素显示状态
     * @param {Element} element - 目标元素
     */
    toggle(element) {
        if (element) {
            if (element.classList.contains('show')) {
                this.hide(element);
            } else {
                this.show(element);
            }
        }
    }
};

// 字符串工具
const StringUtils = {
    /**
     * 截断字符串
     * @param {string} str - 原字符串
     * @param {number} length - 最大长度
     * @param {string} suffix - 后缀
     * @returns {string}
     */
    truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str || '';
        return str.substring(0, length) + suffix;
    },

    /**
     * 转义HTML字符
     * @param {string} str - 原字符串
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 提取域名
     * @param {string} url - URL字符串
     * @returns {string}
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return url;
        }
    },

    /**
     * 生成随机ID
     * @param {number} length - ID长度
     * @returns {string}
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * 搜索高亮
     * @param {string} text - 原文本
     * @param {string} keyword - 关键词
     * @returns {string}
     */
    highlight(text, keyword) {
        if (!keyword || !text) return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// 数组工具
const ArrayUtils = {
    /**
     * 数组去重
     * @param {Array} arr - 原数组
     * @param {string} key - 去重键名（对象数组）
     * @returns {Array}
     */
    unique(arr, key = null) {
        if (!Array.isArray(arr)) return [];
        
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(arr)];
    },

    /**
     * 数组分组
     * @param {Array} arr - 原数组
     * @param {string|Function} key - 分组键名或函数
     * @returns {Object}
     */
    groupBy(arr, key) {
        if (!Array.isArray(arr)) return {};
        
        return arr.reduce((groups, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    },

    /**
     * 数组排序
     * @param {Array} arr - 原数组
     * @param {string} key - 排序键名
     * @param {string} order - 排序方向 ('asc' | 'desc')
     * @returns {Array}
     */
    sortBy(arr, key, order = 'asc') {
        if (!Array.isArray(arr)) return [];
        
        return [...arr].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
};

// 存储工具
const Storage = {
    /**
     * 设置本地存储
     * @param {string} key - 键名
     * @param {*} value - 值
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('存储失败:', e);
        }
    },

    /**
     * 获取本地存储
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('读取存储失败:', e);
            return defaultValue;
        }
    },

    /**
     * 删除本地存储
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('删除存储失败:', e);
        }
    },

    /**
     * 清空本地存储
     */
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('清空存储失败:', e);
        }
    }
};

// 文件工具
const FileUtils = {
    /**
     * 读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<string>}
     */
    readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * 下载文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} type - MIME类型
     */
    download(content, filename, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 验证文件类型
     * @param {File} file - 文件对象
     * @param {Array<string>} allowedTypes - 允许的类型
     * @returns {boolean}
     */
    validateType(file, allowedTypes = []) {
        if (!file || !allowedTypes.length) return true;
        return allowedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return file.type === type;
        });
    }
};

// 时间工具
const TimeUtils = {
    /**
     * 格式化时间
     * @param {Date|number} date - 日期对象或时间戳
     * @param {string} format - 格式字符串
     * @returns {string}
     */
    format(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 获取相对时间
     * @param {Date|number} date - 日期对象或时间戳
     * @returns {string}
     */
    relative(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = now - target;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    }
};

// 防抖和节流
const Throttle = {
    /**
     * 防抖函数
     * @param {Function} func - 目标函数
     * @param {number} delay - 延迟时间
     * @returns {Function}
     */
    debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 目标函数
     * @param {number} delay - 延迟时间
     * @returns {Function}
     */
    throttle(func, delay = 300) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    }
};

// 通知工具
const Notification = {
    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    success(message) {
        this.show(message, 'success');
    },

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    error(message) {
        this.show(message, 'error');
    },

    /**
     * 显示警告消息
     * @param {string} message - 消息内容
     */
    warning(message) {
        this.show(message, 'warning');
    },

    /**
     * 显示信息消息
     * @param {string} message - 消息内容
     */
    info(message) {
        this.show(message, 'info');
    },

    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    show(message, type = 'info') {
        // 创建通知容器（如果不存在）
        let container = DOM.get('.notification-container');
        if (!container) {
            container = DOM.create('div', { className: 'notification-container' });
            document.body.appendChild(container);
        }

        // 创建通知元素
        const notification = DOM.create('div', {
            className: `notification notification-${type}`,
            innerHTML: `
                <span class="notification-message">${StringUtils.escapeHtml(message)}</span>
                <button class="notification-close">&times;</button>
            `
        });

        // 添加到容器
        container.appendChild(notification);

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 10);

        // 自动隐藏
        const hideTimeout = setTimeout(() => this.hide(notification), 5000);

        // 点击关闭
        const closeBtn = notification.querySelector('.notification-close');
        DOM.on(closeBtn, 'click', () => {
            clearTimeout(hideTimeout);
            this.hide(notification);
        });
    },

    /**
     * 隐藏通知
     * @param {Element} notification - 通知元素
     */
    hide(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
};

// 导出工具对象
window.Utils = {
    DOM,
    StringUtils,
    ArrayUtils,
    Storage,
    FileUtils,
    TimeUtils,
    Throttle,
    Notification
};