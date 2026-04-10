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
    initLoveStats();
    initConfession();
    initLoveNotes();
    initTimeline();
    initGallery();
    initChristmasTree();
    initMessages();
    initMusicPlayer();
    initBackToTop();
    initParticles();
    initFireworks();

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
    const configBtn = document.getElementById('configBtn');
    const fileInput = document.getElementById('fileInput');
    const videoInput = document.getElementById('videoInput');
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const deleteBtn = document.getElementById('deleteMediaBtn');

    // 初始化相册
    window.gallery = new Gallery();
    window.galleryInstance = window.gallery; // 供 HTML 调用

    // 上传照片
    uploadBtn?.addEventListener('click', () => fileInput?.click());

    // 云端配置
    configBtn?.addEventListener('click', () => {
        window.gallery.showGithubConfig();
    });

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
    const addMusicBtn = document.getElementById('addMusicBtn');
    const progressBar = document.getElementById('progressBar');
    const titleEl = player?.querySelector('.music-title');
    const musicModal = document.getElementById('musicModal');
    const musicForm = document.getElementById('musicForm');
    const musicFileInput = document.getElementById('musicFile');
    const musicList = document.getElementById('musicList');

    // 创建音频元素
    const audio = new Audio();
    let currentIndex = 0;
    let isPlaying = false;
    let songs = [];

    // 默认音乐列表（存储在 GitHub 仓库中，永久可访问）
    const defaultSongs = [
        {
            id: 'default_1',
            title: '悦神 (念白版) - KBShinya',
            data: 'https://raw.githubusercontent.com/jianghongzhan/xiaomeng-love/main/music/yueshen.mp3'
        },
        {
            id: 'default_2',
            title: '一个人想着一个人 (林凡氛围感版) - 艾比利',
            data: 'https://raw.githubusercontent.com/jianghongzhan/xiaomeng-love/main/music/yigeren.mp3'
        },
        {
            id: 'default_3',
            title: '小宇 - 蓝心羽',
            data: 'https://raw.githubusercontent.com/jianghongzhan/xiaomeng-love/main/music/xiaoyu.mp3'
        }
    ];

    // IndexedDB 存储音乐
    const DB_NAME = 'xiaomeng_music_db';
    const STORE_NAME = 'songs';
    let db = null;

    // 初始化 IndexedDB
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    // 保存音乐到 IndexedDB
    async function saveSong(song) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(song);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 加载所有音乐
    async function loadSongs() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 删除音乐
    async function deleteSong(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 渲染音乐列表
    function renderMusicList() {
        if (songs.length === 0) {
            musicList.innerHTML = '<p style="font-size: 0.9rem; color: #999;">暂无音乐，请上传</p>';
            return;
        }

        musicList.innerHTML = songs.map((song, index) => `
            <div class="music-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f5f5; border-radius: 8px; margin-bottom: 8px;">
                <span style="font-size: 0.9rem;">${index + 1}. ${song.title}</span>
                <button onclick="removeSong(${index})" style="background: none; border: none; color: #ff4757; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // 全局删除函数
    window.removeSong = async function(index) {
        if (confirm('确定删除这首歌吗？')) {
            await deleteSong(songs[index].id);
            songs.splice(index, 1);
            renderMusicList();
            if (songs.length > 0) {
                loadSong(0);
            } else {
                titleEl.textContent = '点击添加音乐';
            }
        }
    };

    function loadSong(index) {
        if (songs[index] && songs[index].data) {
            audio.src = songs[index].data;
            if (titleEl) titleEl.textContent = songs[index].title;
            console.log('🎵 加载歌曲:', songs[index].title);
        } else {
            if (titleEl) titleEl.textContent = '请添加音乐';
        }
    }

    function togglePlay() {
        if (songs.length === 0) {
            alert('请先添加音乐文件');
            return;
        }

        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audio.play().catch(e => {
                console.log('播放失败:', e);
            });
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        isPlaying = !isPlaying;
    }

    // 打开添加音乐模态框
    addMusicBtn?.addEventListener('click', () => {
        musicModal?.classList.add('active');
        renderMusicList();
    });

    // 关闭模态框
    musicModal?.querySelector('.modal-close')?.addEventListener('click', () => {
        musicModal.classList.remove('active');
    });

    musicModal?.addEventListener('click', (e) => {
        if (e.target === musicModal) {
            musicModal.classList.remove('active');
        }
    });

    // 上传音乐
    musicForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = musicFileInput.files[0];
        if (!file) {
            alert('请选择音乐文件');
            return;
        }

        // 检查文件大小（限制 20MB）
        if (file.size > 20 * 1024 * 1024) {
            alert('音乐文件不能超过 20MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const song = {
                id: Date.now(),
                title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
                data: e.target.result
            };

            try {
                await saveSong(song);
                songs.push(song);
                renderMusicList();
                loadSong(songs.length - 1);
                musicFileInput.value = '';
                alert('音乐添加成功！');
            } catch (error) {
                console.error('保存音乐失败:', error);
                alert('保存失败，请重试');
            }
        };
        reader.readAsDataURL(file);
    });

    // 最小化/展开播放器
    toggle?.addEventListener('click', () => {
        player.classList.toggle('minimized');
    });

    // 播放/暂停
    playBtn?.addEventListener('click', togglePlay);

    // 上一首
    prevBtn?.addEventListener('click', () => {
        if (songs.length === 0) return;
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play();
    });

    // 下一首
    nextBtn?.addEventListener('click', () => {
        if (songs.length === 0) return;
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
        if (songs.length > 1) {
            currentIndex = (currentIndex + 1) % songs.length;
            loadSong(currentIndex);
            audio.play();
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        }
    });

    // 初始化
    initDB().then(async () => {
        const localSongs = await loadSongs();
        console.log('🎵 本地存储了', localSongs.length, '首歌曲');
        console.log('🎵 GitHub 默认音乐:', defaultSongs.length, '首');

        // 合并：默认音乐 + 本地上传的音乐
        // 使用 Map 去重（以 id 为 key）
        const songMap = new Map();

        // 先添加默认音乐
        defaultSongs.forEach(song => {
            songMap.set(song.id, song);
        });

        // 再添加本地音乐（会覆盖相同 id 的）
        localSongs.forEach(song => {
            songMap.set(song.id, song);
        });

        songs = Array.from(songMap.values());
        console.log('🎵 总共', songs.length, '首歌曲可用');

        if (songs.length > 0) {
            loadSong(0);
        }
    }).catch(err => {
        console.error('IndexedDB 初始化失败:', err);
        // 失败时使用默认音乐
        songs = defaultSongs;
        if (songs.length > 0) {
            loadSong(0);
        }
    });
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

// ========== 浪漫数据统计 ==========
function initLoveStats() {
    const heartbeatsEl = document.getElementById('heartbeats');
    const thoughtsEl = document.getElementById('thoughts');

    // 每分钟心跳约72次
    const HEARTBEATS_PER_MINUTE = 72;
    // 每天想你次数（自定义）
    const THOUGHTS_PER_DAY = 1000;

    function updateStats() {
        const now = new Date();
        const diff = now - CONFIG.startDate;

        // 计算总分钟数
        const totalMinutes = Math.floor(diff / (1000 * 60));
        // 心跳次数
        const heartbeats = totalMinutes * HEARTBEATS_PER_MINUTE;
        // 想你次数
        const totalDays = diff / (1000 * 60 * 60 * 24);
        const thoughts = Math.floor(totalDays * THOUGHTS_PER_DAY);

        if (heartbeatsEl) heartbeatsEl.textContent = formatNumber(heartbeats);
        if (thoughtsEl) thoughtsEl.textContent = formatNumber(thoughts);
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    updateStats();
    setInterval(updateStats, 60000); // 每分钟更新
}

// ========== 表白墙 ==========
function initConfession() {
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');
    const confessionResult = document.getElementById('confessionResult');
    const confessionQuestion = document.querySelector('.confession-question');

    // 打字机效果文字
    const typingText = document.querySelector('.typing-text');
    const confessionMessage = '在这个世界上，有一个人会永远爱你、陪伴你...那个人就是我。';
    let charIndex = 0;

    function typeWriter() {
        if (charIndex < confessionMessage.length) {
            typingText.textContent += confessionMessage.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 100);
        }
    }

    // 延迟开始打字效果
    setTimeout(typeWriter, 1000);

    // "不愿意"按钮逃跑效果
    btnNo?.addEventListener('mouseenter', () => {
        const maxX = window.innerWidth - btnNo.offsetWidth - 50;
        const maxY = window.innerHeight - btnNo.offsetHeight - 50;
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;

        btnNo.style.position = 'fixed';
        btnNo.style.left = randomX + 'px';
        btnNo.style.top = randomY + 'px';
        btnNo.style.transition = 'all 0.3s ease';
    });

    // "我愿意"按钮点击
    btnYes?.addEventListener('click', () => {
        confessionQuestion.style.display = 'none';
        confessionResult.style.display = 'block';

        // 触发大量烟花
        if (window.fireworksCanvas) {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * (window.innerHeight * 0.6);
                    window.fireworksCanvas.createFirework(x, y);
                }, i * 200);
            }
        }

        // 保存表白状态
        localStorage.setItem('xiaomeng_confession', 'accepted');
    });

    // 检查是否已经表白成功
    if (localStorage.getItem('xiaomeng_confession') === 'accepted') {
        confessionQuestion.style.display = 'none';
        confessionResult.style.display = 'block';
    }
}

// ========== 情话生成器 ==========
function initLoveNotes() {
    const generateBtn = document.getElementById('generateBtn');
    const lovenoteText = document.getElementById('lovenoteText');
    const collectionList = document.getElementById('collectionList');
    const storageKey = 'xiaomeng_lovenotes';

    // 情话库
    const loveNotes = [
        "遇见你是我最美丽的意外，爱上你是我最正确的决定。",
        "如果爱你是错，那我宁愿一错再错。",
        "你是我生命中最温柔的等待，也是最长情的告白。",
        "我愿意用我所有的运气，换取和你在一起的每一天。",
        "你是我藏在微风里的欢喜，是我不轻易说出口的秘密。",
        "世间万物皆苦，你明目张胆的偏爱就是救赎。",
        "你的名字，是我见过最短的情诗。",
        "往后余生，风雪是你，平淡是你，清贫是你，荣华是你，心底温柔是你。",
        "我喜欢你，像风走了八万里，不问归期。",
        "你是我纸短情长的雨季，也是我往后余生的晴空万里。",
        "想牵你的手，从心动到古稀，从晨光到暮霭。",
        "你的眼里有星辰大海，而我只想做你眼中最亮的那颗星。",
        "我愿意变成你喜欢的样子，如果不喜欢，那我就变成你喜欢的一切样子。",
        "遇见你之后，我才明白，原来心动可以是一种常态。",
        "你是我穷极一生也做不完的梦。",
        "我不想要全世界，只想你在我身边。",
        "你是我心尖上的温柔，也是我眼里的星辰。",
        "喜欢你是眼见的喜欢，爱你是心里的依赖。",
        "你就像一颗糖，让我的生活甜甜的。",
        "你是我漫漫人生路上，最美的风景。",
        "想把世界上最好的都给你，却发现世界上最好的就是你。",
        "你的笑容，是我疲惫生活里的温柔梦想。",
        "我喜欢的样子你都有，你有的样子我都喜欢。",
        "你是我唯一的偏爱，也是我余生的例外。",
        "爱你不需要理由，但如果非要一个理由，那就是因为是你。",
        "想和你一起看日出日落，一起数星星月亮，一起慢慢变老。",
        "你是我写过最美的情书，也是我收到最好的礼物。",
        "我爱你，不是因为你是谁，而是因为和你在一起时，我是谁。",
        "你是我平凡生活里的英雄梦想。",
        "遇见你，是我这辈子最大的幸运；爱上你，是我这辈子最幸福的事。"
    ];

    // 生成随机情话
    function generateNote() {
        const randomIndex = Math.floor(Math.random() * loveNotes.length);
        lovenoteText.style.opacity = 0;

        setTimeout(() => {
            lovenoteText.textContent = loveNotes[randomIndex];
            lovenoteText.style.opacity = 1;
        }, 300);
    }

    // 收藏情话
    function saveNote(text) {
        const notes = loadNotes();
        notes.push({
            id: Date.now(),
            text: text
        });
        localStorage.setItem(storageKey, JSON.stringify(notes));
        renderCollection();
    }

    // 加载收藏的情话
    function loadNotes() {
        try {
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // 渲染收藏列表
    function renderCollection() {
        const notes = loadNotes();
        if (notes.length === 0) {
            collectionList.innerHTML = '<p class="empty-hint">点击情话卡片右上角可收藏</p>';
            return;
        }

        collectionList.innerHTML = notes.map(note => `
            <div class="collection-item">
                <p>${note.text}</p>
                <button onclick="deleteNote(${note.id})"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }

    // 删除收藏
    window.deleteNote = function(id) {
        const notes = loadNotes().filter(n => n.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(notes));
        renderCollection();
    };

    // 双击收藏
    lovenoteText?.addEventListener('dblclick', () => {
        saveNote(lovenoteText.textContent);
        alert('已收藏这句情话！💕');
    });

    // 点击生成
    generateBtn?.addEventListener('click', generateNote);

    // 初始渲染
    renderCollection();
}

// ========== 烟花特效 ==========
function initFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 设置画布大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 烟花粒子类
    class Particle {
        constructor(x, y, color, velocity) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.velocity = velocity;
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.015;
            this.gravity = 0.05;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.velocity.x *= 0.99;
            this.velocity.y *= 0.99;
            this.velocity.y += this.gravity;
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= this.decay;
        }
    }

    // 烟花类
    class Firework {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.particles = [];
            this.colors = [
                '#FF69B4', '#FF1493', '#FFD700', '#FF6B6B',
                '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'
            ];

            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const particleCount = 100;

            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 / particleCount) * i;
                const speed = Math.random() * 6 + 2;
                this.particles.push(new Particle(x, y, color, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }));
            }
        }

        draw() {
            this.particles.forEach(p => {
                if (p.alpha > 0) {
                    p.draw();
                    p.update();
                }
            });
        }

        isDead() {
            return this.particles.every(p => p.alpha <= 0);
        }
    }

    // 烟花数组
    let fireworks = [];

    // 动画循环
    function animate() {
        ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        fireworks = fireworks.filter(f => !f.isDead());
        fireworks.forEach(f => f.draw());

        requestAnimationFrame(animate);
    }
    animate();

    // 创建烟花
    function createFirework(x, y) {
        fireworks.push(new Firework(x, y));
    }

    // 点击创建烟花
    canvas.addEventListener('click', (e) => {
        createFirework(e.clientX, e.clientY);
    });

    // 导出创建烟花函数
    window.fireworksCanvas = { createFirework };
}
