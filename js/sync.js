/**
 * 云端数据同步模块
 * 将留言、打卡、许愿等数据同步到 GitHub
 */

class CloudSync {
    constructor() {
        this.config = {
            owner: 'jianghongzhan',
            repo: 'xiaomeng-love',
            branch: 'main',
            dataPath: 'data',
            tokenKey: 'xiaomeng_github_token'
        };

        // 自动初始化 UI
        this.initUI();
    }

    // 初始化 UI 事件绑定
    initUI() {
        document.addEventListener('DOMContentLoaded', () => {
            // 绑定设置按钮点击事件
            const syncBtn = document.getElementById('syncSettingsBtn');
            const syncModal = document.getElementById('syncModal');
            const closeBtn = syncModal?.querySelector('.modal-close');

            syncBtn?.addEventListener('click', () => {
                this.showConfigModal();
            });

            closeBtn?.addEventListener('click', () => {
                syncModal.classList.remove('active');
            });

            syncModal?.addEventListener('click', (e) => {
                if (e.target === syncModal) {
                    syncModal.classList.remove('active');
                }
            });

            // 保存配置按钮
            document.getElementById('saveSyncConfig')?.addEventListener('click', () => {
                this.saveConfig();
            });

            // 测试连接按钮
            document.getElementById('testSyncConnection')?.addEventListener('click', () => {
                this.testConnection();
            });

            // 立即同步按钮
            document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
                const btn = document.getElementById('syncNowBtn');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
                btn.disabled = true;

                try {
                    await this.syncAll();
                    btn.innerHTML = '<i class="fas fa-check"></i> 同步成功';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-sync"></i> 立即同步';
                        btn.disabled = false;
                    }, 2000);
                } catch (e) {
                    btn.innerHTML = '<i class="fas fa-times"></i> 同步失败';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-sync"></i> 立即同步';
                        btn.disabled = false;
                    }, 2000);
                }

                this.updateDataStats();
            });

            // 更新按钮状态
            this.updateSyncButton();
        });
    }

    // 显示配置模态框
    showConfigModal() {
        const modal = document.getElementById('syncModal');
        const tokenInput = document.getElementById('githubTokenInput');

        if (tokenInput) {
            tokenInput.value = this.getToken();
        }

        this.updateSyncStatus();
        this.updateDataStats();

        modal?.classList.add('active');
    }

    // 更新同步按钮状态
    updateSyncButton() {
        const btn = document.getElementById('syncSettingsBtn');
        if (this.isConfigured()) {
            btn?.classList.add('configured');
        } else {
            btn?.classList.remove('configured');
        }
    }

    // 更新同步状态显示
    updateSyncStatus() {
        const indicator = document.getElementById('syncIndicator');
        const statusText = document.getElementById('syncStatusText');
        const statusDiv = document.getElementById('syncStatus');

        if (this.isConfigured()) {
            indicator.style.color = '#28a745';
            statusText.textContent = '已配置 - 数据将自动同步到云端';
            statusDiv?.classList.add('configured');
        } else {
            indicator.style.color = '#dc3545';
            statusText.textContent = '未配置 - 数据仅保存在本地';
            statusDiv?.classList.remove('configured');
        }
    }

    // 更新数据统计
    updateDataStats() {
        const statsDiv = document.getElementById('syncDataStats');
        if (!statsDiv) return;

        const messages = JSON.parse(localStorage.getItem('xiaomeng_messages') || '[]');
        const checkin = JSON.parse(localStorage.getItem('xiaomeng_checkin') || '{}');
        const wishes = JSON.parse(localStorage.getItem('xiaomeng_wishes') || '[]');
        const lovenotes = JSON.parse(localStorage.getItem('xiaomeng_lovenotes') || '[]');
        const timeline = JSON.parse(localStorage.getItem('xiaomeng_timeline') || '[]');

        statsDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div>💬 留言：<strong>${messages.length}</strong> 条</div>
                <div>📅 打卡：<strong>${(checkin.dates || []).length}</strong> 天</div>
                <div>🌟 许愿：<strong>${wishes.length}</strong> 个</div>
                <div>💝 情话：<strong>${lovenotes.length}</strong> 条</div>
                <div>📝 回忆：<strong>${timeline.length}</strong> 条</div>
            </div>
        `;
    }

    // 保存配置
    saveConfig() {
        const input = document.getElementById('githubTokenInput');
        const token = input?.value.trim();

        if (!token) {
            alert('请输入 GitHub Token');
            return;
        }

        if (!token.startsWith('ghp_')) {
            alert('Token 格式不正确，应该以 ghp_ 开头');
            return;
        }

        localStorage.setItem(this.config.tokenKey, token);
        alert('✅ GitHub Token 已保存！现在数据会自动同步到云端');

        this.updateSyncStatus();
        this.updateSyncButton();
    }

    // 测试连接
    async testConnection() {
        const token = document.getElementById('githubTokenInput')?.value.trim();

        if (!token) {
            alert('请先输入 GitHub Token');
            return;
        }

        try {
            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                alert('✅ 连接成功！Token 有效且有权限访问仓库');
            } else if (response.status === 401) {
                alert('❌ Token 无效或已过期');
            } else if (response.status === 403) {
                alert('❌ Token 权限不足，请确保勾选了 repo 权限');
            } else {
                alert('❌ 连接失败：' + response.status);
            }
        } catch (error) {
            alert('❌ 连接失败：' + error.message);
        }
    }

    // 获取 Token
    getToken() {
        return localStorage.getItem(this.config.tokenKey) || '';
    }

    // 检查是否已配置
    isConfigured() {
        return !!this.getToken();
    }

    // 获取云端文件内容（公开仓库不需要 Token 也能读取）
    async getFile(fileName) {
        const token = this.getToken();

        try {
            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataPath}/${fileName}?ref=${this.config.branch}`;
            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };

            // 如果有 Token，添加认证头（提高 API 限制）
            if (token) {
                headers['Authorization'] = `token ${token}`;
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                if (response.status === 404) return null;
                return null;
            }

            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            return { content, sha: data.sha };
        } catch (e) {
            console.error('获取云端数据失败:', e);
            return null;
        }
    }

    // 保存文件到云端
    async saveFile(fileName, content, retryCount = 0) {
        const token = this.getToken();
        if (!token) return false;

        const maxRetries = 5;

        try {
            // 先获取当前 SHA
            const existing = await this.getFile(fileName);
            const sha = existing?.sha;

            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataPath}/${fileName}`;
            const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

            const body = {
                message: `sync: 更新 ${fileName} - ${new Date().toLocaleString('zh-CN')}`,
                content: encodedContent,
                branch: this.config.branch
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
                const error = await response.json();
                console.error('保存云端数据失败:', error);

                // 409 冲突重试
                if (response.status === 409 && retryCount < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
                    return this.saveFile(fileName, content, retryCount + 1);
                }

                return false;
            }

            console.log(`✅ ${fileName} 已同步到云端`);
            return true;
        } catch (e) {
            console.error('保存云端数据失败:', e);

            if (retryCount < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
                return this.saveFile(fileName, content, retryCount + 1);
            }

            return false;
        }
    }

    // 合并本地和云端数据（以最新为准）
    mergeData(localData, cloudData, key = 'time') {
        if (!localData && !cloudData) return [];
        if (!localData) return cloudData;
        if (!cloudData) return localData;

        // 使用 Map 去重，以 id 或 time 为 key
        const map = new Map();

        [...cloudData, ...localData].forEach(item => {
            const k = item.id || item.time || JSON.stringify(item);
            // 如果已存在，保留更新的那个
            if (map.has(k)) {
                const existing = map.get(k);
                if (new Date(item.time) > new Date(existing.time)) {
                    map.set(k, item);
                }
            } else {
                map.set(k, item);
            }
        });

        return Array.from(map.values());
    }

    // 同步留言数据
    async syncMessages() {
        const localMessages = JSON.parse(localStorage.getItem('xiaomeng_messages') || '[]');
        const cloud = await this.getFile('messages.json');

        if (cloud) {
            const merged = this.mergeData(localMessages, cloud.content);
            localStorage.setItem('xiaomeng_messages', JSON.stringify(merged));
            // 只有配置了 Token 才写回云端
            if (this.isConfigured()) {
                await this.saveFile('messages.json', merged);
            }
            console.log('💬 留言同步完成:', merged.length, '条');
            return merged;
        } else if (localMessages.length > 0 && this.isConfigured()) {
            await this.saveFile('messages.json', localMessages);
            return localMessages;
        }

        return localMessages;
    }

    // 同步打卡数据
    async syncCheckin() {
        const localCheckin = JSON.parse(localStorage.getItem('xiaomeng_checkin') || '{}');
        const cloud = await this.getFile('checkin.json');

        if (cloud) {
            // 合并签到日期
            const localDates = localCheckin.dates || [];
            const cloudDates = cloud.content.dates || [];
            const mergedDates = [...new Set([...localDates, ...cloudDates])].sort();

            const merged = { dates: mergedDates };
            localStorage.setItem('xiaomeng_checkin', JSON.stringify(merged));
            // 只有配置了 Token 才写回云端
            if (this.isConfigured()) {
                await this.saveFile('checkin.json', merged);
            }
            console.log('📅 打卡同步完成:', mergedDates.length, '天');
            return merged;
        } else if (localCheckin.dates?.length > 0 && this.isConfigured()) {
            await this.saveFile('checkin.json', localCheckin);
            return localCheckin;
        }

        return localCheckin;
    }

    // 同步许愿数据
    async syncWishes() {
        const localWishes = JSON.parse(localStorage.getItem('xiaomeng_wishes') || '[]');
        const cloud = await this.getFile('wishes.json');

        if (cloud) {
            const merged = this.mergeData(localWishes, cloud.content);
            localStorage.setItem('xiaomeng_wishes', JSON.stringify(merged));
            // 只有配置了 Token 才写回云端
            if (this.isConfigured()) {
                await this.saveFile('wishes.json', merged);
            }
            console.log('🌟 许愿同步完成:', merged.length, '个');
            return merged;
        } else if (localWishes.length > 0 && this.isConfigured()) {
            await this.saveFile('wishes.json', localWishes);
            return localWishes;
        }

        return localWishes;
    }

    // 同步情话收藏
    async syncLoveNotes() {
        const localNotes = JSON.parse(localStorage.getItem('xiaomeng_lovenotes') || '[]');
        const cloud = await this.getFile('lovenotes.json');

        if (cloud) {
            const merged = this.mergeData(localNotes, cloud.content);
            localStorage.setItem('xiaomeng_lovenotes', JSON.stringify(merged));
            // 只有配置了 Token 才写回云端
            if (this.isConfigured()) {
                await this.saveFile('lovenotes.json', merged);
            }
            console.log('💝 情话同步完成:', merged.length, '条');
            return merged;
        } else if (localNotes.length > 0 && this.isConfigured()) {
            await this.saveFile('lovenotes.json', localNotes);
            return localNotes;
        }

        return localNotes;
    }

    // 同步时间轴数据
    async syncTimeline() {
        const localTimeline = JSON.parse(localStorage.getItem('xiaomeng_timeline') || '[]');
        const cloud = await this.getFile('timeline.json');

        if (cloud) {
            const merged = this.mergeData(localTimeline, cloud.content, 'date');
            localStorage.setItem('xiaomeng_timeline', JSON.stringify(merged));
            // 只有配置了 Token 才写回云端
            if (this.isConfigured()) {
                await this.saveFile('timeline.json', merged);
            }
            console.log('📝 时间轴同步完成:', merged.length, '条');
            return merged;
        } else if (localTimeline.length > 0 && this.isConfigured()) {
            await this.saveFile('timeline.json', localTimeline);
            return localTimeline;
        }

        return localTimeline;
    }

    // 一键同步所有数据（始终从云端拉取，有 Token 时才写回）
    async syncAll() {
        console.log('🔄 开始同步数据...');
        console.log('  - 读取云端数据：无需 Token');
        console.log('  - 写入云端：', this.isConfigured() ? '✅ 已配置 Token' : '❌ 未配置 Token（仅读取）');

        const results = await Promise.all([
            this.syncMessages(),
            this.syncCheckin(),
            this.syncWishes(),
            this.syncLoveNotes(),
            this.syncTimeline()
        ]);

        console.log('✅ 数据同步完成');
        return {
            messages: results[0],
            checkin: results[1],
            wishes: results[2],
            lovenotes: results[3],
            timeline: results[4]
        };
    }

    // 保存单个数据类型
    async saveDataType(type, data) {
        if (!this.isConfigured()) return false;

        const fileMap = {
            messages: 'messages.json',
            checkin: 'checkin.json',
            wishes: 'wishes.json',
            lovenotes: 'lovenotes.json',
            timeline: 'timeline.json'
        };

        const fileName = fileMap[type];
        if (!fileName) return false;

        return await this.saveFile(fileName, data);
    }
}

// 创建全局实例
window.cloudSync = new CloudSync();

// 导出
window.CloudSync = CloudSync;
