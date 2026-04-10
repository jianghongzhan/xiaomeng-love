# 💕 小萌的浪漫空间

一个为女朋友小萌精心制作的浪漫网站，记录我们的美好时光。

## ✨ 功能特色

- **🏠 首页** - 粒子爱心飘落特效 + 在一起计时器
- **📅 时光轴** - 记录重要时刻，支持添加新回忆
- **📷 相册** - 支持上传照片和视频，本地存储
- **🎄 魔法圣诞树** - 粒子聚散动画，可切换爱心形状
- **💬 留言板** - 写下想说的话
- **🎵 背景音乐** - 温柔励志的音乐播放器

## 🚀 访问地址

[https://jianghongzhan.github.io/xiaomeng-love](https://jianghongzhan.github.io/xiaomeng-love)

## 🛠️ 本地运行

1. 克隆仓库
```bash
git clone https://github.com/jianghongzhan/xiaomeng-love.git
```

2. 打开 `index.html` 文件即可

## 📝 自定义设置

### 修改在一起日期

编辑 `js/main.js` 文件中的 `CONFIG.startDate`：

```javascript
const CONFIG = {
    startDate: new Date('2023-02-14'), // 修改为实际日期
    // ...
};
```

### 添加背景音乐

方法1：在 `index.html` 中添加本地音乐文件
```html
<audio id="bgMusic" src="你的音乐文件.mp3"></audio>
```

方法2：修改 `js/main.js` 中的 `songs` 数组
```javascript
const songs = [
    {
        title: '歌曲名',
        src: '音乐URL或本地路径'
    }
];
```

## 💾 数据存储

所有数据（照片、视频、留言、时间线）都保存在浏览器的 localStorage 中。
- 照片限制：5MB 以内
- 视频限制：20MB 以内

## 📱 响应式设计

支持桌面端和移动端访问，自适应不同屏幕尺寸。

## 🎨 技术栈

- HTML5 + CSS3 + JavaScript
- Canvas 粒子动画
- LocalStorage 本地存储
- GitHub Pages 部署

---

💕 用爱制作，献给最特别的小萌 💕
