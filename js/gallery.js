/**
 * 相册功能 - 照片上传、展示、管理
 * 使用 imgbb 图床进行图片存储，支持永久保存
 *
 * 存储方案：
 * 1. 默认照片列表：存储在 GitHub 仓库 data/photos.json，永久保存
 * 2. 本地上传：临时存储在 localStorage，换设备会丢失
 * 3. 上传后复制链接给我，我帮你添加到永久列表
 */

// imgbb 配置 - 请替换为你自己的 API Key
const IMGBB_CONFIG = {
    // 获取方式：https://api.imgbb.com/ 点击 Get API Key
    apiKey: '8f87602e18258b5ec178cd0ab7c4b450',
    // 免费版限制：每分钟最多 50 次请求，单张图片最大 32MB
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
        console.log('  - 默认照片:', this.defaultPhotos.length, '张');
        console.log('  - 本地照片:', this.photos.length, '张');
    }

    // 从 GitHub 加载默认照片列表
    async loadDefaultPhotos() {
        try {
            const response = await fetch(DEFAULT_PHOTOS_URL);
            const data = await response.json();
            // 过滤掉空的示例照片
            this.defaultPhotos = data.filter(p => p.src && p.src.startsWith('http'));
            console.log('✅ 从 GitHub 加载了', this.defaultPhotos.length, '张默认照片');
        } catch (e) {
            console.log('📷 未找到默认照片列表');
            this.defaultPhotos = [];
        }
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

    // 上传到 imgbb 图床
    async uploadToImgbb(file) {
        if (!IMGBB_CONFIG.apiKey) {
            return null;
        }

        try {
            // 压缩图片以减小上传大小
            const compressedBase64 = await this.compressImage(file, 1920, 0.85);
            // 移除 data:image/jpeg;base64, 前缀
            const base64Data = compressedBase64.split(',')[1];

            const formData = new FormData();
            formData.append('image', base64Data);
            formData.append('key', IMGBB_CONFIG.apiKey);

            const response = await fetch('https://api.imgbb.com/1/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                return {
                    url: result.data.url,
                    thumbnail: result.data.thumb?.url || result.data.url,
                    deleteUrl: result.data.delete_url,
                    width: result.data.width,
                    height: result.data.height
                };
            } else {
                console.error('imgbb 上传失败:', result.error);
                return null;
            }
        } catch (error) {
            console.error('imgbb 上传出错:', error);
            return null;
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

            const hint = this.showUploadHint('正在上传照片到云端...', 'loading');

            try {
                let imageUrl = null;
                let isPermanent = false;

                // 尝试上传到 imgbb
                if (IMGBB_CONFIG.apiKey) {
                    hint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在上传到云端...';
                    const uploadResult = await this.uploadToImgbb(file);

                    if (uploadResult && uploadResult.url) {
                        imageUrl = uploadResult.url;
                        isPermanent = true;
                        hint.innerHTML = '<i class="fas fa-check-circle"></i> 上传成功！照片已永久保存';

                        // 显示照片链接，让用户可以复制
                        setTimeout(() => {
                            this.showPhotoLink(imageUrl, file.name);
                        }, 500);
                    } else {
                        hint.innerHTML = '<i class="fas fa-exclamation-circle"></i> 云端上传失败，保存到本地...';
                    }
                }

                // 如果云端上传失败或未配置 API Key，保存到本地
                if (!imageUrl) {
                    imageUrl = await this.compressImage(file, 1200, 0.8);
                    isPermanent = false;
                    hint.innerHTML = '<i class="fas fa-info-circle"></i> 照片已保存到本地浏览器';
                }

                const photo = {
                    id: Date.now() + Math.random(),
                    src: imageUrl,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'image',
                    isPermanent: isPermanent
                };

                this.photos.unshift(photo);
                this.saveToStorage();
                this.render();

                if (isPermanent) {
                    setTimeout(() => hint.remove(), 1500);
                } else {
                    setTimeout(() => hint.remove(), 2000);
                }

                resolve(photo);
            } catch (error) {
                hint.remove();
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

    // 显示照片链接，让用户可以复制
    showPhotoLink(url, name) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3>📷 照片上传成功</h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">
                    把这个链接发给我，我帮你添加到永久列表
                </p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin-bottom: 15px; word-break: break-all; font-size: 0.85rem;">
                    ${url}
                </div>
                <button class="submit-btn" onclick="navigator.clipboard.writeText('${url}').then(() => alert('已复制到剪贴板！'))">
                    <i class="fas fa-copy"></i> 复制链接
                </button>
                <p style="color: #999; font-size: 0.8rem; margin-top: 15px;">
                    💡 复制链接后发给我，我帮你永久保存到网站
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
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
    deleteMedia(id, type) {
        if (type === 'image') {
            this.photos = this.photos.filter(p => p.id !== id);
        } else {
            this.videos = this.videos.filter(v => v.id !== id);
        }
        this.saveToStorage();
        this.render();
    }

    // 渲染相册
    render() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        // 清空占位符
        grid.innerHTML = '';

        // 合并：默认照片（GitHub永久）+ 本地照片 + 视频
        const allMedia = [...this.photos, ...this.videos, ...this.defaultPhotos];

        if (allMedia.length === 0) {
            grid.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-images"></i>
                    <p>点击上方按钮上传照片</p>
                    <p class="placeholder-hint">上传后告诉我链接，我帮你永久保存</p>
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
                item.innerHTML = `<img src="${media.src}" alt="${media.name || '照片'}">`;
            }

            item.addEventListener('click', () => this.openLightbox(index));
            grid.appendChild(item);
        });
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
}

// 导出给主脚本使用
window.Gallery = Gallery;
