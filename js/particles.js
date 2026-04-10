/**
 * 粒子特效 - 爱心粒子飘落效果
 */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.hearts = [];
        this.stars = [];
        this.animationId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // 创建爱心粒子
        for (let i = 0; i < 30; i++) {
            this.hearts.push(this.createHeart());
        }

        // 创建星星
        for (let i = 0; i < 50; i++) {
            this.stars.push(this.createStar());
        }

        this.animate();
    }

    createHeart() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height - this.canvas.height,
            size: Math.random() * 20 + 10,
            speedY: Math.random() * 1 + 0.5,
            speedX: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.5 + 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            color: this.getRandomPink()
        };
    }

    createStar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            twinklePhase: Math.random() * Math.PI * 2
        };
    }

    getRandomPink() {
        const pinks = [
            '#FF69B4',  // 热粉红
            '#FFB6C1',  // 浅粉红
            '#FFC0CB',  // 粉红
            '#FF1493',  // 深粉红
            '#FFA0B0'   // 柔和粉
        ];
        return pinks[Math.floor(Math.random() * pinks.length)];
    }

    drawHeart(x, y, size, color, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.beginPath();

        // 绘制爱心形状
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(0, topCurveHeight);

        // 左半边
        this.ctx.bezierCurveTo(
            0, -topCurveHeight,
            -size, -topCurveHeight,
            -size, topCurveHeight
        );
        this.ctx.bezierCurveTo(
            -size, size * 0.6,
            0, size,
            0, size * 1.2
        );
        this.ctx.bezierCurveTo(
            0, size,
            size, size * 0.6,
            size, topCurveHeight
        );
        this.ctx.bezierCurveTo(
            size, -topCurveHeight,
            0, -topCurveHeight,
            0, topCurveHeight
        );

        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawStar(x, y, size, opacity) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
        this.ctx.fill();

        // 添加光芒效果
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
        this.ctx.fill();
    }

    update() {
        // 更新爱心
        this.hearts.forEach((heart, index) => {
            heart.y += heart.speedY;
            heart.x += heart.speedX;
            heart.rotation += heart.rotationSpeed;

            // 重置超出屏幕的爱心
            if (heart.y > this.canvas.height + 50) {
                this.hearts[index] = this.createHeart();
                this.hearts[index].y = -50;
            }
        });

        // 更新星星闪烁
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            star.opacity = 0.3 + Math.abs(Math.sin(star.twinklePhase)) * 0.7;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制星星
        this.stars.forEach(star => {
            this.drawStar(star.x, star.y, star.size, star.opacity);
        });

        // 绘制爱心
        this.hearts.forEach(heart => {
            this.ctx.globalAlpha = heart.opacity;
            this.drawHeart(heart.x, heart.y, heart.size, heart.color, heart.rotation);
        });

        this.ctx.globalAlpha = 1;
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
window.ParticleSystem = ParticleSystem;
