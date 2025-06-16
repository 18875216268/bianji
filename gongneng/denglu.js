// 优化后的登录模块
const LoginModule = (() => {
    const $ = id => document.getElementById(id);
    const checkLoginStatus = () => sessionStorage.getItem('isLoggedIn') === 'true';
    
    // 通用DOM操作
    const toggleClass = (element, className, condition) => 
        element.classList.toggle(className, condition);
    
    const updateElement = (id, property, value) => {
        const element = $(id);
        if (element) element[property] = value;
    };

    // 更新清除按钮状态 (优化版)
    const updateClearButtons = () => {
        ['username', 'password'].forEach(id => {
            const input = $(id);
            const clearBtn = input?.nextElementSibling;
            if (clearBtn) toggleClass(clearBtn, 'show', !!input.value.trim());
        });
    };
    
    // 更新登录按钮
    const updateLoginButton = () => 
        updateElement('loginBtn', 'textContent', checkLoginStatus() ? '管理' : '登录');
    
    // 弹窗控制 (优化版)
    const showModal = () => {
        toggleClass($('loginModal'), 'show', true);
        $('username')?.focus();
        updateElement('loginError', 'textContent', '');
        updateClearButtons();
    };
    
    const hideModal = () => {
        toggleClass($('loginModal'), 'show', false);
        $('loginForm')?.reset();
        updateElement('loginError', 'textContent', '');
        document.querySelectorAll('.login-clear-btn')
            .forEach(btn => toggleClass(btn, 'show', false));
    };
    
    // 清除输入
    const clearInput = inputId => {
        const input = $(inputId);
        if (input) {
            input.value = '';
            input.focus();
            updateClearButtons();
        }
    };
    
    // 登录处理
    const handleLoginClick = () => 
        checkLoginStatus() ? location.href = 'houtai.html' : showModal();
    
    // 登录表单处理 (优化版)
    const handleLogin = async event => {
        event.preventDefault();
        
        const username = $('username')?.value.trim();
        const password = $('password')?.value.trim();
        const errorDiv = $('loginError');
        const submitBtn = document.querySelector('.login-submit');
        
        if (!username || !password) {
            updateElement('loginError', 'textContent', '请输入账号和密码');
            return;
        }
        
        // 设置加载状态
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        errorDiv.textContent = '';
        
        try {
            await FirebaseModule.waitForInit();
            const result = await FirebaseModule.validateLogin(username, password);
            
            if (result.success) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', username);
                location.href = 'houtai.html';
            } else {
                errorDiv.textContent = result.message;
            }
        } catch (error) {
            errorDiv.textContent = '网络错误，请稍后重试';
        } finally {
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    };
    
    // 退出登录
    const logout = () => {
        sessionStorage.clear();
        location.href = 'index.html';
    };
    
    // 初始化事件监听 (优化版)
    document.addEventListener('DOMContentLoaded', () => {
        updateLoginButton();
        ['username', 'password'].forEach(id => 
            $(id)?.addEventListener('input', updateClearButtons)
        );
    });
    
    return {
        handleLoginClick,
        handleLogin,
        updateLoginButton,
        checkLoginStatus,
        logout,
        hideModal,
        clearInput
    };
})();

window.LoginModule = LoginModule;