/**
 * 相册功能 - 照片上传、展示、管理
 *
 * 存储方案说明：
 * 1. 照片链接手动添加：通过 GitHub Issue 上传图片获取永久链接
 * 2. 本地预览：临时照片存 localStorage（压缩后）
 */

class Gallery {
    constructor() {
        this.photos = [];
        this.videos = [];
        this.currentIndex = 0;
        this.storageKey = 'xiaomeng_gallery_v3';

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
        this.initManualAdd();
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
    compressImage(file, maxWidth = 1200, quality = 0.8) {
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

    // 添加照片（本地预览或永久链接）
    async addPhoto(file) {
        return new Promise(async (resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('请选择图片文件'));
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('图片大小不能超过 10MB'));
                return;
            }

            try {
                // 压缩图片
                const compressedSrc = await this.compressImage(file, 1200, 0.8);

                const photo = {
                    id: Date.now() + Math.random(),
                    src: compressedSrc,
                    name: file.name,
                    date: new Date().toLocaleDateString('zh-CN'),
                    type: 'image',
                    isLocal: true
                };

                this.photos.unshift(photo);
                this.saveToStorage();
                this.render();

                // 提示用户
                this.showTip('照片已保存到本地！如需永久保存，请使用"添加永久链接"功能');

                resolve(photo);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 添加永久图片链接
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
            isLocal: false,
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
        tip.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
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
        }, 3000);
    }

    // 初始化手动添加功能
    initManualAdd() {
        // 创建添加链接按钮
        const controls = document.querySelector('.gallery-controls');
        if (controls) {
            const addUrlBtn = document.createElement('button');
            addUrlBtn.className = 'upload-btn';
            addUrlBtn.id = 'addUrlBtn';
            addUrlBtn.innerHTML = '<i class="fas fa-link"></i> 添加永久链接';
            controls.appendChild(addUrlBtn);

            addUrlBtn.addEventListener('click', () => this.showUrlModal());
        }
    }

    // 显示URL输入模态框
    showUrlModal() {
        const existingModal = document.getElementById('urlModal');
        if (existingModal) {
            existingModal.classList.add('active');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'urlModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <span class="modal-close">&times;</span>
                <h3>添加永久照片链接</h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">
                    💡 如何获取永久链接？<br>
                    1. 打开 <a href="https://github.com/jianghongzhan/xiaomeng-love/issues" target="_blank" style="color: #FF69B4;">GitHub Issues</a><br>
                    2. 新建 Issue，拖入图片，复制生成的链接
                </p>
                <form id="urlForm">
                    <div class="form-group">
                        <label>图片链接</label>
                        <input type="url" id="photoUrl" placeholder="https://github.com/user-attachments/..." required>
                    </div>
                    <div class="form-group">
                        <label>照片名称（可选）</label>
                        <input type="text" id="photoName" placeholder="我们的合照">
                    </div>
                    <button type="submit" class="submit-btn">添加照片</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // 关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // 提交事件
        modal.querySelector('#urlForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const url = modal.querySelector('#photoUrl').value;
            const name = modal.querySelector('#photoName').value;
            if (this.addPhotoByUrl(url, name)) {
                modal.classList.remove('active');
                modal.querySelector('#photoUrl').value = '';
                modal.querySelector('#photoName').value = '';
            }
        });

        modal.classList.add('active');
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
