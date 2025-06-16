// 优化后的 Firebase 统一数据库模块 公共模块！涉及数据库配置以及读写等操作都统一使用公共模块，禁止各模块自行编写数据库代码。
const FirebaseModule = (() => {
    // Firebase 配置
    const firebaseConfig = {
        apiKey: "AIzaSyDsUG6Q-JcZhqq3hQDVSZBiyVqErcK1PRE",
        authDomain: "bianjilirun-945ff.firebaseapp.com",
        databaseURL: "https://bianjilirun-945ff-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "bianjilirun-945ff",
        storageBucket: "bianjilirun-945ff.firebasestorage.app",
        messagingSenderId: "123807311714",
        appId: "1:123807311714:web:bce5aeaee973c59f4cee3b",
        measurementId: "G-PB5BR1BFVS"
    };

    // 核心状态
    let database = null;
    let firebaseAPI = null;
    const initPromise = init(); // 立即开始初始化

    // 初始化 Firebase (只执行一次)
    async function init() {
        if (database) return true;

        try {
            const [
                { initializeApp },
                { getDatabase, ref, get, set, child }
            ] = await Promise.all([
                import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js')
            ]);
            
            const app = initializeApp(firebaseConfig);
            database = getDatabase(app);
            firebaseAPI = { ref, get, set, child };
            
            return true;
        } catch (error) {
            console.error('Firebase 初始化失败：', error);
            throw error;
        }
    }

    // 统一的数据库操作包装器
    async function withDB(operation) {
        await initPromise;
        return operation(database, firebaseAPI);
    }

    // 通用数据读取
    const getData = path => withDB(async (db, api) => {
        const snapshot = await api.get(api.child(api.ref(db), path));
        return snapshot.exists() ? snapshot.val() : null;
    });

    // 通用数据写入
    const setData = (path, data) => withDB(async (db, api) => {
        await api.set(api.ref(db, path), data);
        return true;
    });

    // 缓存管理器
    const Cache = {
        get(key) {
            try { return JSON.parse(sessionStorage.getItem(key)); }
            catch { return null; }
        },
        set(key, value) {
            sessionStorage.setItem(key, JSON.stringify(value));
        }
    };

    // 业务方法
    async function getMedicines() {
        const data = await getData('medicines');
        if (!data) return [];
        return Object.entries(data).map(([id, item]) => ({ id, ...item }));
    }

    async function getAvailableFields() {
        const medicines = await getMedicines();
        return medicines.length ? Object.keys(medicines[0]).filter(key => key !== 'id') : [];
    }

    async function getDisplaySettings() {
        // 检查缓存
        let settings = Cache.get('displayFields');
        if (settings) return settings;

        // 从数据库读取
        settings = await getData('shezhi/displayFields') || {
            titleField: '商品名称',
            subtitles: ['厂家'],
            contentFields: []
        };

        Cache.set('displayFields', settings);
        return settings;
    }

    async function saveDisplaySettings(settings) {
        await setData('shezhi/displayFields', settings);
        Cache.set('displayFields', settings);
        return true;
    }

    async function validateLogin(username, password) {
        try {
            const loginData = await getData('denglu');
            if (!loginData) return { success: false, message: '系统未初始化' };

            const userInfo = loginData[username];
            return userInfo?.password === password 
                ? { success: true }
                : { success: false, message: '账号或密码错误' };
        } catch {
            return { success: false, message: '网络错误' };
        }
    }

    // 修改登录用户名
    async function changeUsername(oldUsername, newUsername) {
        try {
            const loginData = await getData('denglu');
            if (!loginData) {
                return { success: false, message: '系统未初始化' };
            }

            // 检查新用户名是否已存在
            if (loginData[newUsername]) {
                return { success: false, message: '该用户名已存在' };
            }

            // 检查旧用户是否存在
            const oldUserData = loginData[oldUsername];
            if (!oldUserData) {
                return { success: false, message: '原用户不存在' };
            }

            // 创建新用户数据并删除旧用户数据
            const updatedLoginData = {
                ...loginData,
                [newUsername]: oldUserData
            };
            delete updatedLoginData[oldUsername];

            await setData('denglu', updatedLoginData);
            
            return { success: true, message: '用户名修改成功' };
        } catch (error) {
            console.error('修改用户名失败：', error);
            return { success: false, message: '修改失败，请重试' };
        }
    }

    // 修改登录密码
    async function changePassword(username, newPassword) {
        try {
            const loginData = await getData('denglu');
            if (!loginData) {
                return { success: false, message: '系统未初始化' };
            }

            // 检查用户是否存在
            const userData = loginData[username];
            if (!userData) {
                return { success: false, message: '用户不存在' };
            }

            // 更新密码
            const updatedLoginData = {
                ...loginData,
                [username]: {
                    ...userData,
                    password: newPassword
                }
            };

            await setData('denglu', updatedLoginData);
            
            return { success: true, message: '密码修改成功' };
        } catch (error) {
            console.error('修改密码失败：', error);
            return { success: false, message: '修改失败，请重试' };
        }
    }

    // 公开接口
    return {
        getData,
        setData,
        getMedicines,
        getAvailableFields,
        getDisplaySettings,
        saveDisplaySettings,
        validateLogin,
        changeUsername,     // 新增
        changePassword,     // 新增
        waitForInit: () => initPromise,
        get isReady() { return !!database; }
    };
})();

// 暴露到全局
window.FirebaseModule = FirebaseModule;