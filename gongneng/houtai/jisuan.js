// 计算管理模块
const JisuanModule = (() => {
    let dbFields = [];
    let customVariables = {};
    let isInitialized = false;
    
    // DOM工具
    const $ = id => document.getElementById(id);
    
    // 初始化模块
    async function init() {
        if (isInitialized) return;
        
        await FirebaseModule.waitForInit();
        await loadDatabaseFields();
        await loadCustomVariables();
        bindEvents();
        
        isInitialized = true;
    }
    
    // 加载数据库字段
    async function loadDatabaseFields() {
        try {
            const medicines = await FirebaseModule.getData('medicines');
            if (!medicines) {
                renderEmptyFields();
                return;
            }
            
            // 获取前2条记录
            const records = Object.values(medicines).slice(0, 2);
            const fieldsSet = new Set();
            
            // 收集所有字段并去重
            records.forEach(record => {
                Object.keys(record).forEach(key => {
                    if (key !== 'id') {
                        fieldsSet.add(key.trim());
                    }
                });
            });
            
            dbFields = Array.from(fieldsSet);
            renderDatabaseFields();
        } catch (error) {
            console.error('加载数据库字段失败：', error);
            renderEmptyFields();
        }
    }
    
    // 加载自定义变量
    async function loadCustomVariables() {
        try {
            const variables = await FirebaseModule.getData('shezhi/bianliang');
            customVariables = variables || {};
            renderCustomVariables();
        } catch (error) {
            console.error('加载自定义变量失败：', error);
            renderEmptyVariables();
        }
    }
    
    // 渲染数据库字段
    function renderDatabaseFields() {
        const container = $('dbFieldList');
        if (!container) return;
        
        if (dbFields.length === 0) {
            container.innerHTML = '<div class="calc-empty">暂无数据库字段</div>';
            return;
        }
        
        container.innerHTML = dbFields.map(field => {
            // 转义字段名中的特殊字符，防止HTML注入
            const escapedField = field.replace(/'/g, '\\\'').replace(/"/g, '&quot;');
            return `
                <div class="calc-field-item" onclick="JisuanModule.insertField('${escapedField}')">
                    ${field}
                </div>
            `;
        }).join('');
    }
    
    // 渲染空字段状态
    function renderEmptyFields() {
        const container = $('dbFieldList');
        if (container) {
            container.innerHTML = '<div class="calc-empty">暂无数据库字段</div>';
        }
    }
    
    // 渲染自定义变量
    function renderCustomVariables() {
        const container = $('variableList');
        if (!container) return;
        
        const variables = Object.entries(customVariables);
        if (variables.length === 0) {
            container.innerHTML = '<div class="calc-empty">暂无自定义变量</div>';
            return;
        }
        
        container.innerHTML = variables.map(([name, formula]) => {
            // 转义变量名中的特殊字符，防止HTML注入
            const escapedName = name.replace(/'/g, '\\\'').replace(/"/g, '&quot;');
            return `
                <div class="calc-variable-item" onclick="JisuanModule.insertVariable('${escapedName}')">
                    <div class="calc-variable-name">${name}</div>
                    <div class="calc-variable-formula">${formula}</div>
                    <button class="calc-delete-btn" onclick="event.stopPropagation(); JisuanModule.deleteVariable('${escapedName}')">&times;</button>
                </div>
            `;
        }).join('');
    }
    
    // 渲染空变量状态
    function renderEmptyVariables() {
        const container = $('variableList');
        if (container) {
            container.innerHTML = '<div class="calc-empty">暂无自定义变量</div>';
        }
    }
    
    // 绑定事件
    function bindEvents() {
        const inputContainer = $('calcInputContainer');
        if (!inputContainer) return;
        
        // 处理键盘事件
        inputContainer.addEventListener('keydown', handleKeyDown);
        
        // 处理粘贴事件
        inputContainer.addEventListener('paste', handlePaste);
        
        // 处理输入事件
        inputContainer.addEventListener('input', handleInput);
        
        // 处理点击事件（选中标签）
        inputContainer.addEventListener('click', handleClick);
    }
    
    // 插入字段标签
    function insertField(fieldName) {
        insertTag(fieldName, 'field');
    }
    
    // 插入变量标签
    function insertVariable(variableName) {
        insertTag(variableName, 'variable');
    }
    
    // 插入标签到光标位置
    function insertTag(text, type) {
        const inputContainer = $('calcInputContainer');
        if (!inputContainer) return;
        
        // 获取当前选区
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // 创建标签元素
        const tag = document.createElement('span');
        tag.className = `calc-tag calc-tag-${type}`;
        tag.textContent = text;
        tag.contentEditable = 'false';
        
        // 插入标签
        range.deleteContents();
        range.insertNode(tag);
        
        // 将光标移到标签后
        range.setStartAfter(tag);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 聚焦输入框
        inputContainer.focus();
    }
    
    // 处理键盘事件
    function handleKeyDown(event) {
        const inputContainer = event.target;
        
        // 处理Backspace
        if (event.key === 'Backspace') {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            if (range.collapsed) {
                // 如果没有选中内容，检查光标前是否有标签
                const node = range.startContainer;
                const offset = range.startOffset;
                
                if (node.nodeType === Node.TEXT_NODE && offset === 0) {
                    // 光标在文本节点开始位置，检查前一个兄弟节点
                    const prevSibling = node.previousSibling;
                    if (prevSibling && prevSibling.classList && prevSibling.classList.contains('calc-tag')) {
                        event.preventDefault();
                        prevSibling.remove();
                    }
                } else if (node === inputContainer && offset > 0) {
                    // 光标在容器中，检查前一个子节点
                    const prevChild = inputContainer.childNodes[offset - 1];
                    if (prevChild && prevChild.classList && prevChild.classList.contains('calc-tag')) {
                        event.preventDefault();
                        prevChild.remove();
                    }
                }
            }
        }
        
        // 处理Delete
        if (event.key === 'Delete') {
            const selection = window.getSelection();
            if (!selection.isCollapsed) {
                // 有选中内容，检查是否包含标签
                const range = selection.getRangeAt(0);
                const fragment = range.cloneContents();
                const tags = fragment.querySelectorAll('.calc-tag');
                if (tags.length > 0) {
                    event.preventDefault();
                    range.deleteContents();
                }
            }
        }
    }
    
    // 处理粘贴事件
    function handlePaste(event) {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }
    
    // 处理输入事件
    function handleInput(event) {
        const inputContainer = event.target;
        // 移除空占位符的影响
        if (inputContainer.textContent.trim() === '') {
            inputContainer.innerHTML = '';
        }
    }
    
    // 处理点击事件
    function handleClick(event) {
        if (event.target.classList.contains('calc-tag')) {
            // 切换选中状态
            event.target.classList.toggle('selected');
        }
    }
    
    // 清空输入
    function clearInput() {
        const inputContainer = $('calcInputContainer');
        if (inputContainer) {
            inputContainer.innerHTML = '';
            inputContainer.focus();
        }
    }
    
    // 获取输入内容（解析标签和文本）
    function getInputContent() {
        const inputContainer = $('calcInputContainer');
        if (!inputContainer) return '';
        
        let content = '';
        const childNodes = inputContainer.childNodes;
        
        for (let node of childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                content += node.textContent;
            } else if (node.classList && node.classList.contains('calc-tag')) {
                content += node.textContent;
            }
        }
        
        return content.trim();
    }
    
    // 确认创建变量
    async function confirmVariable() {
        const content = getInputContent();
        if (!content) {
            NotificationModule.warning('请输入变量定义');
            return;
        }
        
        // 解析变量名和表达式（支持任意字符的变量名）
        const match = content.match(/^(.+?)\s*=\s*(.+)$/);
        if (!match) {
            NotificationModule.error('格式错误！请使用：变量名 = 表达式');
            return;
        }
        
        const [, variableName, expression] = match;
        
        // 只验证变量名是否与数据库字段重复
        if (dbFields.includes(variableName.trim())) {
            NotificationModule.error('变量名不能与数据库字段重复！');
            return;
        }
        
        try {
            // 保存变量
            customVariables[variableName.trim()] = expression.trim();
            await FirebaseModule.setData('shezhi/bianliang', customVariables);
            
            NotificationModule.success('变量创建成功！');
            
            // 刷新变量列表
            renderCustomVariables();
            
            // 清空输入
            clearInput();
        } catch (error) {
            console.error('保存变量失败：', error);
            NotificationModule.error('保存失败，请重试！');
        }
    }
    
    // 删除自定义变量
    async function deleteVariable(variableName) {
        try {
            // 从内存中删除
            delete customVariables[variableName];
            
            // 保存到数据库
            await FirebaseModule.setData('shezhi/bianliang', customVariables);
            
            // 刷新变量列表
            renderCustomVariables();
            
            // 提示成功
            NotificationModule.success('自定义变量已删除！');
        } catch (error) {
            console.error('删除变量失败：', error);
            NotificationModule.error('删除失败，请重试！');
        }
    }
    
    // 面板激活时的处理
    function onPanelActivated() {
        if (!isInitialized) {
            init();
        }
    }
    
    // 公开接口
    return {
        init,
        insertField,
        insertVariable,
        clearInput,
        confirmVariable,
        deleteVariable,
        onPanelActivated
    };
})();

// 暴露到全局
window.JisuanModule = JisuanModule;