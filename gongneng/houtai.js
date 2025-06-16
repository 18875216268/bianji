// 主后台管理模块 - 负责通用功能和协调各子模块
const HoutaiModule = (() => {
    // DOM工具
    const $ = id => document.getElementById(id);
    const $$ = selector => document.querySelectorAll(selector);

    // 初始化
    async function init() {
        // 检查登录状态
        if (sessionStorage.getItem('isLoggedIn') !== 'true') {
            window.location.href = 'index.html';
            return;
        }

        await FirebaseModule.waitForInit();
        
        // 初始化各个子模块
        await initializeModules();
    }

    // 初始化各个子模块
    async function initializeModules() {
        try {
            // 初始化账户管理模块
            if (window.ZhanghuModule && window.ZhanghuModule.init) {
                await window.ZhanghuModule.init();
            }
            
            // 初始化字段管理模块
            if (window.ZiduanModule && window.ZiduanModule.init) {
                await window.ZiduanModule.init();
            }
            
            // 初始化数据库管理模块
            if (window.ShujuModule && window.ShujuModule.init) {
                await window.ShujuModule.init();
            }
            
            // 初始化计算管理模块
            if (window.JisuanModule && window.JisuanModule.init) {
                await window.JisuanModule.init();
            }
            
            console.log('所有后台模块初始化完成');
        } catch (error) {
            console.error('模块初始化失败：', error);
            NotificationModule.error('系统初始化失败，请刷新页面重试');
        }
    }

    // 页面导航
    const goHome = () => {
        window.location.href = 'index.html';
    };

    const logout = () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    };

    // 面板切换
    function switchPanel(panelId) {
        // 更新导航状态
        $$('.nav-item').forEach(item => item.classList.remove('active'));
        event.target.classList.add('active');
        
        // 切换面板
        $$('.content-panel').forEach(panel => panel.classList.remove('active'));
        $(panelId).classList.add('active');
        
        // 触发面板切换事件，给子模块处理特定逻辑的机会
        triggerPanelSwitchEvent(panelId);
    }

    // 触发面板切换事件
    function triggerPanelSwitchEvent(panelId) {
        switch (panelId) {
            case 'account-info':
                // 账户信息面板激活时的处理
                if (window.ZhanghuModule && window.ZhanghuModule.onPanelActivated) {
                    window.ZhanghuModule.onPanelActivated();
                }
                break;
            case 'field-management':
                // 字段管理面板激活时的处理
                if (window.ZiduanModule && window.ZiduanModule.onPanelActivated) {
                    window.ZiduanModule.onPanelActivated();
                }
                break;
            case 'database-management':
                // 数据库管理面板激活时的处理
                if (window.ShujuModule && window.ShujuModule.onPanelActivated) {
                    window.ShujuModule.onPanelActivated();
                }
                break;
            case 'calculation-management':
                // 计算管理面板激活时的处理
                if (window.JisuanModule && window.JisuanModule.onPanelActivated) {
                    window.JisuanModule.onPanelActivated();
                }
                break;
        }
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);

    // 公开接口
    return {
        // 导航功能
        goHome,
        logout,
        switchPanel,
        
        // 工具方法
        initializeModules
    };
})();

// 暴露到全局
window.HoutaiModule = HoutaiModule;