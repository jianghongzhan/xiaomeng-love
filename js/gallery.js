/**
 * 相册功能 - 照片上传、展示、管理
 * 使用 imgbb 图床进行图片存储，支持永久保存
 *
 * 配置：在下方 IMGBB_CONFIG 中填入你的 API Key
 */

// imgbb 配置 - 请替换为你自己的 API Key
const IMGBB_CONFIG = {
    // 获取方式：https://api.imgbb.com/ 点击 Get API Key
    apiKey: '', // 在这里填入你的 imgbb API Key
    // 免费版限制：每分钟最多 50 次请求，单张图片最大 32MB
};

class Gallery {
    constructor() {
        this.photos = [];
        this.videos = [];
        this.currentIndex = 0;
        this.storageKey = 'xiaomeng_gallery_v4';

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
        this.checkApiKey();
    }

    // 检查 API Key 是否已配置
    checkApiKey() {
        if (!IMGBB_CONFIG.apiKey) {
            console.warn('⚠️ imgbb API Key 未配置，照片将只保存在本地浏览器');
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
                videos: this.videos
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('保存相册数据失败:', e);
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

                setTimeout(() => hint.remove(), 2000);

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

        // 合并所有媒体并按时间排序
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);

        if (allMedia.length === 0) {
            grid.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-images"></i>
                    <p>点击上方按钮上传照片</p>
                </div>
            `;
            return;
        }

        allMedia.forEach((media, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.index = index;
            item.dataset.type = media.type;
            item.dataset.id = media.id;

            if (media.type === 'video') {
                item.innerHTML = `
                    <video src="${media.src}" muted></video>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 2rem;">
                        <i class="fas fa-play-circle"></i>
                    </div>
                `;
            } else {
                item.innerHTML = `<img src="${media.src}" alt="${media.name}">`;
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
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);
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
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);
        this.currentIndex = (this.currentIndex - 1 + allMedia.length) % allMedia.length;
        this.updateLightbox();
    }

    // 下一张
    nextMedia() {
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);
        this.currentIndex = (this.currentIndex + 1) % allMedia.length;
        this.updateLightbox();
    }

    // 更新灯箱内容
    updateLightbox() {
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxVideo = document.getElementById('lightboxVideo');
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);
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
        const allMedia = [...this.photos, ...this.videos].sort((a, b) => b.id - a.id);
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
