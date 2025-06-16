// 数据库管理模块 - 使用现有Firebase配置的原生API版本
const ShujuModule = (() => {
    let isOperating = false;

    // DOM工具
    const $ = id => document.getElementById(id);

    // 初始化数据库管理
    async function init() {
        await FirebaseModule.waitForInit();
        await checkStatus();
        bindEvents();
    }

    // 绑定事件
    function bindEvents() {
        const fileInput = $('dbFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
    }

    // 获取Firebase原生API
    function getFirebaseAPI() {
        // 通过FirebaseModule访问原生API
        return new Promise(async (resolve) => {
            await FirebaseModule.waitForInit();
            // 使用FirebaseModule的内部API
            resolve({
                database: FirebaseModule.database || await FirebaseModule.getData(''),  // 触发获取database实例
                get: FirebaseModule.getData,
                set: FirebaseModule.setData
            });
        });
    }

    // 检查连接状态和记录数（原生API版本）
    async function checkStatus() {
        const connectionStatus = $('dbConnectionStatus');
        const recordCount = $('dbRecordCount');
        
        if (!connectionStatus || !recordCount) return;

        try {
            // 直接调用Firebase数据获取
            const data = await FirebaseModule.getData('medicines');
            
            // 更新连接状态
            connectionStatus.textContent = '已连接';
            connectionStatus.className = 'status-value status-connected';
            
            // 计算记录数
            if (data) {
                const count = Object.keys(data).length;
                recordCount.textContent = `${count} 条记录`;
                recordCount.className = count > 0 ? 'status-value status-connected' : 'status-value status-loading';
            } else {
                recordCount.textContent = '0 条记录';
                recordCount.className = 'status-value status-loading';
            }
            
        } catch (error) {
            console.error('状态检测失败：', error);
            connectionStatus.textContent = '连接失败';
            connectionStatus.className = 'status-value status-error';
            recordCount.textContent = '检查失败';
            recordCount.className = 'status-value status-error';
            addLog(`连接失败: ${error.message}`, 'error');
        }
    }

    // 操作封装函数（统一处理）
    async function performOperation(btnId, operatingText, operation) {
        if (isOperating) return;
        isOperating = true;

        const btn = $(btnId);
        const originalText = btn?.textContent;
        
        // 禁用所有按钮
        ['dbCheckBtn', 'dbUploadBtn', 'dbClearBtn'].forEach(id => {
            const button = $(id);
            if (button) button.disabled = true;
        });
        
        // 设置当前按钮状态
        if (btn) btn.textContent = operatingText;

        try {
            await operation();
        } catch (error) {
            throw error;
        } finally {
            // 恢复所有按钮
            ['dbCheckBtn', 'dbUploadBtn', 'dbClearBtn'].forEach(id => {
                const button = $(id);
                if (button) {
                    button.disabled = false;
                    if (button.id === btnId) {
                        button.textContent = originalText;
                    }
                }
            });
            isOperating = false;
        }
    }

    // 手动状态检测
    async function manualCheckStatus() {
        await performOperation('dbCheckBtn', '检测中...', async () => {
            addLog('开始检测状态...', 'info');
            await checkStatus();
            addLog('状态检测完成', 'success');
            NotificationModule.success('状态检测完成');
        });
    }

    // 触发文件选择
    function triggerFileUpload() {
        const fileInput = $('dbFileInput');
        if (fileInput) fileInput.click();
    }

    // 处理文件上传（优化版）
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            NotificationModule.error('请选择Excel文件（.xlsx或.xls）');
            addLog('文件格式错误，请选择Excel文件', 'error');
            return;
        }

        await performOperation('dbUploadBtn', '上传中...', async () => {
            addLog('开始上传数据...', 'info');

            // 读取Excel文件
            addLog('正在读取Excel文件...', 'info');
            const data = await readExcelFile(file);
            
            if (data.length === 0) {
                throw new Error('Excel文件为空或格式不正确');
            }

            addLog(`成功读取 ${data.length} 条记录`, 'success');

            // 使用优化的数据处理和上传
            await uploadToFirebase(data);

            addLog(`数据上传完成，共保存 ${data.length} 条记录`, 'success');
            NotificationModule.success(`数据上传完成，共保存 ${data.length} 条记录`);

            // 自动检查状态
            addLog('自动检测状态中...', 'info');
            await checkStatus();
            addLog('状态检测完成', 'success');
        });

        event.target.value = ''; // 清空文件选择
    }

    // 使用FirebaseModule API上传数据（优化版）
    async function uploadToFirebase(data) {
        // 准备数据结构（参考独立系统的逻辑）
        addLog('处理数据结构...', 'info');
        const structuredData = {};
        const usedIds = new Set();
        
        data.forEach((item, index) => {
            // 生成唯一8位随机ID
            let randomId;
            do {
                randomId = generateRandomId();
            } while (usedIds.has(randomId));
            usedIds.add(randomId);
            
            // 存储Excel行的所有字段
            structuredData[randomId] = {};
            Object.keys(item).forEach(key => {
                structuredData[randomId][key] = item[key] || '';
            });
            
            if ((index + 1) % 1000 === 0) {
                addLog(`处理进度: ${index + 1}/${data.length}`, 'info');
            }
        });
        
        addLog('保存到数据库...', 'info');
        // 直接覆盖medicines数据（无需先清除）
        await FirebaseModule.setData('medicines', structuredData);
    }

    // 生成8位随机ID
    function generateRandomId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // 读取Excel文件
    function readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    if (typeof XLSX === 'undefined') {
                        throw new Error('Excel解析库未加载，请刷新页面重试');
                    }
                    
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Excel文件解析失败，请检查文件格式'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败，请重新选择文件'));
            reader.readAsArrayBuffer(file);
        });
    }

    // 清除所有数据（优化版）
    async function clearAllData() {
        await performOperation('dbClearBtn', '清除中...', async () => {
            addLog('开始清除数据...', 'info');
            
            // 直接设置为null来清除
            await FirebaseModule.setData('medicines', null);
            
            addLog('数据库清除完成', 'success');
            NotificationModule.success('数据库中的所有数据已清除');
            
            addLog('自动检测状态中...', 'info');
            await checkStatus();
            addLog('状态检测完成', 'success');
        });
    }

    // 添加日志
    function addLog(message, type = 'info') {
        const logContainer = $('dbLogContainer');
        if (!logContainer) return;
        
        // 移除空日志提示
        const emptyLog = logContainer.querySelector('.empty-log');
        if (emptyLog) emptyLog.remove();
        
        const logItem = document.createElement('div');
        logItem.className = `log-item log-${type}`;
        logItem.innerHTML = `<span class="log-timestamp">[${new Date().toLocaleTimeString()}]</span>${message}`;
        
        logContainer.appendChild(logItem);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 公开接口
    return {
        init,
        manualCheckStatus,
        triggerFileUpload,
        clearAllData
    };
})();

// 暴露到全局
window.ShujuModule = ShujuModule;