# 公共模块API文档

本文档介绍了药品搜索系统中两个核心公共模块的API接口，供开发者快速集成使用。

## 📢 通知模块 - NotificationModule

### 引入方式
```html
<link rel="stylesheet" href="yangshi/tongzhi.css">
<script src="gongneng/tongzhi.js"></script>
```

### API接口

#### ✅ 成功通知
```javascript
NotificationModule.success(message, duration?)
```
**参数：**
- `message` (string) - 通知消息内容
- `duration` (number, 可选) - 显示时长，默认3000毫秒

**返回值：** 通知ID (number)

**示例：**
```javascript
NotificationModule.success('操作成功！');
NotificationModule.success('数据保存成功！', 2000); // 2秒后消失
```

---

#### ❌ 错误通知
```javascript
NotificationModule.error(message, duration?)
```
**参数：**
- `message` (string) - 错误消息内容
- `duration` (number, 可选) - 显示时长，默认5000毫秒

**返回值：** 通知ID (number)

**示例：**
```javascript
NotificationModule.error('操作失败，请重试！');
NotificationModule.error('网络连接超时', 4000);
```

---

#### ⚠️ 警告通知
```javascript
NotificationModule.warning(message, duration?)
```
**参数：**
- `message` (string) - 警告消息内容
- `duration` (number, 可选) - 显示时长，默认4000毫秒

**返回值：** 通知ID (number)

**示例：**
```javascript
NotificationModule.warning('请检查输入内容！');
NotificationModule.warning('即将删除数据，请确认', 6000);
```

---

#### ℹ️ 信息通知
```javascript
NotificationModule.info(message, duration?)
```
**参数：**
- `message` (string) - 信息消息内容
- `duration` (number, 可选) - 显示时长，默认3000毫秒

**返回值：** 通知ID (number)

**示例：**
```javascript
NotificationModule.info('正在处理中...');
NotificationModule.info('系统将于5分钟后维护', 0); // 不自动消失
```

---

#### 🗑️ 关闭通知
```javascript
NotificationModule.close(id)
```
**参数：**
- `id` (number) - 要关闭的通知ID

**示例：**
```javascript
const notificationId = NotificationModule.info('处理中...');
// 处理完成后手动关闭
NotificationModule.close(notificationId);
```

---

#### 🧹 清除所有通知
```javascript
NotificationModule.clearAll()
```
**功能：** 关闭当前显示的所有通知

**示例：**
```javascript
NotificationModule.clearAll(); // 清除所有通知
```

---

## 🗄️ 数据库模块 - FirebaseModule

### 引入方式
```html
<script src="gongneng/firebase.js"></script>
```

### API接口

#### 📖 读取数据
```javascript
await FirebaseModule.getData(path)
```
**参数：**
- `path` (string) - 数据库路径

**返回值：** Promise<any> - 数据内容或null

**示例：**
```javascript
const userData = await FirebaseModule.getData('users/123');
const settings = await FirebaseModule.getData('shezhi/displayFields');
```

---

#### 💾 写入数据
```javascript
await FirebaseModule.setData(path, data)
```
**参数：**
- `path` (string) - 数据库路径
- `data` (any) - 要写入的数据

**返回值：** Promise<boolean> - 成功返回true

**示例：**
```javascript
await FirebaseModule.setData('users/123', { name: '张三', age: 25 });
await FirebaseModule.setData('shezhi/theme', 'dark');
```

---

#### 💊 获取药品数据
```javascript
await FirebaseModule.getMedicines()
```
**功能：** 获取所有药品信息，自动添加ID字段

**返回值：** Promise<Array> - 药品数据数组

**示例：**
```javascript
const medicines = await FirebaseModule.getMedicines();
console.log(medicines[0]); // { id: 'key1', 商品名称: '阿莫西林', 厂家: '...' }
```

---

#### 📝 获取可用字段
```javascript
await FirebaseModule.getAvailableFields()
```
**功能：** 获取数据库中所有可用的字段名称

**返回值：** Promise<Array<string>> - 字段名称数组

**示例：**
```javascript
const fields = await FirebaseModule.getAvailableFields();
console.log(fields); // ['商品名称', '厂家', '规格', '价格', ...]
```

---

#### ⚙️ 获取显示设置
```javascript
await FirebaseModule.getDisplaySettings()
```
**功能：** 获取界面显示字段配置，支持本地缓存

**返回值：** Promise<Object> - 显示设置对象

**示例：**
```javascript
const settings = await FirebaseModule.getDisplaySettings();
console.log(settings);
// {
//   titleField: '商品名称',
//   subtitles: ['厂家', '规格'],
//   contentFields: ['价格', '库存', ...]
// }
```

---

#### 💾 保存显示设置
```javascript
await FirebaseModule.saveDisplaySettings(settings)
```
**参数：**
- `settings` (Object) - 显示设置对象
  - `titleField` (string) - 标题字段
  - `subtitles` (Array<string>) - 副标题字段数组
  - `contentFields` (Array<string>) - 内容字段数组

**返回值：** Promise<boolean> - 成功返回true

**示例：**
```javascript
await FirebaseModule.saveDisplaySettings({
    titleField: '商品名称',
    subtitles: ['厂家', '规格'],
    contentFields: ['价格', '库存', '批号']
});
```

---

#### 🔐 验证登录
```javascript
await FirebaseModule.validateLogin(username, password)
```
**参数：**
- `username` (string) - 用户名
- `password` (string) - 密码

**返回值：** Promise<Object> - 验证结果
- `success` (boolean) - 是否成功
- `message` (string) - 错误消息（失败时）

**示例：**
```javascript
const result = await FirebaseModule.validateLogin('admin', '123456');
if (result.success) {
    console.log('登录成功');
} else {
    console.log('登录失败：', result.message);
}
```

