/**
 * 主逻辑文件 - 初始化和协调所有功能
 */

// ========== 全局配置 ==========
const CONFIG = {
    // 💕 在一起的日期 - 2026年4月10日，我们故事开始的第一天
    // 使用本地时间（年, 月-1, 日, 时, 分）避免时区问题
    startDate: new Date(2026, 3, 10, 0, 0, 0), // 月份从0开始，3表示4月
    // 音乐列表
    musicList: [
        {
            title: '温柔旋律',
            // 使用免费的在线音乐资源
            src: 'https://music.163.com/song/media/outer/url?id=1901371647.mp3'
        }
    ]
};

// ========== DOM 加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLoveCounter();
    initTimeline();
    initGallery();
    initChristmasTree();
    initMessages();
    initMusicPlayer();
    initBackToTop();
    initParticles();

    // 初始化圣诞树为散开状态
    setTimeout(() => {
        if (window.christmasTree) {
            window.christmasTree.setTarget('disperse');
        }
    }, 100);
});

// ========== 导航功能 ==========
function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-link');

    // 移动端菜单切换
    menuToggle?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // 点击导航项关闭菜单
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            // 更新活动状态
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 滚动时更新导航状态
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
}

// ========== 爱情计时器 ==========
function initLoveCounter() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCounter() {
        const now = new Date();
        const diff = now - CONFIG.startDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours;
        if (minutesEl) minutesEl.textContent = minutes;
        if (secondsEl) secondsEl.textContent = seconds;
    }

    updateCounter();
    setInterval(updateCounter, 1000);
}

// ========== 时间轴功能 ==========
function initTimeline() {
    const storageKey = 'xiaomeng_timeline';
    const container = document.getElementById('timeline-items');
    const addBtn = document.getElementById('addTimelineBtn');
    const modal = document.getElementById('timelineModal');
    const form = document.getElementById('timelineForm');
    const closeBtn = modal?.querySelector('.modal-close');

    // 默认时间线数据 - 记录我们美好的第一天
    const defaultTimeline = [
        {
            date: '2026-04-10',
            title: '💕 我们在一起的第一天',
            content: '今天，是我们故事的开始。从这一刻起，我的世界因为你而变得更加美好。小萌，谢谢你来到我的生命里，未来的每一天，我都会好好珍惜你、爱护你。这是我送给你的专属网站，记录我们的点点滴滴。'
        }
    ];

    // 加载数据
    function loadData() {
        try {
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultTimeline;
        } catch (e) {
            return defaultTimeline;
        }
    }

    // 保存数据
    function saveData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // 渲染时间线
    function render() {
        const data = loadData();
        if (!container) return;

        container.innerHTML = '';

        data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'timeline-item';
            el.innerHTML = `
                <div class="timeline-content">
                    <span class="timeline-date">${formatDate(item.date)}</span>
                    <h3 class="timeline-title">${item.title}</h3>
                    <p class="timeline-text">${item.content}</p>
                </div>
                <div class="timeline-dot"></div>
            `;
            container.appendChild(el);
        });
    }

    // 格式化日期
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 打开模态框
    addBtn?.addEventListener('click', () => {
        modal.classList.add('active');
        // 设置默认日期为今天
        document.getElementById('timelineDate').valueAsDate = new Date();
    });

    // 关闭模态框
    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // 提交表单
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('timelineDate').value;
        const title = document.getElementById('timelineTitle').value;
        const content = document.getElementById('timelineContent').value;

        const data = loadData();
        data.push({ date, title, content });
        saveData(data);
        render();

        // 关闭模态框并重置表单
        modal.classList.remove('active');
        form.reset();
    });

    render();
}

// ========== 相册功能 ==========
function initGallery() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadVideoBtn = document.getElementById('uploadVideoBtn');
    const fileInput = document.getElementById('fileInput');
    const videoInput = document.getElementById('videoInput');
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const deleteBtn = document.getElementById('deleteMediaBtn');

    // 初始化相册
    window.gallery = new Gallery();

    // 上传照片
    uploadBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                await window.gallery.addPhoto(file);
            } catch (err) {
                alert(err.message);
            }
        }
        e.target.value = '';
    });

    // 上传视频
    uploadVideoBtn?.addEventListener('click', () => videoInput?.click());

    videoInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                await window.gallery.addVideo(file);
            } catch (err) {
                alert(err.message);
            }
        }
        e.target.value = '';
    });

    // 灯箱控制
    lightboxClose?.addEventListener('click', () => {
        window.gallery.closeLightbox();
    });

    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            window.gallery.closeLightbox();
        }
    });

    prevBtn?.addEventListener('click', () => window.gallery.prevMedia());
    nextBtn?.addEventListener('click', () => window.gallery.nextMedia());

    // 删除媒体
    deleteBtn?.addEventListener('click', () => {
        const media = window.gallery.getCurrentMedia();
        if (media && confirm('确定要删除这个文件吗？')) {
            window.gallery.deleteMedia(media.id, media.type);
            window.gallery.closeLightbox();
        }
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!lightbox?.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                window.gallery.prevMedia();
                break;
            case 'ArrowRight':
                window.gallery.nextMedia();
                break;
            case 'Escape':
                window.gallery.closeLightbox();
                break;
        }
    });
}

