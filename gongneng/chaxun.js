// 预加载优化的查询模块
const SearchModule = (() => {
    let data = [];
    const cache = new Map();
    let isPreloaded = false;
    let preloadPromise = null;

    // 🚀 预加载数据函数
    const preloadData = async () => {
        if (isPreloaded || preloadPromise) return preloadPromise;
        
        console.log('🚀 开始预加载搜索数据...');
        
        preloadPromise = (async () => {
            try {
                await FirebaseModule.waitForInit();
                data = await FirebaseModule.getMedicines();
                isPreloaded = true;
                console.log(`✅ 预加载完成: ${data.length} 条数据`);
                return data;
            } catch (error) {
                console.error('❌ 预加载失败:', error);
                // 预加载失败不影响后续正常搜索
                preloadPromise = null;
                throw error;
            }
        })();
        
        return preloadPromise;
    };

    // 加载数据 (兼容原接口)
    const loadData = async () => {
        // 如果已经预加载完成，直接返回
        if (data.length && isPreloaded) return data;
        
        // 如果正在预加载，等待预加载完成
        if (preloadPromise) {
            try {
                return await preloadPromise;
            } catch (error) {
                // 预加载失败，执行原来的加载逻辑
                console.log('预加载失败，执行正常加载...');
            }
        }
        
        // 执行原来的加载逻辑
        if (!data.length) {
            await FirebaseModule.waitForInit();
            data = await FirebaseModule.getMedicines();
        }
        return data;
    };

    // 优化的搜索过滤 (保持不变)
    const filter = (query, items) => {
        if (!query.trim()) return [];
        
        const cacheKey = query.toLowerCase();
        if (cache.has(cacheKey)) return cache.get(cacheKey);
        
        const orTerms = query.split(/[，,]/).map(t => t.trim()).filter(Boolean);
        
        const results = items.filter(item => {
            const searchText = Object.values(item)
                .filter(v => v != null && v !== '')
                .join(' ')
                .toLowerCase();
            
            return orTerms.some(orTerm => 
                orTerm.split(/\s+/)
                    .filter(Boolean)
                    .every(term => searchText.includes(term.toLowerCase()))
            );
        });
        
        cache.set(cacheKey, results);
        return results;
    };

    // 执行搜索 (保持不变)
    const perform = async (query, callbacks) => {
        if (!query.trim()) return;
        
        callbacks.onStart(query);
        
        try {
            const results = filter(query, await loadData());
            callbacks.onSuccess(results, query);
        } catch (error) {
            callbacks.onError(error);
        }
    };

    // 🚀 页面加载时自动开始预加载
    const initPreload = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // 稍微延迟，避免影响页面渲染
                setTimeout(preloadData, 100);
            });
        } else {
            // 如果DOM已经加载完成，立即开始预加载
            setTimeout(preloadData, 100);
        }
    };

    // 立即开始预加载
    initPreload();

    return { 
        loadData, 
        filter, 
        perform,
        // 新增：获取预加载状态
        getPreloadStatus: () => ({ isPreloaded, dataCount: data.length })
    };
})();

window.SearchModule = SearchModule;