---

#### 👤 修改用户名 <span style="color: #EE7708; background: #fff2cc; padding: 2px 6px; border-radius: 3px; font-size: 12px;">新增</span>
```javascript
await FirebaseModule.changeUsername(oldUsername, newUsername)
```
**参数：**
- `oldUsername` (string) - 当前用户名
- `newUsername` (string) - 新用户名

**返回值：** Promise<Object> - 修改结果
- `success` (boolean) - 是否成功
- `message` (string) - 结果消息

**示例：**
```javascript
const result = await FirebaseModule.changeUsername('admin', 'superAdmin');
if (result.success) {
    console.log('用户名修改成功');
    // 更新 sessionStorage
    sessionStorage.setItem('username', 'superAdmin');
} else {
    console.log('修改失败：', result.message);
}
```

**注意事项：**
- 新用户名不能与现有用户名重复
- 修改成功后需要更新本地存储的用户名信息
- 原用户的所有数据会被保留并迁移到新用户名下

---

#### 🔑 修改密码 <span style="color: #EE7708; background: #fff2cc; padding: 2px 6px; border-radius: 3px; font-size: 12px;">新增</span>
```javascript
await FirebaseModule.changePassword(username, newPassword)
```
**参数：**
- `username` (string) - 用户名
- `newPassword` (string) - 新密码

**返回值：** Promise<Object> - 修改结果
- `success` (boolean) - 是否成功
- `message` (string) - 结果消息

**示例：**
```javascript
const result = await FirebaseModule.changePassword('admin', 'newSecurePassword123');
if (result.success) {
    console.log('密码修改成功');
} else {
    console.log('修改失败：', result.message);
}
```

**安全建议：**
- 新密码应包含大小写字母、数字和特殊字符
- 密码长度建议不少于8位
- 定期更换密码以提高账户安全性

---

#### ⏳ 等待初始化
```javascript
await FirebaseModule.waitForInit()
```
**功能：** 等待Firebase模块初始化完成

**返回值：** Promise<boolean> - 初始化成功返回true

**示例：**
```javascript
await FirebaseModule.waitForInit();
// 确保初始化完成后再进行数据库操作
const data = await FirebaseModule.getMedicines();
```

---

#### 📊 检查初始化状态
```javascript
FirebaseModule.isReady
```
**类型：** boolean (只读属性)

**功能：** 检查模块是否已初始化完成

**示例：**
```javascript
if (FirebaseModule.isReady) {
    console.log('Firebase已准备就绪');
} else {
    console.log('Firebase正在初始化中...');
}
```

---

## 🔧 最佳实践

### 通知模块
```javascript
// ✅ 推荐：操作反馈
try {
    await someOperation();
    NotificationModule.success('操作完成！');
} catch (error) {
    NotificationModule.error('操作失败：' + error.message);
}

// ✅ 推荐：长时间操作
const loadingId = NotificationModule.info('正在加载数据...', 0);
try {
    await longRunningOperation();
    NotificationModule.close(loadingId);
    NotificationModule.success('数据加载完成！');
} catch (error) {
    NotificationModule.close(loadingId);
    NotificationModule.error('加载失败！');
}
```

### 数据库模块
```javascript
// ✅ 推荐：安全的数据操作
async function safeDataOperation() {
    await FirebaseModule.waitForInit(); // 确保初始化完成
    
    try {
        const data = await FirebaseModule.getData('some/path');
        return data;
    } catch (error) {
        console.error('数据库操作失败：', error);
        throw error;
    }
}

// ✅ 推荐：组合使用
async function saveUserSettings(settings) {
    try {
        await FirebaseModule.saveDisplaySettings(settings);
        NotificationModule.success('设置保存成功！');
    } catch (error) {
        NotificationModule.error('保存失败，请重试！');
    }
}

// ✅ 推荐：账户管理
async function updateAccountInfo(currentUsername, newUsername, newPassword) {
    try {
        let hasChanges = false;
        let successMessage = '';
        
        // 修改用户名
        if (newUsername && newUsername !== currentUsername) {
            const result = await FirebaseModule.changeUsername(currentUsername, newUsername);
            if (result.success) {
                sessionStorage.setItem('username', newUsername);
                currentUsername = newUsername; // 更新当前用户名
                successMessage += '用户名修改成功！';
                hasChanges = true;
            } else {
                NotificationModule.error(result.message);
                return;
            }
        }
        
        // 修改密码
        if (newPassword) {
            const result = await FirebaseModule.changePassword(currentUsername, newPassword);
            if (result.success) {
                if (successMessage) successMessage += ' ';
                successMessage += '密码修改成功！';
                hasChanges = true;
            } else {
                NotificationModule.error(result.message);
                return;
            }
        }
        
        if (hasChanges) {
            NotificationModule.success(successMessage);
        } else {
            NotificationModule.warning('请输入要修改的内容！');
        }
    } catch (error) {
        NotificationModule.error('操作失败，请重试！');
    }
}
```

## 📞 技术支持

如有问题或建议，请联系开发团队。模块源码位置：
- 通知模块：`gongneng/tongzhi.js` + `yangshi/tongzhi.css`
- 数据库模块：`gongneng/firebase.js`

---

## 📋 更新日志

### v1.1.0 - 2024年新增功能
- 🆕 **新增账户管理功能**
  - `changeUsername()` - 修改用户名
  - `changePassword()` - 修改密码
- 🎯 **后台管理界面**
  - 账户信息面板重新设计
  - 导航栏顺序调整：账户信息 → 字段管理 → 数据库管理
- 🛡️ **安全性提升**
  - 用户名唯一性检查
  - 统一的错误处理机制