// ========== 圣诞树功能 ==========
function initChristmasTree() {
    const canvas = document.getElementById('tree-canvas');
    if (!canvas) return;

    window.christmasTree = new ChristmasTree('tree-canvas');

    const assembleBtn = document.getElementById('assembleBtn');
    const disperseBtn = document.getElementById('disperseBtn');
    const heartBtn = document.getElementById('heartBtn');

    assembleBtn?.addEventListener('click', () => {
        window.christmasTree.setTarget('tree');
    });

    disperseBtn?.addEventListener('click', () => {
        window.christmasTree.setTarget('disperse');
    });

    heartBtn?.addEventListener('click', () => {
        window.christmasTree.setTarget('heart');
    });
}

// ========== 留言板功能 ==========
function initMessages() {
    const storageKey = 'xiaomeng_messages';
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessage');
    const list = document.getElementById('messagesList');

    // 默认留言 - 第一天的告白
    const defaultMessages = [
        {
            id: 1,
            text: '小萌，从今天开始，你就是我最特别的人。这个网站是专门为你创建的，记录我们在一起的每一个美好瞬间。💕',
            time: '2026-04-10 12:00'
        },
        {
            id: 2,
            text: '谢谢你愿意走进我的生活。未来的路，我们一起走。每一天，我都会比昨天更爱你。✨',
            time: '2026-04-10 12:01'
        },
        {
            id: 3,
            text: '这里是我们的专属空间，可以上传照片、写下回忆、播放音乐。想对你说的话，都可以留在这里。💝',
            time: '2026-04-10 12:02'
        }
    ];

    // 加载数据
    function loadData() {
        try {
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultMessages;
        } catch (e) {
            return defaultMessages;
        }
    }

    // 保存数据
    function saveData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // 渲染留言
    function render() {
        const data = loadData();
        if (!list) return;

        list.innerHTML = '';

        data.sort((a, b) => b.id - a.id).forEach(msg => {
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML = `
                <p class="message-text">${msg.text}</p>
                <span class="message-time">${msg.time}</span>
                <button class="message-delete" data-id="${msg.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(card);
        });

        // 绑定删除事件
        list.querySelectorAll('.message-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const data = loadData().filter(m => m.id !== id);
                saveData(data);
                render();
            });
        });
    }

    // 发送留言
    function sendMessage() {
        if (!input || !input.value.trim()) return;

        const data = loadData();
        data.push({
            id: Date.now(),
            text: input.value.trim(),
            time: new Date().toLocaleString('zh-CN')
        });
        saveData(data);
        render();
        input.value = '';
    }

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    render();
}

// ========== 音乐播放器 ==========
function initMusicPlayer() {
    const player = document.getElementById('musicPlayer');
    const toggle = document.getElementById('musicToggle');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const titleEl = player?.querySelector('.music-title');

    // 创建音频元素
    const audio = new Audio();
    let currentIndex = 0;
    let isPlaying = false;

    // 由于跨域限制，使用备用方案
    // 可以添加本地音乐或使用其他免费音乐源
    const songs = [
        {
            title: '温柔旋律',
            src: '' // 用户可以自行添加音乐
        }
    ];

    function loadSong(index) {
        if (songs[index] && songs[index].src) {
            audio.src = songs[index].src;
            if (titleEl) titleEl.textContent = songs[index].title;
        } else {
            if (titleEl) titleEl.textContent = '请添加音乐';
        }
    }

    function togglePlay() {
        if (!audio.src) {
            alert('请先添加音乐文件');
            return;
        }

        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audio.play().catch(() => {
                console.log('播放失败，可能需要用户交互');
            });
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        isPlaying = !isPlaying;
    }

    // 最小化/展开播放器
    toggle?.addEventListener('click', () => {
        player.classList.toggle('minimized');
    });

    // 播放/暂停
    playBtn?.addEventListener('click', togglePlay);

    // 上一首
    prevBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play();
    });

    // 下一首
    nextBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % songs.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play();
    });

    // 更新进度条
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        if (progressBar) progressBar.style.width = progress + '%';
    });

    // 播放结束
    audio.addEventListener('ended', () => {
        currentIndex = (currentIndex + 1) % songs.length;
        loadSong(currentIndex);
        audio.play();
    });

    loadSong(currentIndex);

    // 添加提示：用户可以通过控制台添加音乐
    console.log('%c🎵 如何添加背景音乐', 'font-size: 16px; color: #FF69B4;');
    console.log('%c方法1: 在 index.html 中添加 <audio> 标签指向本地音乐文件', 'color: #666;');
    console.log('%c方法2: 使用在线音乐链接，修改 js/main.js 中的 songs 数组', 'color: #666;');
}

// ========== 返回顶部 ==========
function initBackToTop() {
    const btn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn?.classList.add('visible');
        } else {
            btn?.classList.remove('visible');
        }
    });

    btn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== 粒子特效 ==========
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    window.particleSystem = new ParticleSystem('particles-canvas');
}

// ========== 工具函数 ==========

// 平滑滚动到指定元素
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    element?.scrollIntoView({ behavior: 'smooth' });
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
