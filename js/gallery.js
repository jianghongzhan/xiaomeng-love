/**
 * 相册功能 - 照片上传、展示、管理
 * 使用免费图床 sm.ms 进行图片存储，支持永久保存
 */

class Gallery {
    constructor() {
        this.photos = [];
        this.videos = [];
        this.currentIndex = 0;
        this.storageKey = 'xiaomeng_gallery_v2'; // 新版本存储key

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
            if (e.name === 'QuotaExceededError') {
                alert('存储空间不足，请删除一些照片后再试');
            }
        }
    }

    // 压缩图片
    compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 计算缩放比例
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // 绘制压缩后的图片
                ctx.drawImage(img, 0, 0, width, height);

                // 转为 base64
                const compressedData = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedData);
            };

            img.onerror = () => reject(new Error('图片加载失败'));

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
        });
    }

    // 上传到免费图床 sm.ms
    async uploadToImageHost(file) {
        try {
            const formData = new FormData();
            formData.append('smfile', file);

            const response = await fetch('https://sm.ms/api/v2/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                return {
                    url: result.data.url,
                    deleteUrl: result.data.delete
                };
            } else if (result.code === 'image_repeated') {
                // 图片已存在，返回已有URL
                return {
                    url: result.images,
                    deleteUrl: null
                };
            } else {
                throw new Error(result.message || '上传失败');
            }
        } catch (error) {
            console.error('图床上传失败:', error);
            return null;
        }
    }

    // 添加照片
    async addPhoto(file) {
        return new Promise(async (resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('请选择图片文件'));
                return;
            }

            // 检查文件大小（限制 10MB）
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('图片大小不能超过 10MB'));
                return;
            }

            // 显示上传提示
            const uploadHint = document.createElement('div');
            uploadHint.className = 'upload-hint';
            uploadHint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在上传照片...';
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
                font-size: 1.1rem;
            `;
            document.body.appendChild(uploadHint);

            try {
                let imageUrl = null;
                let isCompressed = false;

                // 如果图片小于 5MB，尝试上传到图床
                if (file.size < 5 * 1024 * 1024) {
                    const uploadResult = await this.uploadToImageHost(file);
                    if (uploadResult && uploadResult.url) {
                        imageUrl = uploadResult.url;
                    }
                }

                // 如果图床上传失败，压缩后存储到本地
                if (!imageUrl) {
                    try {
                        imageUrl = await this.compressImage(file, 1200, 0.7);
                        isCompressed = true;
                    } catch (e) {
                        // 压缩失败，直接读取原图
                        imageUrl = await new Promise((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = (e) => res(e.target.result);
                            reader.onerror = () => rej(new Error('读取文件失败'));
                            reader.readAsDataURL(file);
                        });
                        isCompressed = true;
                    }
                }

                const photo = {
                    id: Date.now() + Math.random(),
                    src: imageUrl,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'image',
                    isCompressed: isCompressed,
                    isHosted: !isCompressed
                };

                this.photos.unshift(photo);
                this.saveToStorage();
                this.render();

                uploadHint.innerHTML = '<i class="fas fa-check"></i> 上传成功！';
                setTimeout(() => uploadHint.remove(), 1500);

                resolve(photo);
            } catch (error) {
                uploadHint.remove();
                reject(error);
            }
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
