export class Start extends Phaser.Scene 
{
    constructor() 
    {
        super('Start');
    }

    create() 
    {
        const { width, height } = this.scale;
        this.add.image(width / 2, height / 2, 'bgload').setDisplaySize(width, height);
        const savedDataString = localStorage.getItem('sweet_match_save');
        const savedData = savedDataString ? JSON.parse(savedDataString) : null;
        if (savedData && savedData.gameInProgress) 
        {
            this.createStartButton(width / 2, height * 0.6, 'CONTINUE', 0x8bc34a, () => 
            {
                this.startGame({ resume: true, savedData: savedData });
            });

            this.createStartButton(width / 2, height * 0.75, 'NEW GAME', 0xff9800, () => 
            {
                localStorage.removeItem('sweet_match_save');
                this.startGame({ resume: false });
            });
        } 
        else 
        {
            this.createStartButton(width / 2, height * 0.7, 'PLAY', 0x8bc34a, () => 
            {
                this.startGame({ resume: false });
            });
        }
    }
    
createStartButton(x, y, label, color, callback) {
    const key = `deluxe_btn_${label.replace(/\s+/g, '')}`;
    const width = 320;
    const height = 100;

    if (!this.textures.exists(key)) {
        const canvas = this.textures.createCanvas(key, width, height);
        const ctx = canvas.context;

        // --- 1. THE 3D BASE (Darker "Lip") ---
        ctx.fillStyle = Phaser.Display.Color.IntegerToColor(color).darken(30).rgba;
        this.drawRoundedRect(ctx, 0, 5, width, height - 5, height / 2);
        ctx.fill();

        // --- 2. THE MAIN GRADIENT BODY ---
        const mainGrad = ctx.createLinearGradient(0, 0, 0, height - 10);
        mainGrad.addColorStop(0, Phaser.Display.Color.IntegerToColor(color).brighten(20).rgba);
        mainGrad.addColorStop(1, Phaser.Display.Color.IntegerToColor(color).rgba);
        
        ctx.fillStyle = mainGrad;
        this.drawRoundedRect(ctx, 0, 0, width, height - 10, (height - 10) / 2);
        ctx.fill();

        // --- 3. THE "GEL" HIGHLIGHT (Top Inner Shine) ---
        const shineGrad = ctx.createLinearGradient(0, 5, 0, height / 2);
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = shineGrad;
        this.drawRoundedRect(ctx, 15, 5, width - 30, height / 3, 20);
        ctx.fill();

        canvas.refresh();
    }

    const container = this.add.container(x, y);
    const btnImg = this.add.image(0, 0, key);

    // --- 4. THE LUXURY TEXT ---
    const text = this.add.text(0, -5, label, {
        fontFamily: 'CandyFont',
        fontSize: '44px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4, // Thicker stroke for that "pop"
        shadow: { offsetX: 0, offsetY: 4, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    }).setOrigin(0.5);

    container.add([btnImg, text]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });

    this.tweens.add({
        targets: container,
        y: y - 10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    // Interaction Tween
    container.on('pointerdown', () => {
        this.tweens.add({
            targets: container,
            scale: 0.94,
            y: y + 4, // Button physically "depresses" downward
            duration: 80,
            yoyo: true
        });
        callback();
    });

    return container;
}

// Helper for the canvas drawing
drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

    startGame(data) 
    {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => 
        {
            this.scene.start('Game', data);
        });
    }
}