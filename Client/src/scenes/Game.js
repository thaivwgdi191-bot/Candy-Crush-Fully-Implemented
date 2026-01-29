import Board from "../board/Board.js";

export default class Game extends Phaser.Scene 
{
    constructor() 
    {
        super("Game");
    }

    create(data = {}) 
    {
        const { width, height } = this.scale;

        this.hintTimer = this.time.addEvent(
        {
            delay: 8000, // Wait 5 seconds to start
            callback: () => this.showHint(),
            callbackScope: this,
            loop: true, // Keep looping
            paused: false
        });

        if (data && data.resume && data.savedData) 
        {
            const s = data.savedData;
            this.scoreValue = s.score || 0;
            this.coins = s.coins || 0;
            this.movesValue = s.moves || 15;
            this.skillCounts = s.skillCounts;
        } 
        else 
        {
            this.scoreValue = 0;
            this.movesValue = 15;
            this.coins = 1000;
            this.skillCounts = { lolipop: 5, ufo: 2, switch: 3 };
        }
        this.skillDockContainer = null;

        let bg = this.add.image(width / 2, height / 2, 'bg');
        
        let scaleX = width / bg.width;
        let scaleY = height / bg.height;
        let baseScale = Math.max(scaleX, scaleY);
        bg.setScale(baseScale);
        const tileSize = Math.floor((width * 0.85) / 9); 
        const boardSize = tileSize * 9;

        this.layout = {
            headerHeight: height * 0.12,
            footerHeight: height * 0.10,
            margin: width * 0.05, // 5% margin
            tileSize: Math.floor((width * 0.9) / 9),
            tileSize,
            offsetX: (width - tileSize * 9) / 2,
            offsetY: (height * 0.2) + ( (height * 0.6 - tileSize * 9) / 2 )
        };

        this.drawGameHeader();
   

                const scoreStyle = { 
            fontFamily: 'Arial Black', 
            fontSize: '50px', 
            fill: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, stroke: true, fill: true }
        };

        const movesStyle = { 
            fontFamily: 'Arial Black', 
            fontSize: '50px', 
            fill: '#33691e',
            shadow: { offsetX: 1, offsetY: 1, color: '#fff', blur: 2, fill: true }
        };

        const headerHeight = height * 0.12;
        const verticalCenter = (height * 0.008) + (headerHeight / 2); 

        const scoreCenterX = width * 0.275;

        this.scoreText = this.add.text(scoreCenterX, verticalCenter, this.scoreValue.toString(), scoreStyle).setOrigin(0.5);

        const movesCenterX = width * 0.83;
        this.movesText = this.add.text(movesCenterX, verticalCenter, this.movesValue.toString(), movesStyle).setOrigin(0.5);

        this.skillIcons = ['lolipop', 'ufo', 'switch'];

        this.drawBoardBackground(boardSize);
        this.drawSkillContainer();
        
        this.board = new Board(this);
        if (data && data.resume && data.savedData)
            this.board.create(data.savedData.boardLayout);
        else
            this.board.create();

        this.input.on("gameobjectdown", (pointer, gameObject) => 
        {
            this.resetHintTimer();
            const candy = gameObject.getData("candy");
            if (!candy || !this.board.canMove)
                return;

            this.board.pick(candy);

            pointer.startX = pointer.x;
            pointer.startY = pointer.y;
            pointer.isSwiping = true;
        });

