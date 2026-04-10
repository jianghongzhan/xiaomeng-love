/**
 * 相册功能 - 照片上传、展示、管理
 */

class Gallery {
    constructor() {
        this.photos = [];
        this.videos = [];
        this.currentIndex = 0;
        this.storageKey = 'xiaomeng_gallery';

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
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
            // 可能是存储空间不足
            if (e.name === 'QuotaExceededError') {
                alert('存储空间不足，请删除一些照片后再试');
            }
        }
    }

    // 添加照片
    addPhoto(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('请选择图片文件'));
                return;
            }

            // 检查文件大小（限制 5MB）
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('图片大小不能超过 5MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const photo = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'image'
                };
                this.photos.unshift(photo);
                this.saveToStorage();
                this.render();
                resolve(photo);
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
        });
    }

    // 添加视频
    addVideo(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('video/')) {
                reject(new Error('请选择视频文件'));
                return;
            }

            // 检查文件大小（限制 20MB）
            if (file.size > 20 * 1024 * 1024) {
                reject(new Error('视频大小不能超过 20MB'));
                return;
            }

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
                resolve(video);
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
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
