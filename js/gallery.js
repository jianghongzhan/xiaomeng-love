/**
 * 相册功能 - 照片上传、展示、管理
 * 图片直接存储到 GitHub 仓库，国内外都能访问
 *
 * 存储方案：
 * 1. 图片存储：GitHub 仓库 images/ 目录
 * 2. 数据同步：GitHub API 自动同步到 photos.json
 * 3. 所有设备都能看到相同的照片列表
 */

// GitHub 配置 - 用于跨设备同步和图片存储
const GITHUB_CONFIG = {
    owner: 'jianghongzhan',
    repo: 'xiaomeng-love',
    branch: 'main',
    filePath: 'data/photos.json',
    imagesPath: 'images',  // 图片存储目录
    tokenKey: 'xiaomeng_github_token',
};

// 默认照片列表（永久保存在 GitHub）
const DEFAULT_PHOTOS_URL = 'https://raw.githubusercontent.com/jianghongzhan/xiaomeng-love/main/data/photos.json';

class Gallery {
    constructor() {
        this.photos = [];
        this.videos = [];
        this.defaultPhotos = []; // 从 GitHub 加载的默认照片
        this.currentIndex = 0;
        this.storageKey = 'xiaomeng_gallery_final';
        this.githubToken = localStorage.getItem(GITHUB_CONFIG.tokenKey) || '';

        this.init();
    }

    async init() {
        // 先加载默认照片（从 GitHub）
        await this.loadDefaultPhotos();
        // 再加载本地照片
        this.loadFromStorage();
        // 渲染
        this.render();
        console.log('📷 相册初始化完成');
        console.log('  - GitHub云照片:', this.defaultPhotos.length, '张');
        console.log('  - 本地照片:', this.photos.length, '张');
        console.log('  - GitHub同步:', this.githubToken ? '✅ 已配置' : '❌ 未配置Token');
    }

    // ========== GitHub 同步功能 ==========

    // 获取 GitHub Token
    getGithubToken() {
        return localStorage.getItem(GITHUB_CONFIG.tokenKey) || '';
    }

    // 设置 GitHub Token
    setGithubToken(token) {
        if (token) {
            localStorage.setItem(GITHUB_CONFIG.tokenKey, token);
            this.githubToken = token;
            console.log('✅ GitHub Token 已保存');
        } else {
            localStorage.removeItem(GITHUB_CONFIG.tokenKey);
            this.githubToken = '';
            console.log('🗑️ GitHub Token 已删除');
        }
    }

    // 检查是否配置了 GitHub Token
    isGithubConfigured() {
        return !!this.getGithubToken();
    }

