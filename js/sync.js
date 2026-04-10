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
    }

    // 获取 Token
    getToken() {
        return localStorage.getItem(this.config.tokenKey) || '';
    }

    // 检查是否已配置
    isConfigured() {
        return !!this.getToken();
    }

    // 获取云端文件内容
    async getFile(fileName) {
        const token = this.getToken();
        if (!token) return null;

        try {
            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataPath}/${fileName}?ref=${this.config.branch}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

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
            await this.saveFile('messages.json', merged);
            return merged;
        } else if (localMessages.length > 0) {
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
            await this.saveFile('checkin.json', merged);
            return merged;
        } else if (localCheckin.dates?.length > 0) {
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
            await this.saveFile('wishes.json', merged);
            return merged;
        } else if (localWishes.length > 0) {
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
            await this.saveFile('lovenotes.json', merged);
            return merged;
        } else if (localNotes.length > 0) {
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
            await this.saveFile('timeline.json', merged);
            return merged;
        } else if (localTimeline.length > 0) {
            await this.saveFile('timeline.json', localTimeline);
            return localTimeline;
        }

        return localTimeline;
    }

    // 一键同步所有数据
    async syncAll() {
        if (!this.isConfigured()) {
            console.log('⚠️ 未配置 GitHub Token，跳过云端同步');
            return;
        }

        console.log('🔄 开始同步数据到云端...');

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