        this.input.on("pointerup", (pointer) => 
        {
            if (!pointer.isSwiping || !this.board.selected) return;
            const dx = pointer.x - pointer.startX;
            const dy = pointer.y - pointer.startY;
            const threshold = 40;

            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) 
            {
                const selected = this.board.selected;
                let targetRow = selected.row;
                let targetCol = selected.col;

                if (Math.abs(dx) > Math.abs(dy))
                    targetCol = dx > 0 ? selected.col + 1 : selected.col - 1;
                else
                    targetRow = dy > 0 ? selected.row + 1 : selected.row - 1;

                if (this.board.inBounds(targetRow, targetCol)) 
                {
                    const neighbor = this.board.getCandy(targetRow, targetCol);
                    if (neighbor)
                        this.board.pick(neighbor);
                }
            }
            pointer.isSwiping = false;
        });

        this.tweens.add(
        {
            targets: [this.scoreText, this.movesText],
            y: '+=2',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.createMenu();
    }
    
    resetHintTimer() 
    {
        this.hintTimer.reset(
        {
            delay: 8000, 
            callback: () => this.showHint(),
            callbackScope: this,
            loop: true
        });
    }

    stopHint() 
    {
        this.hintTimer.paused = true;
    }
    
    showHint() 
    {
        if (!this.board.canMove) return;

        const move = this.board.findPossibleMove();
        if (!move) 
            return;

        move.forEach(target => 
        {
            if (target && target.sprite) 
            {
                const sprite = target.sprite;
                this.tweens.killTweensOf(sprite);

                let glow;
                if (sprite.postFX) 
                {
                    glow = sprite.postFX.addGlow(0xffffff, 3, 0); 
                }

                this.tweens.add(
                {
                    targets: sprite,
                    scale: target.baseScale * 1.05,
                    y: sprite.y - 5,
                    duration: 500,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut',
                    onUpdate: (tween) => 
                    {
                        if (glow)
                            glow.outerStrength = tween.progress * 2;
                    },
                    onComplete: () => 
                    {
                        if (sprite) 
                        {
                            if (sprite.postFX && glow)
                                sprite.postFX.remove(glow);
                            sprite.setScale(target.baseScale);
                            this.resetHintTimer();
                        }
                    }
                });
            }
        });
    }

    addScore(amount) 
    {
        this.scoreValue = (this.scoreValue || 0) + amount;

        if (this.scoreText) 
        {
            this.scoreText.setText(this.scoreValue);
            this.tweens.add({
                targets: this.scoreText,
                scale: 1.2,
                duration: 100,
                yoyo: true
            });
        }
        this.saveGameState();
    }

    useMove() 
    {
        this.movesValue = (this.movesValue !== undefined ? this.movesValue : 15) - 1;
        
        if (this.movesText)
            this.movesText.setText(this.movesValue);

        this.saveGameState();
    }

    drawBoardBackground(boardSize) 
    {
        const { offsetX, offsetY, tileSize } = this.layout;
        const { width } = this.scale;
        
        // Dynamic padding (1.5% of screen width)
        const padding = width * 0.015; 
        const graphics = this.add.graphics();

        // 1. THE MAIN PLATE
        graphics.fillStyle(0x2e144b, 0.6); 
        graphics.fillRoundedRect(
            Math.floor(offsetX - padding), 
            Math.floor(offsetY - padding), 
            Math.floor(boardSize + (padding * 2)), 
            Math.floor(boardSize + (padding * 2)), 
            15 // Softer corners for high-res
        );

        // 2. THE GRID MESH (Lines)
        graphics.lineStyle(2, 0xffffff, 0.15);
        for (let i = 0; i <= 9; i++) {
            const posX = Math.floor(offsetX + (i * tileSize));
            graphics.moveTo(posX, offsetY);
            graphics.lineTo(posX, offsetY + boardSize);
            
            const posY = Math.floor(offsetY + (i * tileSize));
            graphics.moveTo(offsetX, posY);
            graphics.lineTo(offsetX + boardSize, posY);
        }
        graphics.strokePath();

        // 3. OUTER GLOW/BORDER
        graphics.lineStyle(4, 0xffffff, 0.2);
        graphics.strokeRoundedRect(
            Math.floor(offsetX - 2), 
            Math.floor(offsetY - 2), 
            Math.floor(boardSize + 4), 
            Math.floor(boardSize + 4), 
            8
        );
    }
    drawGameHeader()
    {
        const { width, height } = this.scale;
        const headerHeight = height * 0.12; 
        const graphics = this.add.graphics();

        // Main Plate (96% Width)
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillRoundedRect(width * 0.02, height * 0.01, width * 0.96, headerHeight, 25);
        graphics.fillStyle(0x8bc34a, 1); 
        graphics.fillRoundedRect(width * 0.02, height * 0.008, width * 0.96, headerHeight, 25);
        
        // Highlight
        graphics.lineStyle(4, 0xffffff, 0.4);
        graphics.strokeRoundedRect(width * 0.035, height * 0.015, width * 0.93, headerHeight * 0.9, 20);

        // Score Container (Left 40% of bar)
        const scoreWellWidth = width * 0.45;
        graphics.fillStyle(0x689f38, 1);
        graphics.fillRoundedRect(width * 0.05, height * 0.025, scoreWellWidth, headerHeight * 0.7, 15);

        // Moves Container (Right 30% of bar)
        const movesWellWidth = width * 0.3;
        graphics.fillStyle(0xDCEDC8, 1);
        graphics.fillRoundedRect(width - movesWellWidth - (width * 0.05), height * 0.025, movesWellWidth, headerHeight * 0.7, 15);

        // Moves Icon
        this.add.text(width - (movesWellWidth ), height * 0.026 + (headerHeight * 0.35), '⇄', { 
            fontSize: `${Math.floor(width * 0.06)}px`, fill: '#558b2f' 
        }).setOrigin(0.5);
    }

    drawSkillContainer() 
    {
        if (this.skillDockContainer) 
            this.skillDockContainer.destroy();
        this.skillDockContainer = this.add.container(0, 0);

        this.skillIcons = new Map();
        const { width, height } = this.scale;
        const graphics = this.add.graphics();
        this.skillDockContainer.add(graphics);

        const trayWidth = width * 0.95;
        const trayHeight = height * 0.1;
        const trayX = (width - trayWidth) / 2;
        const trayY = height - (height * 0.15); 

        const slotSize = Math.floor(trayHeight * 0.8);
        const spacing = (trayWidth - (slotSize * 4)) / 5;
        const items = ['setting_icon', 'lolipop', 'ufo', 'switch'];

        items.forEach((key, index) => 
        {
            const slotX = Math.floor(trayX + spacing + (index * (slotSize + spacing)));
            const slotY = Math.floor(trayY + (trayHeight - slotSize) / 2);
            const centerX = slotX + slotSize / 2;
            const centerY = slotY + slotSize / 2;

            if (key === 'setting_icon') 
            {
                const settingsBtn = this.add.container(centerX, centerY);

                const btnGraphics = this.add.graphics();

                // Shadow
                btnGraphics.fillStyle(0x000000, 0.2);
                btnGraphics.fillCircle(0, 3, slotSize / 2);
                
                // Red Circle
                btnGraphics.fillStyle(0xf44336, 1);
                btnGraphics.fillCircle(0, 0, slotSize / 2);
                
                // White Rim
                btnGraphics.lineStyle(4, 0xffffff, 0.8);
                btnGraphics.strokeCircle(0, 0, slotSize / 2);

                const settingsIcon = this.add.image(0, 0, key);
                settingsIcon.setDisplaySize(slotSize * 0.6, slotSize * 0.6);
                settingsBtn.add([btnGraphics, settingsIcon]);
                settingsBtn.setSize(slotSize, slotSize);
                settingsBtn.setInteractive({ useHandCursor: true });

                settingsBtn.on('pointerdown', (pointer, localX, localY, event) => 
                {
                    if (event) event.stopPropagation();

                    this.tweens.add(
                    {
                        targets: settingsBtn,
                        scale: 0.85,
                        duration: 80,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        onComplete: () => 
                        {
                            this.openSettings();
                        }
                    });
                });
                this.skillDockContainer.add(settingsBtn);
            }
            else 
            {
                graphics.fillStyle(0x4a7c2c, 1);
                graphics.fillRoundedRect(slotX, slotY, slotSize, slotSize, 15);

                graphics.lineStyle(3, 0xcde8b5, 1);
                graphics.strokeRoundedRect(slotX, slotY, slotSize, slotSize, 15);

                const img = this.add.image(centerX, centerY - 5, key);
                img.setDisplaySize(slotSize * 0.65, slotSize * 0.65);
                img.setInteractive().on('pointerdown', () => this.handleBoosterClick(key));
                this.drawPlusButton(slotX + slotSize - 5, slotY + 5, key);
                const txt = this.add.text(centerX, slotY + slotSize - 12, this.skillCounts[key], 
                {
                    fontFamily: 'Arial Black',
                    fontSize: `${Math.floor(slotSize * 0.2)}px`,
                    fill: '#ffeb3b',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);

                this.skillIcons.set(key, img);
                this.skillDockContainer.add([img, txt]);
            }
        });
    }

    drawPlusButton(x, y, skillKey) 
    {
        const plusContainer = this.add.container(x, y);
        
        const circle = this.add.graphics();
        circle.fillStyle(0xe91e63, 1).fillCircle(0, 0, 14);
        circle.lineStyle(2, 0xffffff, 1).strokeCircle(0, 0, 14);
        
        const plusSign = this.add.text(0, 0, '+', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#ffffff' }).setOrigin(0.5);

        plusContainer.add([circle, plusSign]);
        const hitArea = new Phaser.Geom.Circle(0, 0, 25); 
        plusContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

        plusContainer.on('pointerdown', (pointer, localX, localY, event) => 
        {
            event.stopPropagation();
            this.tweens.add(
            {
                targets: plusContainer,
                scale: 0.85,
                duration: 80,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
            this.openQuickBuy(plusContainer.x, plusContainer.y - 70, skillKey);
        });

        plusContainer.on('pointerup', () => plusContainer.setScale(1));
        plusContainer.on('pointerout', () => plusContainer.setScale(1));
        
        this.skillDockContainer.add(plusContainer);
    }

    openQuickBuy(x, y, skillKey) 
    {
        if (this.miniShop) 
            this.miniShop.destroy();

        const prices = { lolipop: 100, ufo: 250, switch: 150 };
        const cost = prices[skillKey] || 0;
        this.miniShop = this.add.container(x, y).setDepth(200);
        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 1);
        bubble.fillRoundedRect(-60, -80, 120, 90, 15);
        bubble.fillTriangle(0, 20, -10, 10, 10, 10);
        bubble.lineStyle(3, 0xe91e63, 1);
        bubble.strokeRoundedRect(-60, -80, 120, 90, 15);

        const priceText = this.add.text(0, -55, `$${cost}`, {fontFamily: 'Arial Black', fontSize: '20px', fill: '#333'}).setOrigin(0.5);

        const buyBtn = this.add.container(0, -20);
        const bBG = this.add.graphics().fillStyle(0x4caf50, 1).fillRoundedRect(-40, -15, 80, 30, 8);
        const bTxt = this.add.text(0, 0, 'BUY', {fontFamily: 'Arial Black', fontSize: '14px', fill: '#fff'}).setOrigin(0.5);
        
        buyBtn.add([bBG, bTxt]).setSize(80, 30).setInteractive().on('pointerdown', () => 
        {
            this.buySkill(skillKey);
            this.miniShop.destroy();
        });

        this.miniShop.add([bubble, priceText, buyBtn]);

        this.input.once('pointerdown', (pointer, localObjects) => 
        {
            if (!localObjects.includes(bBG))
                if (this.miniShop) 
                    this.miniShop.destroy();
        });

        this.miniShop.setScale(0);
        this.tweens.add({ targets: this.miniShop, scale: 1, duration: 200, ease: 'Back.easeOut' });
    }

    resetBoosterUI() 
    {
        this.skillIcons.forEach((icon) => 
        {
            icon.setAlpha(1);
            icon.clearTint();
        });
    }

    handleBoosterClick(boosterType) 
    {
        
        if (this.board.currBoost !== null) 
        {
            console.log("A skill is already active!");
            return; 
        }

        if (this.skillCounts[boosterType] > 0) 
        {
            this.skillCounts[boosterType] -= 1;
            this.drawSkillContainer();
            this.skillIcons.forEach((icon, key) => 
            {
                if (key === boosterType) 
                {
                    icon.setTint(0xffff00);
                    this.tweens.add(
                        {
                        targets: icon,
                        scale: icon.scale * 1.2,
                        duration: 200,
                        yoyo: true,
                        ease: 'Back.easeOut'
                    });
                } 
                else 
                    icon.setAlpha(0.4);
            });

            this.resetHintTimer();
            this.board.setSkill(boosterType);
            if (boosterType === 'ufo')
                this.board.useUFO();
            if (boosterType === 'lolipop')
                this.activateLollipop();
        } 
        else 
        {
            this.openSettings(); 
            this.openShop(true);
        }
    }

    

    createMenu() 
    {
        const { width, height } = this.scale;
        this.menuContainer = this.add.container(width / 2, height / 2).setDepth(100).setScale(0);

        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7).setInteractive();
        const menuBG = this.add.graphics();
        menuBG.fillStyle(0xffffff, 1).fillRoundedRect(-220, -300, 440, 600, 30);
        menuBG.lineStyle(6, 0x8bc34a, 1).strokeRoundedRect(-220, -300, 440, 600, 30);

        this.mainPanel = this.add.container(0, 0);
        const title = this.add.text(0, -220, 'PAUSED', { fontFamily: 'Arial Black', fontSize: '42px', fill: '#8bc34a' }).setOrigin(0.5);
        
        const resumeBtn = this.createMenuButton(0, -60, 'RESUME', 0x8bc34a, () => this.toggleMenu(false));
        const shopBtn = this.createMenuButton(0, 40, 'SHOP', 0xff9800, () => this.openShop(true));
        const homeBtn = this.createMenuButton(0, 140, 'HOME', 0xf44336, () => 
        {
            this.saveGameState(); // 1. WRITE TO DISK FIRST
            this.scene.start('Start'); // 2. THEN SWITCH SCENE
        });

        this.mainPanel.add([title, resumeBtn, shopBtn, homeBtn]);

        this.shopPanel = this.createShopPanel();
        this.shopPanel.setVisible(false);

        this.menuContainer.add([overlay, menuBG, this.mainPanel, this.shopPanel]);
    }

    toggleMenu(show) 
    {
        this.tweens.add(
        {
            targets: this.menuContainer,
            scale: show ? 1 : 0,
            alpha: show ? 1 : 0,
            duration: 400,
            ease: show ? 'Back.easeOut' : 'Back.easeIn',
            onStart: () => 
            {
                if (show) 
                    this.menuContainer.setVisible(true);
            },
            onComplete: () => 
            {
                if (!show) 
                    this.menuContainer.setVisible(false);
            }
        });
    }



    openShop(isOpen) 
    {
        this.mainPanel.setVisible(!isOpen);
        this.shopPanel.setVisible(isOpen);
        
        const target = isOpen ? this.shopPanel : this.mainPanel;
        target.setScale(0.8);
        this.tweens.add(
        {
            targets: target,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    buySkill(skillKey) 
    {
        const prices = { lolipop: 100, ufo: 250, switch: 150 };
        const cost = prices[skillKey];

        if (this.coins >= cost) 
        {
            this.coins -= cost;
            this.skillCounts[skillKey] += 1;
            this.updateCoinDisplay();
            this.drawSkillContainer();
        } 
        else 
        {
            this.coinText.setFill('#ff0000');
            this.time.delayedCall(500, () => this.coinText.setFill('#ffeb3b'));
            
            this.tweens.add(
            {
                targets: this.coinText,
                x: { from: 5, to: -5 },
                duration: 50,
                yoyo: true,
                repeat: 5
            });
        }
    }

    createShopPanel() 
    {
        const shopContainer = this.add.container(0, 0);
        const shopTitle = this.add.text(0, -245, 'SKILL SHOP', { fontFamily: 'Arial Black', fontSize: '38px', fill: '#ff9800' }).setOrigin(0.5);

        const coinBG = this.add.graphics();
        coinBG.fillStyle(0x000000, 0.3);
        coinBG.fillRoundedRect(-70, -210, 140, 40, 20);

        this.coinText = this.add.text(0, -190, `💰 ${this.coins}`, 
        { 
            fontFamily: 'Arial Black', fontSize: '24px', fill: '#ffeb3b' 
        }).setOrigin(0.5);

        const skills = 
        [
            { name: 'Lollipop', key: 'lolipop', cost: 100 },
            { name: 'UFO', key: 'ufo', cost: 250 },
            { name: 'Switch', key: 'switch', cost: 150 }
        ];

        skills.forEach((skill, i) => 
        {
            const yPos = -100 + (i * 110);
            
            // Skill Row Background
            const rowBG = this.add.graphics().fillStyle(0xf5f5f5, 1).fillRoundedRect(-180, yPos - 45, 360, 90, 15);
            
            // Icon
            const icon = this.add.image(-130, yPos, skill.key).setDisplaySize(60, 60);
            
            // Name and Cost
            const info = this.add.text(-80, yPos, `${skill.name}\n$${skill.cost}`, 
            { 
                fontFamily: 'Arial', fontSize: '18px', fill: '#333', fontStyle: 'bold' 
            }).setOrigin(0, 0.5);

            // Buy Button
            const buyBtn = this.add.container(110, yPos);
            const bBG = this.add.graphics().fillStyle(0x4caf50, 1).fillRoundedRect(-50, -25, 100, 50, 10);
            const bTxt = this.add.text(0, 0, 'BUY', { fontFamily: 'Arial Black', fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
            buyBtn.add([bBG, bTxt]).setSize(100, 50).setInteractive().on('pointerdown', () => this.buySkill(skill.key));

            shopContainer.add([rowBG, icon, info, buyBtn]);
        });

        const backBtn = this.createMenuButton(0, 230, 'BACK', 0x9e9e9e, () => 
        {
            this.toggleMenu(false);
            this.time.delayedCall(400, () => this.openShop(false));
        });        
        backBtn.setScale(0.7);
        shopContainer.add([shopTitle, backBtn]);
        shopContainer.add([shopTitle, coinBG, this.coinText]);
        return shopContainer;
    }
    createMenuButton(x, y, label, color, callback) 
    {
        const btnContainer = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-140, -35, 280, 70, 20);
        bg.lineStyle(3, 0xffffff, 0.5);
        bg.strokeRoundedRect(-140, -35, 280, 70, 20);

        const txt = this.add.text(0, 0, label, {
            fontFamily: 'Arial Black', fontSize: '24px', fill: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([bg, txt]);
        btnContainer.setSize(280, 70).setInteractive()
            .on('pointerdown', () => 
            {
                btnContainer.setScale(0.95);
            })
            .on('pointerup', () => 
            {
                btnContainer.setScale(1);
                callback();
            });

        return btnContainer;
    }

    updateCoinDisplay() 
    {
        if (this.coinText) 
        {
            this.coinText.setText(`💰 ${this.coins}`);
            
            this.tweens.add(
            {
                targets: this.coinText,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

        // Inside your Scene (Game.js)
    activateLollipop() 
    {
        this.board.setSkill('lolipop');
        this.input.setDefaultCursor('none');
        this.cursorIcon = this.add.image(this.input.x, this.input.y, 'lolipop');
        this.cursorIcon.setDepth(10000); // Ensure it's above everything
        this.cursorIcon.setScale(0.5);   // Adjust size as needed
    }
    
    update() {
        if (this.cursorIcon) {
            this.cursorIcon.x = this.input.x;
            this.cursorIcon.y = this.input.y;
        }
    }
    
    resetCustomCursor() {
        this.input.setDefaultCursor('default');
        if (this.cursorIcon) {
            this.cursorIcon.destroy();
            this.cursorIcon = null;
        }
    }

    openSettings() 
    {
        this.toggleMenu(true);
    }

    saveGameState() {
    // Safety check: Don't save if the board isn't fully built yet
    if (!this.board || !this.board.grid || this.board.grid.length === 0) {
        console.warn("Save aborted: Board not ready.");
        return;
    }

    const state = {
        score: this.scoreValue,
        coins: this.coins,
        moves: this.movesValue,
        skillCounts: this.skillCounts,
        boardLayout: this.board.getBoardState(),
        gameInProgress: true
    };

    console.log("Saving Game State...", state);
    localStorage.setItem('sweet_match_save', JSON.stringify(state));
}
}