    // 从 GitHub 获取当前 photos.json 内容和 SHA
    async getGithubFile() {
        const token = this.getGithubToken();
        if (!token) {
            throw new Error('请先配置 GitHub Token');
        }

        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // 文件不存在，返回空内容
                return { content: [], sha: null };
            }
            if (response.status === 401) {
                throw new Error('Token 无效或已过期，请重新生成');
            }
            if (response.status === 403) {
                throw new Error('Token 权限不足，请确保勾选了 repo 权限');
            }
            throw new Error(`GitHub API 错误: ${response.status}`);
        }

        const data = await response.json();
        const content = JSON.parse(atob(data.content));
        return { content, sha: data.sha };
    }

    // 更新 GitHub 上的 photos.json
    async updateGithubPhotos(photos) {
        const token = this.getGithubToken();
        if (!token) {
            console.log('⚠️ 未配置 GitHub Token，跳过同步');
            return false;
        }

        try {
            const { sha } = await this.getGithubFile();

            const content = JSON.stringify(photos, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;

            const body = {
                message: `feat(相册): 更新照片列表 - ${new Date().toLocaleString('zh-CN')}`,
                content: encodedContent,
                branch: GITHUB_CONFIG.branch
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('GitHub API 返回错误:', errorData);

                if (response.status === 401) {
                    throw new Error('Token 无效或已过期，请重新生成');
                }
                if (response.status === 403) {
                    throw new Error('Token 权限不足！请确保：\n1. 勾选了 repo 权限\n2. Token 未过期\n3. 是 Classic Token 而非 Fine-grained');
                }
                throw new Error(errorData.message || `更新失败 (${response.status})`);
            }

            console.log('✅ 照片列表已同步到 GitHub');
            return true;
        } catch (error) {
            console.error('❌ 同步到 GitHub 失败:', error);
            throw error; // 抛出错误让上层处理
        }
    }

    // 显示 GitHub Token 配置弹窗
    showGithubConfig() {
        const currentToken = this.getGithubToken();
        const maskedToken = currentToken ? currentToken.substring(0, 8) + '...' : '';

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3>⚙️ GitHub 同步配置</h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">
                    配置 GitHub Token 后，照片将自动同步到云端，所有设备都能看到
                </p>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                        GitHub Personal Access Token
                    </label>
                    <input type="password" id="githubTokenInput"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value="${currentToken}"
                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.85rem;">
                    <strong>📋 获取 Token 步骤：</strong><br>
                    1. 访问 <a href="https://github.com/settings/tokens/new" target="_blank" style="color: #ff69b4;">GitHub Token 页面</a><br>
                    2. 勾选 <code>repo</code> 权限<br>
                    3. 点击 Generate token 并复制
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="submit-btn" onclick="window.galleryInstance.saveGithubConfig()">
                        <i class="fas fa-save"></i> 保存配置
                    </button>
                    <button class="submit-btn" style="background: #6c757d;" onclick="window.galleryInstance.testGithubConnection()">
                        <i class="fas fa-plug"></i> 测试连接
                    </button>
                </div>
                <p style="color: #999; font-size: 0.8rem; margin-top: 15px;">
                    🔒 Token 只保存在你的浏览器本地，不会上传到任何地方
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // 保存 GitHub 配置
    saveGithubConfig() {
        const input = document.getElementById('githubTokenInput');
        const token = input.value.trim();

        if (!token) {
            alert('请输入 GitHub Token');
            return;
        }

        if (!token.startsWith('ghp_')) {
            alert('Token 格式不正确，应该以 ghp_ 开头');
            return;
        }

        this.setGithubToken(token);
        alert('✅ GitHub Token 已保存！现在上传的照片会自动同步到云端');

        // 关闭弹窗
        document.querySelector('.modal.active')?.remove();
    }

    // 测试 GitHub 连接
    async testGithubConnection() {
        const input = document.getElementById('githubTokenInput');
        const token = input.value.trim();

        if (!token) {
            alert('请先输入 GitHub Token');
            return;
        }

        try {
            const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                alert('✅ 连接成功！Token 有效');
            } else {
                alert('❌ 连接失败：Token 无效或没有权限');
            }
        } catch (error) {
            alert('❌ 连接失败：' + error.message);
        }
    }

    // 从 GitHub 加载默认照片列表
    async loadDefaultPhotos() {
        try {
            // 添加时间戳避免缓存
            const url = DEFAULT_PHOTOS_URL + '?t=' + Date.now();
            console.log('📥 正在从 GitHub 加载照片列表...', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 GitHub 返回数据:', data);

            // 过滤掉空的示例照片
            this.defaultPhotos = data.filter(p => p.src && p.src.startsWith('http'));
            console.log('✅ 从 GitHub 加载了', this.defaultPhotos.length, '张云照片');

            // 显示每张照片的信息
            this.defaultPhotos.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name} - ${p.src.substring(0, 50)}...`);
            });
        } catch (e) {
            console.error('❌ 加载 GitHub 照片列表失败:', e);
            this.defaultPhotos = [];
        }
    }

    // 强制刷新照片列表（用户可调用）
    async refreshPhotos() {
        console.log('🔄 强制刷新照片列表...');
        await this.loadDefaultPhotos();
        this.render();
        return this.defaultPhotos.length;
    }

    // 迁移旧版本数据（从所有可能的 key 迁移）
    migrateOldData() {
        // 所有可能的旧 key
        const allPossibleKeys = [
            'xiaomeng_gallery',
            'xiaomeng_gallery_v2',
            'xiaomeng_gallery_v3',
            'xiaomeng_gallery_v4',
            'xiaomeng_gallery_v5',
            'xiaomeng_timeline', // 防止写错
            'gallery'
        ];

        let foundData = null;
        let foundKey = null;

        // 查找包含数据的 key
        for (const key of allPossibleKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.photos && parsed.photos.length > 0) {
                        foundData = parsed;
                        foundKey = key;
                        console.log('📦 在', key, '发现', parsed.photos.length, '张照片');
                        break;
                    }
                }
            } catch (e) {
                // 忽略解析错误
            }
        }

        // 如果找到数据，保存到最终 key
        if (foundData) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(foundData));
                console.log('✅ 数据已迁移到最终存储位置');
            } catch (e) {
                console.error('迁移数据失败:', e);
            }
        }
    }

    // 从 localStorage 加载数据
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.photos = parsed.photos || [];
                this.videos = parsed.videos || [];
                console.log('✅ 从本地存储加载了', this.photos.length, '张照片');
            } else {
                console.log('📷 本地存储中没有照片数据');
            }
        } catch (e) {
            console.error('加载相册数据失败:', e);
        }
    }

    // 保存到 localStorage
    saveToStorage() {
        try {
            const data = {
                photos: this.photos,
                videos: this.videos,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('💾 保存成功！当前照片数量:', this.photos.length);

            // 验证保存是否成功
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const verify = JSON.parse(saved);
                console.log('✅ 验证成功，已保存', verify.photos?.length || 0, '张照片');
            }
        } catch (e) {
            console.error('❌ 保存相册数据失败:', e);
            alert('保存失败：' + e.message);
        }
    }

    // 压缩图片
    compressImage(file, maxWidth = 1920, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            img.onerror = () => reject(new Error('图片加载失败'));

            const reader = new FileReader();
            reader.onload = (e) => img.src = e.target.result;
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
        });
    }

    // 上传图片到 GitHub 仓库
    async uploadToGithub(file) {
        const token = this.getGithubToken();
        if (!token) {
            throw new Error('请先配置 GitHub Token');
        }

        try {
            // 压缩图片
            const compressedBase64 = await this.compressImage(file, 1920, 0.85);

            // 生成文件名：时间戳 + 原始文件名
            const timestamp = Date.now();
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
            const filePath = `${GITHUB_CONFIG.imagesPath}/${fileName}`;

            // 移除 data:image/jpeg;base64, 前缀
            const base64Data = compressedBase64.split(',')[1];

            // 上传到 GitHub
            const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `feat(相册): 上传照片 ${fileName}`,
                    content: base64Data,
                    branch: GITHUB_CONFIG.branch
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '上传失败');
            }

            const result = await response.json();

            // 返回 GitHub raw 链接
            const imageUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${filePath}`;

            console.log('✅ 图片已上传到 GitHub:', imageUrl);

            return {
                url: imageUrl,
                path: filePath
            };
        } catch (error) {
            console.error('❌ 上传图片到 GitHub 失败:', error);
            throw error;
        }
    }

    // 显示上传提示
    showUploadHint(message, type = 'loading') {
        const existingHint = document.querySelector('.upload-hint');
        if (existingHint) existingHint.remove();

        const hint = document.createElement('div');
        hint.className = 'upload-hint';

        const icons = {
            loading: '<i class="fas fa-spinner fa-spin"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>'
        };

        hint.innerHTML = `${icons[type] || icons.loading} ${message}`;
        hint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 71, 87, 0.95)' : 'rgba(0, 0, 0, 0.85)'};
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            z-index: 9999;
            font-size: 1.1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(hint);

        if (type !== 'loading') {
            setTimeout(() => hint.remove(), 2000);
        }

        return hint;
    }

    // 添加照片
    async addPhoto(file) {
        return new Promise(async (resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('请选择图片文件'));
                return;
            }

            // imgbb 限制 32MB
            if (file.size > 32 * 1024 * 1024) {
                reject(new Error('图片大小不能超过 32MB'));
                return;
            }

            // 检查是否配置了 GitHub Token
            if (!this.isGithubConfigured()) {
                this.showGithubConfig();
                reject(new Error('请先配置 GitHub Token 以启用云端同步'));
                return;
            }

            const hint = this.showUploadHint('正在上传照片...', 'loading');

            try {
                // 上传图片到 GitHub 仓库
                hint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在上传到 GitHub...';
                const uploadResult = await this.uploadToGithub(file);

                const imageUrl = uploadResult.url;

                // 创建照片对象
                const photo = {
                    id: Date.now() + Math.random(),
                    src: imageUrl,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'image'
                };

                // 更新照片列表
                hint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在同步照片列表...';

                // 获取当前 GitHub 上的照片列表
                const { content: githubPhotos } = await this.getGithubFile();

                // 添加新照片到列表开头
                const updatedPhotos = [photo, ...githubPhotos.filter(p => p.src && p.src.startsWith('http'))];

                // 更新 photos.json
                await this.updateGithubPhotos(updatedPhotos);

                // 更新本地显示
                this.defaultPhotos = updatedPhotos;
                this.render();

                hint.innerHTML = '<i class="fas fa-check-circle"></i> ✅ 上传成功！所有设备可见';
                setTimeout(() => hint.remove(), 2000);

                resolve(photo);
            } catch (error) {
                hint.remove();
                // 显示详细错误信息
                const errorMsg = error.message || '上传失败';
                alert('❌ ' + errorMsg);
                reject(error);
            }
        });
    }

    // 添加永久图片链接（手动输入）
    addPhotoByUrl(url, name = '') {
        if (!url || !url.startsWith('http')) {
            alert('请输入有效的图片链接');
            return false;
        }

        const photo = {
            id: Date.now() + Math.random(),
            src: url,
            name: name || `照片 ${this.photos.length + 1}`,
            date: new Date().toLocaleDateString('zh-CN'),
            type: 'image',
            isPermanent: true
        };

        this.photos.unshift(photo);
        this.saveToStorage();
        this.render();
        this.showTip('永久照片添加成功！');

        return true;
    }

    // 显示提示
    showTip(message) {
        const tip = document.createElement('div');
        tip.className = 'gallery-tip';
        tip.innerHTML = `<i class="fas fa-heart"></i> ${message}`;
        tip.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 105, 180, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            z-index: 9999;
            font-size: 0.95rem;
            box-shadow: 0 5px 20px rgba(255, 105, 180, 0.4);
            animation: fadeInUp 0.3s ease;
        `;

        document.body.appendChild(tip);
        setTimeout(() => {
            tip.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => tip.remove(), 300);
        }, 2000);
    }

    // 显示上传成功提示（已废弃，保留兼容）
    showPhotoLink(url, name) {
        // 现在自动同步到 GitHub，不再需要手动复制链接
        console.log('📷 照片已上传:', url);
    }

    // 添加视频（视频太大，只能存本地）
    addVideo(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('video/')) {
                reject(new Error('请选择视频文件'));
                return;
            }

            // 检查文件大小（限制 50MB）
            if (file.size > 50 * 1024 * 1024) {
                reject(new Error('视频大小不能超过 50MB'));
                return;
            }

            // 显示上传提示
            const uploadHint = document.createElement('div');
            uploadHint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在处理视频...';
            uploadHint.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 9999;
            `;
            document.body.appendChild(uploadHint);

            const reader = new FileReader();
            reader.onload = (e) => {
                const video = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'video'
                };
                this.videos.unshift(video);
                this.saveToStorage();
                this.render();

                uploadHint.innerHTML = '<i class="fas fa-check"></i> 上传成功！';
                setTimeout(() => uploadHint.remove(), 1500);

                resolve(video);
            };
            reader.onerror = () => {
                uploadHint.remove();
                reject(new Error('读取文件失败'));
            };
            reader.readAsDataURL(file);
        });
    }

    // 删除媒体
    async deleteMedia(id, type) {
        // 先从本地删除
        if (type === 'image') {
            this.photos = this.photos.filter(p => p.id !== id);
        } else {
            this.videos = this.videos.filter(v => v.id !== id);
        }

        // 如果是照片且配置了 GitHub，同步删除
        if (type === 'image' && this.isGithubConfigured()) {
            // 从 GitHub 照片列表中删除
            const updatedPhotos = this.defaultPhotos.filter(p => p.id !== id);

            if (updatedPhotos.length !== this.defaultPhotos.length) {
                await this.updateGithubPhotos(updatedPhotos);
                this.defaultPhotos = updatedPhotos;
                console.log('✅ 已从云端删除照片');
            }
        }

        this.saveToStorage();
        this.render();
    }

    // 渲染相册
    render() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) {
            console.error('❌ 找不到 galleryGrid 元素');
            return;
        }

        // 清空占位符
        grid.innerHTML = '';

        // 合并：默认照片（GitHub永久）+ 本地照片 + 视频
        const allMedia = [...this.defaultPhotos, ...this.photos, ...this.videos];

        console.log('🖼️ 渲染相册:');
        console.log('  - GitHub云照片:', this.defaultPhotos.length);
        console.log('  - 本地照片:', this.photos.length);
        console.log('  - 本地视频:', this.videos.length);
        console.log('  - 总计:', allMedia.length);

        if (allMedia.length === 0) {
            grid.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-images"></i>
                    <p>点击上方按钮上传照片</p>
                    <p class="placeholder-hint">配置 GitHub Token 后，照片将自动同步到云端</p>
                </div>
            `;
            return;
        }

        allMedia.forEach((media, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.index = index;
            item.dataset.type = media.type || 'image';
            item.dataset.id = media.id;

            if (media.type === 'video') {
                item.innerHTML = `
                    <video src="${media.src}" muted></video>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 2rem;">
                        <i class="fas fa-play-circle"></i>
                    </div>
                `;
            } else {
                const img = document.createElement('img');
                img.src = media.src;
                img.alt = media.name || '照片';
                img.onerror = () => {
                    console.error('❌ 图片加载失败:', media.src);
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em">加载失败</text></svg>';
                };
                img.onload = () => {
                    console.log('✅ 图片加载成功:', index + 1);
                };
                item.appendChild(img);
            }

            item.addEventListener('click', () => this.openLightbox(index));
            grid.appendChild(item);
        });

        console.log('✅ 相册渲染完成，共', allMedia.length, '张');
    }

    // 打开灯箱
    openLightbox(index) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxVideo = document.getElementById('lightboxVideo');

        this.currentIndex = index;
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];
        const media = allMedia[index];

        if (media.type === 'video') {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = media.src;
        } else {
            lightboxVideo.style.display = 'none';
            lightboxImg.style.display = 'block';
            lightboxImg.src = media.src;
        }

        lightbox.classList.add('active');
    }

    // 关闭灯箱
    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxVideo = document.getElementById('lightboxVideo');

        lightbox.classList.remove('active');
        lightboxVideo.pause();
    }

    // 上一张
    prevMedia() {
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];
        this.currentIndex = (this.currentIndex - 1 + allMedia.length) % allMedia.length;
        this.updateLightbox();
    }

    // 下一张
    nextMedia() {
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];
        this.currentIndex = (this.currentIndex + 1) % allMedia.length;
        this.updateLightbox();
    }

    // 更新灯箱内容
    updateLightbox() {
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxVideo = document.getElementById('lightboxVideo');
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];
        const media = allMedia[this.currentIndex];

        if (media.type === 'video') {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = media.src;
        } else {
            lightboxVideo.style.display = 'none';
            lightboxImg.style.display = 'block';
            lightboxImg.src = media.src;
        }
    }

    // 获取当前媒体
    getCurrentMedia() {
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];
        return allMedia[this.currentIndex];
    }

    // 清空所有媒体
    clearAll() {
        this.photos = [];
        this.videos = [];
        this.saveToStorage();
        this.render();
    }

    // 清除所有本地数据并重新加载（调试用）
    async resetAndReload() {
        console.log('🔄 清除本地数据并重新加载...');

        // 清除所有可能的存储 key
        const keysToRemove = [
            this.storageKey,
            'xiaomeng_gallery',
            'xiaomeng_gallery_v2',
            'xiaomeng_gallery_v3',
            'xiaomeng_gallery_v4',
            'xiaomeng_gallery_v5',
            'gallery'
        ];

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ 已删除:', key);
        });

        // 重置本地数据
        this.photos = [];
        this.videos = [];

        // 重新加载
        await this.loadDefaultPhotos();
        this.render();

        console.log('✅ 重置完成！云照片数量:', this.defaultPhotos.length);
        alert('✅ 已清除本地数据，重新加载了 ' + this.defaultPhotos.length + ' 张云照片');
    }
}

// 导出给主脚本使用
window.Gallery = Gallery;

// 创建全局实例（方便 HTML 按钮调用配置方法）
document.addEventListener('DOMContentLoaded', () => {
    // 等待 Gallery 实例创建后绑定到全局
    setTimeout(() => {
        if (window.gallery) {
            window.galleryInstance = window.gallery;
        }
    }, 100);
});
