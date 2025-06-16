// 字段管理模块
const ZiduanModule = (() => {
    let availableFields = [];
    let positionCards = new Array(8).fill('');

    // DOM工具
    const $ = id => document.getElementById(id);
    const $$ = selector => document.querySelectorAll(selector);

    // 初始化字段管理
    async function init() {
        await FirebaseModule.waitForInit();
        await loadAvailableFields();
        renderPositionCards();
        await loadCurrentSettings();
    }

    // 加载字段并更新所有下拉框
    async function loadAvailableFields() {
        availableFields = await FirebaseModule.getAvailableFields();
        
        const options = availableFields.map(field => 
            `<option value="${field}">${field}</option>`).join('');
        
        // 更新所有选择框
        const updateSelect = (selector, defaultOption = '') => {
            $$(selector).forEach(select => {
                const currentValue = select.value;
                select.innerHTML = defaultOption + options;
                select.value = currentValue;
            });
        };

        updateSelect('#titleField', '<option value="">请选择字段</option>');
        updateSelect('.subtitle-select', '<option value="">不显示</option>');
        updateSelect('.position-select', '<option value="">不显示</option>');
    }

    // 位置卡片渲染
    function renderPositionCards() {
        const container = $('positionContainer');
        if (!container) return;

        const options = availableFields.map(field => 
            `<option value="${field}">${field}</option>`).join('');
        
        container.innerHTML = positionCards.map((value, index) => `
            <div class="field-card">
                <div class="field-card-header">位置${index + 1}</div>
                <div class="field-card-body">
                    <select class="field-select position-select" data-index="${index}" 
                            onchange="ZiduanModule.updatePositionCard(${index}, this.value)">
                        <option value="">不显示</option>
                        ${options}
                    </select>
                </div>
                <button class="delete-btn" onclick="ZiduanModule.deletePositionCard(${index})">-</button>
            </div>
        `).join('');
        
        // 恢复选中值
        positionCards.forEach((value, index) => {
            const select = document.querySelector(`.position-select[data-index="${index}"]`);
            if (select) select.value = value;
        });
    }

    // 位置卡片操作
    const addPositionCard = () => {
        positionCards.push('');
        renderPositionCards();
        NotificationModule.info('已添加新的位置字段');
    };

    const deletePositionCard = index => {
        if (positionCards.length > 1) {
            positionCards.splice(index, 1);
            renderPositionCards();
            NotificationModule.info('已删除位置字段');
        } else {
            NotificationModule.warning('至少保留一个位置字段');
        }
    };

    const updatePositionCard = (index, value) => {
        positionCards[index] = value;
    };

    // 加载当前设置
    async function loadCurrentSettings() {
        const settings = await FirebaseModule.getDisplaySettings();
        
        // 设置标题字段
        if ($('titleField')) $('titleField').value = settings.titleField || '';
        
        // 设置副标题字段
        if (settings.subtitles && settings.subtitles.length > 0) {
            settings.subtitles.forEach((value, index) => {
                const select = document.querySelector(`.subtitle-select[data-index="${index}"]`);
                if (select) select.value = value || '';
            });
        }
        
        // 设置位置字段
        if (settings.contentFields && settings.contentFields.length > 0) {
            positionCards = [...settings.contentFields];
            renderPositionCards();
        }
    }

    // 保存设置
    async function saveSettings() {
        const settings = {
            titleField: $('titleField')?.value || '',
            subtitles: Array.from({length: 4}, (_, i) => 
                document.querySelector(`.subtitle-select[data-index="${i}"]`)?.value || ''),
            contentFields: [...positionCards]
        };
        
        try {
            await FirebaseModule.saveDisplaySettings(settings);
            NotificationModule.success('设置保存成功！');
        } catch (error) {
            console.error('保存设置失败：', error);
            NotificationModule.error('保存设置失败，请重试！');
        }
    }

    // 重置设置
    async function resetSettings() {
        try {
            const fields = await FirebaseModule.getAvailableFields();
            
            if (fields.length) {
                // 重置各字段
                if ($('titleField')) $('titleField').value = fields[0] || '';
                
                // 重置副标题字段
                Array.from({length: 4}, (_, i) => {
                    const select = document.querySelector(`.subtitle-select[data-index="${i}"]`);
                    if (select) select.value = fields[i + 1] || '';
                });
                
                // 重置位置字段
                positionCards = Array.from({length: 8}, (_, i) => fields[i + 5] || '');
                renderPositionCards();
                
                NotificationModule.success('设置已重置！请记得点击保存按钮。');
            }
        } catch (error) {
            console.error('重置设置失败：', error);
            NotificationModule.error('重置设置失败，请重试！');
        }
    }

    // 公开接口
    return {
        init,
        addPositionCard,
        deletePositionCard,
        updatePositionCard,
        saveSettings,
        resetSettings
    };
})();

// 暴露到全局
window.ZiduanModule = ZiduanModule;