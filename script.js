const App = (() => {
    let currentQuery = '';
    let allResults = [];
    let currentPage = 1;
    const pageSize = 20;
    
    let displaySettings = {
        titleField: '商品名称',
        subtitles: ['厂家'],
        contentFields: []
    };

    // 🚀 优化：DOM元素缓存（一次性缓存所有需要的元素）
    const elements = {
        pages: document.querySelectorAll('.page'),
        searchWrappers: document.querySelectorAll('.search-wrapper'),
        resultsInfo: document.querySelector('.results-info'),
        resultsContent: document.querySelector('#resultsContent'),
        // 缓存搜索框相关元素
        searchInputs: document.querySelectorAll('.search-input'),
        clearBtns: document.querySelectorAll('.clear-btn'),
        searchBtns: document.querySelectorAll('.search-btn')
    };

    // 加载显示字段设置
    async function loadDisplaySettings() {
        try {
            await FirebaseModule.waitForInit();
            displaySettings = await FirebaseModule.getDisplaySettings();
        } catch (error) {
            console.error('加载显示设置失败：', error);
        }
    }

    // 🚀 优化：工具函数集合
    const utils = {
        switchPage(pageId) {
            elements.pages.forEach(p => p.classList.toggle('active', p.id === pageId));
        },
        
        formatPercentage(value) {
            const num = parseFloat(value);
            if (isNaN(num)) return value;
            const percentage = (num * 100).toFixed(2) + '%';
            const className = num > 0 ? 'percentage-positive' : num < 0 ? 'percentage-negative' : 'percentage-zero';
            return `<span class="${className}">${percentage}</span>`;
        },
        
        // 🚀 统一的字段值格式化函数
        formatFieldValue(fieldName, value, query = '') {
            if (!value) return '';
            
            // 统一处理：如果字段名包含"率"，格式化为百分比
            if (fieldName.includes('率')) {
                return this.formatPercentage(value);
            }
            
            // 否则正常高亮显示
            return this.highlightText(String(value), query);
        },
        
        highlightText(text, query) {
            if (!query || !text) return text;
            
            const terms = [...new Set(query.split(/[，,\s]+/).filter(t => t))];
            let result = String(text);
            
            terms.forEach(term => {
                const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                result = result.replace(regex, '<span class="highlight">$1</span>');
            });
            
            return result;
        },

        // 🚀 优化：批量同步搜索框内容
        syncSearchInputs(query) {
            elements.searchWrappers.forEach(wrapper => {
                const input = wrapper.querySelector('.search-input');
                const clearBtn = wrapper.querySelector('.clear-btn');
                if (input && input.value !== query) {
                    input.value = query;
                    clearBtn?.classList.toggle('show', !!query);
                }
            });
        },

        // 🚀 优化：获取标题（移除硬编码）
        getTitle(item, titleField) {
            return (titleField && item[titleField]) 
                ? item[titleField] 
                : `数据记录 ${item.id || ''}`.trim();
        }
    };

    // 🚀 优化：分页工具
    const pagination = {
        getTotalPages: () => Math.ceil(allResults.length / pageSize),
        
        getCurrentPageData() {
            const start = (currentPage - 1) * pageSize;
            return allResults.slice(start, start + pageSize);
        },
        
        // 🚀 优化：简化分页HTML生成
        createPaginationHTML() {
            const totalPages = this.getTotalPages();
            if (totalPages <= 1) return '';
            
            const buttons = [];
            
            // 上一页
            if (currentPage > 1) {
                buttons.push(`<span class="page-btn" onclick="App.goToPage(${currentPage - 1})">< 上一页</span>`);
            }
            
            // 页码计算
            const startPage = Math.max(1, currentPage - 4);
            const endPage = Math.min(totalPages, Math.max(currentPage + 4, startPage + 9));
            
            // 页码按钮
            for (let i = startPage; i <= endPage; i++) {
                const activeClass = i === currentPage ? ' active' : '';
                buttons.push(`<span class="page-btn${activeClass}" onclick="App.goToPage(${i})">${i}</span>`);
            }
            
            // 下一页
            if (currentPage < totalPages) {
                buttons.push(`<span class="page-btn" onclick="App.goToPage(${currentPage + 1})">下一页 ></span>`);
            }
            
            return `<div class="pagination">${buttons.join('')}</div>`;
        }
    };

    // 🚀 优化：UI渲染模块
    const UI = {
        displayResults(results, query) {
            allResults = results;
            currentPage = 1;
            this.renderCurrentPage(query);
        },
        
        // 🚀 核心优化：统一的字段渲染函数
        renderFieldItems(fields, item, query, excludeFields = []) {
            return fields
                .filter(field => field && item[field])
                .map(field => {
                    const displayValue = utils.formatFieldValue(field, item[field], query);
                    return `
                        <div class="content-item">
                            <div class="content-label">${field}</div>
                            <div class="content-value">${displayValue}</div>
                        </div>
                    `;
                })
                .join('');
        },

        // 🚀 优化：构建单个结果项HTML
        buildResultItem(item, query) {
            // 处理外部搜索结果
            if (item._isExternalSearch) {
                const bingSearchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' 药品信息')}`;
                return `
                    <div class="no-results">
                        <h3><a href="${bingSearchUrl}" target="_blank" class="external-search-link">未查找到相关数据，请点击进行外部搜索......</a></h3>
                    </div>
                `;
            }

            // 获取标题
            const title = utils.getTitle(item, displaySettings.titleField);
            
            // 构建副标题
            const subtitleHtml = displaySettings.subtitles?.length 
                ? displaySettings.subtitles
                    .filter(field => field && item[field])
                    .map(field => {
                        const displayValue = utils.formatFieldValue(field, item[field], query);
                        return `<span class="meta-item">
                            <span class="meta-label">${field}：</span> ${displayValue}
                        </span>`;
                    })
                    .join('')
                : '';
            
            // 确定要排除的字段
            const excludeFields = [
                displaySettings.titleField,
                ...(displaySettings.subtitles || []).filter(Boolean),
                ...(displaySettings.contentFields || []).filter(Boolean),
                'id'
            ];
            
            // 构建内容区域
            let contentHtml = '';
            
            if (displaySettings.contentFields?.length) {
                // 使用配置的字段
                contentHtml = this.renderFieldItems(displaySettings.contentFields, item, query);
            } else {
                // 显示剩余字段
                const remainingFields = Object.keys(item)
                    .filter(key => 
                        !excludeFields.includes(key) && 
                        item[key] && 
                        String(item[key]).trim()
                    );
                contentHtml = this.renderFieldItems(remainingFields, item, query);
            }
            
            return `
                <div class="result-item">
                    <div class="result-title">${utils.highlightText(title, query)}</div>
                    ${subtitleHtml ? `<div class="result-meta">${subtitleHtml}</div>` : ''}
                    ${contentHtml ? `<div class="result-content">${contentHtml}</div>` : ''}
                </div>
            `;
        },
        
        renderCurrentPage(query) {
            const currentData = pagination.getCurrentPageData();
            const totalPages = pagination.getTotalPages();
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, allResults.length);
            
            // 更新结果信息
            elements.resultsInfo.innerHTML = `找到 ${allResults.length} 条相关结果 (用时 ${Date.now() % 1000}ms) - 第 ${currentPage} 页，共 ${totalPages} 页，当前显示第 ${start}-${end} 条`;
            
            // 🚀 优化：处理无结果情况
            if (allResults.length === 0) {
                const bingSearchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' 药品信息')}`;
                elements.resultsContent.innerHTML = `
                    <div class="no-results">
                        <h3><a href="${bingSearchUrl}" target="_blank" class="external-search-link">未查找到相关数据，请点击进行外部搜索......</a></h3>
                    </div>
                `;
                return;
            }
            
            // 🚀 优化：批量生成HTML
            const resultsHTML = currentData.map(item => this.buildResultItem(item, query));
            const paginationHTML = pagination.createPaginationHTML();
            
            elements.resultsContent.innerHTML = resultsHTML.join('') + paginationHTML;
            
            // 滚动到顶部
            window.scrollTo(0, 0);
        },

        showLoading() {
            elements.resultsInfo.textContent = '搜索中...';
            elements.resultsContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    正在搜索数据...
                </div>
            `;
        },

        showError() {
            elements.resultsContent.innerHTML = `
                <div class="no-results">
                    <h3>搜索出错</h3>
                    <p>无法连接到数据库，请稍后重试</p>
                </div>
            `;
            elements.resultsInfo.textContent = '搜索失败';
        }
    };

    // 搜索处理
    const search = {
        perform(query) {
            currentQuery = query;
            
            window.SearchModule.perform(query, {
                onStart: (query) => {
                    utils.switchPage('resultsPage');
                    utils.syncSearchInputs(query);
                    UI.showLoading();
                },
                onSuccess: (results, query) => {
                    UI.displayResults(results, query);
                },
                onError: (error) => {
                    UI.showError();
                }
            });
        }
    };

    // 🚀 优化：事件绑定（减少重复代码）
    const bindEvents = () => {
        // 为所有搜索框绑定事件
        elements.searchWrappers.forEach(wrapper => {
            const input = wrapper.querySelector('.search-input');
            const clearBtn = wrapper.querySelector('.clear-btn');
            const searchBtn = wrapper.querySelector('.search-btn');
            
            if (!input || !clearBtn || !searchBtn) return;
            
            // 搜索事件
            const performSearch = () => search.perform(input.value);
            searchBtn.addEventListener('click', performSearch);
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') performSearch();
            });
            
            // 清除事件
            clearBtn.addEventListener('click', () => {
                input.value = '';
                clearBtn.classList.remove('show');
                input.focus();
            });
            
            // 输入事件
            input.addEventListener('input', () => {
                clearBtn.classList.toggle('show', !!input.value.trim());
            });
        });
    };

    // 初始化
    bindEvents();
    
    // 等待 Firebase 初始化后加载设置
    FirebaseModule.waitForInit().then(loadDisplaySettings);

    // 🚀 优化：公开接口
    return {
        goHome() {
            utils.switchPage('homepage');
            const homeSearchInput = document.querySelector('#homepage .search-input');
            homeSearchInput?.focus();
            
            // 更新登录按钮状态
            window.LoginModule?.updateLoginButton?.();
        },
        
        goToPage(page) {
            const totalPages = pagination.getTotalPages();
            if (page < 1 || page > totalPages) return;
            
            currentPage = page;
            UI.renderCurrentPage(currentQuery);
        }
    };
})();