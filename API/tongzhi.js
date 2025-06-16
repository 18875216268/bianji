// 通知模块
const NotificationModule = (() => {
    let container = null;
    let notificationId = 0;

    // 初始化通知容器
    function initContainer() {
        if (container) return;
        
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // 创建通知元素
    function createNotification(message, type = 'info', duration = 3000) {
        initContainer();
        
        const id = ++notificationId;
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);
        
        // 通知内容
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="NotificationModule.close(${id})">&times;</button>
            </div>
        `;
        
        // 添加到容器
        container.appendChild(notification);
        
        // 触发动画
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => close(id), duration);
        }
        
        return id;
    }

    // 获取图标
    function getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // 关闭通知
    function close(id) {
        const notification = container?.querySelector(`[data-id="${id}"]`);
        if (!notification) return;
        
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 清除所有通知
    function clearAll() {
        if (!container) return;
        
        const notifications = container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.classList.add('hide');
        });
        
        setTimeout(() => {
            if (container) container.innerHTML = '';
        }, 300);
    }

    // 公开方法
    return {
        // 成功通知
        success(message, duration = 3000) {
            return createNotification(message, 'success', duration);
        },
        
        // 错误通知
        error(message, duration = 5000) {
            return createNotification(message, 'error', duration);
        },
        
        // 警告通知
        warning(message, duration = 4000) {
            return createNotification(message, 'warning', duration);
        },
        
        // 信息通知
        info(message, duration = 3000) {
            return createNotification(message, 'info', duration);
        },
        
        // 关闭指定通知
        close,
        
        // 清除所有通知
        clearAll
    };
})();

// 暴露到全局
window.NotificationModule = NotificationModule;