/**
 * 圣诞树粒子聚散动画
 */

class ChristmasTree {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.targetPoints = [];
        this.state = 'disperse'; // disperse, tree, heart
        this.animationId = null;
        this.mouse = { x: null, y: null };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('click', (e) => {
            this.mouse.x = e.clientX - this.canvas.getBoundingClientRect().left;
            this.mouse.y = e.clientY - this.canvas.getBoundingClientRect().top;
        });

        this.init();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = Math.min(800, container.clientWidth - 40);
        this.canvas.height = 600;
        this.generateTreePoints();
        this.generateHeartPoints();
    }

    init() {
        // 创建粒子
        const particleCount = 300;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                targetX: 0,
                targetY: 0,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 2,
                color: this.getRandomColor(),
                angle: Math.random() * Math.PI * 2
            });
        }

        this.animate();
    }

    getRandomColor() {
        const colors = [
            '#FF69B4',  // 粉色
            '#FFB6C1',  // 浅粉
            '#FFD700',  // 金色
            '#00FF00',  // 绿色
            '#FF0000',  // 红色
            '#FFFFFF',  // 白色
            '#87CEEB'   // 天蓝
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateTreePoints() {
        this.treePoints = [];
        const centerX = this.canvas.width / 2;
        const baseY = this.canvas.height - 80;
        const height = 450;
        const levels = 15;

        // 生成圣诞树形状的点
        for (let level = 0; level < levels; level++) {
            const y = baseY - (level / levels) * height;
            const width = (1 - level / levels) * 150 + 20;
            const pointsAtLevel = Math.floor(20 - level);

            for (let i = 0; i < pointsAtLevel; i++) {
                const x = centerX + (Math.random() - 0.5) * width;
                this.treePoints.push({ x, y });
            }
        }

        // 树干
        for (let i = 0; i < 15; i++) {
            this.treePoints.push({
                x: centerX + (Math.random() - 0.5) * 30,
                y: baseY + Math.random() * 50
            });
        }

        // 星星顶部
        this.treePoints.push({ x: centerX, y: baseY - height - 20 });
    }

    generateHeartPoints() {
        this.heartPoints = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 8;

        // 心形参数方程
        for (let t = 0; t < Math.PI * 2; t += 0.1) {
            const x = centerX + scale * 16 * Math.pow(Math.sin(t), 3);
            const y = centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            this.heartPoints.push({ x, y });
        }

        // 填充内部
        for (let i = 0; i < 100; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.8 + 0.2;
            const x = centerX + r * scale * 16 * Math.pow(Math.sin(t), 3);
            const y = centerY - r * scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            this.heartPoints.push({ x, y });
        }
    }

    setTarget(state) {
        this.state = state;
        let points;

        switch (state) {
            case 'tree':
                points = this.treePoints;
                break;
            case 'heart':
                points = this.heartPoints;
                break;
            default:
                // 散开状态，随机分布
                this.particles.forEach(p => {
                    p.targetX = Math.random() * this.canvas.width;
                    p.targetY = Math.random() * this.canvas.height;
                });
                return;
        }

        // 分配目标点给粒子
        this.particles.forEach((p, i) => {
            const target = points[i % points.length];
            p.targetX = target.x;
            p.targetY = target.y;
        });
    }

    update() {
        const easing = 0.05;
        const friction = 0.98;

        this.particles.forEach(p => {
            // 向目标移动
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;

            p.vx += dx * easing;
            p.vy += dy * easing;

            // 应用摩擦力
            p.vx *= friction;
            p.vy *= friction;

            // 更新位置
            p.x += p.vx;
            p.y += p.vy;

            // 散开状态下添加随机运动
            if (this.state === 'disperse') {
                p.vx += (Math.random() - 0.5) * 0.5;
                p.vy += (Math.random() - 0.5) * 0.5;

                // 边界反弹
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                p.x = Math.max(0, Math.min(this.canvas.width, p.x));
                p.y = Math.max(0, Math.min(this.canvas.height, p.y));
            }

            // 旋转效果
            p.angle += 0.02;
        });
    }

    draw() {
        // 清除画布，带半透明效果产生拖尾
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制粒子
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);

            // 绘制发光粒子
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');

            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // 中心亮点
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();

            this.ctx.restore();
        });

        // 添加装饰效果（圣诞树模式）
        if (this.state === 'tree') {
            this.drawStarTop();
        }
    }

    drawStarTop() {
        const centerX = this.canvas.width / 2;
        const y = this.canvas.height - 530;

        this.ctx.save();
        this.ctx.translate(centerX, y);

        // 绘制五角星
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();

        // 发光效果
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();

        this.ctx.restore();
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// 导出给主脚本使用
window.ChristmasTree = ChristmasTree;
