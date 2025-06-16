// 账户管理模块 - 简化版，无复杂验证
const ZhanghuModule = (() => {
    let currentUsername = '';

    // DOM工具
    const $ = id => document.getElementById(id);

    // 初始化账户信息
    async function init() {
        // 获取当前用户名
        currentUsername = sessionStorage.getItem('username') || '';
        
        await FirebaseModule.waitForInit();
        await initAccountInfo();
        bindAccountFormEvents();
    }

    // 初始化账户信息显示
    async function initAccountInfo() {
        const currentUsernameEl = $('currentUsername');
        if (currentUsernameEl) {
            currentUsernameEl.textContent = currentUsername || '未知用户';
        }
    }

    // 绑定账户表单事件
    function bindAccountFormEvents() {
        const accountForm = $('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', handleAccountFormSubmit);
        }

        // 绑定输入框事件，显示/隐藏清除按钮
        ['newUsername', 'newPassword', 'confirmPassword'].forEach(id => {
            const input = $(id);
            if (input) {
                input.addEventListener('input', () => updateClearButton(id));
                // 初始化清除按钮状态
                updateClearButton(id);
            }
        });
    }

    // 更新清除按钮状态
    function updateClearButton(inputId) {
        const input = $(inputId);
        const clearBtn = input?.nextElementSibling;
        if (clearBtn && clearBtn.classList.contains('clear-input-btn')) {
            clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
        }
    }

    // 清空输入框
    function clearInput(inputId) {
        const input = $(inputId);
        if (input) {
            input.value = '';
            input.focus();
            updateClearButton(inputId);
        }
    }

    // 重置账户表单
    function resetAccountForm() {
        const form = $('accountForm');
        if (form) {
            form.reset();
            // 更新所有清除按钮状态
            ['newUsername', 'newPassword', 'confirmPassword'].forEach(updateClearButton);
        }
    }

    // 处理账户表单提交
    async function handleAccountFormSubmit(event) {
        event.preventDefault();
        
        const newUsername = $('newUsername')?.value.trim();
        const newPassword = $('newPassword')?.value.trim();
        const confirmPassword = $('confirmPassword')?.value.trim();
        
        // 简单检查：如果没有任何修改
        if (!newUsername && !newPassword) {
            NotificationModule.warning('请输入要修改的内容！');
            return;
        }

        // 简单检查：如果修改密码，确认密码必须一致
        if (newPassword && newPassword !== confirmPassword) {
            NotificationModule.error('两次输入的密码不一致');
            return;
        }

        // 执行保存操作
        await saveAccountChanges(newUsername, newPassword);
    }

    // 保存账户修改
    async function saveAccountChanges(newUsername, newPassword) {
        try {
            let hasChanges = false;
            let successMessages = [];
            let tempUsername = currentUsername; // 临时存储用户名，用于密码修改

            // 修改用户名
            if (newUsername) {
                const result = await FirebaseModule.changeUsername(currentUsername, newUsername);
                if (result.success) {
                    // 更新sessionStorage和当前用户名
                    sessionStorage.setItem('username', newUsername);
                    currentUsername = newUsername;
                    tempUsername = newUsername;
                    
                    // 更新界面显示
                    const currentUsernameEl = $('currentUsername');
                    if (currentUsernameEl) {
                        currentUsernameEl.textContent = newUsername;
                    }
                    
                    successMessages.push('用户名修改成功');
                    hasChanges = true;
                } else {
                    NotificationModule.error(result.message);
                    return;
                }
            }

            // 修改密码
            if (newPassword) {
                const result = await FirebaseModule.changePassword(tempUsername, newPassword);
                if (result.success) {
                    successMessages.push('密码修改成功');
                    hasChanges = true;
                } else {
                    NotificationModule.error(result.message);
                    return;
                }
            }

            if (hasChanges) {
                NotificationModule.success(successMessages.join('，') + '！');
                // 清空表单
                resetAccountForm();
            }
        } catch (error) {
            console.error('保存账户信息失败：', error);
            NotificationModule.error('保存失败，请重试！');
        }
    }

    // 公开接口
    return {
        init,
        clearInput,
        resetAccountForm
    };
})();

// 暴露到全局
window.ZhanghuModule = ZhanghuModule;