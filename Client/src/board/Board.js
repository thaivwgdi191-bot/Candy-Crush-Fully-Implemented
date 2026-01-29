import Candy from "./Candy.js";
import Game from "../scenes/Game.js";
import { ROWS, COLS, TYPES, COLOR_KEYS } from "../utils/Constants.js";
import MatchFinder from "./MatchFinder.js";
import Gravity from "./Gravity.js";

export default class Board 
{
    constructor(scene) 
    {
        this.scene = scene;
        this.grid = [];
        this.imgGrid = [];
        this.score = 0;
        this.moves = 0;
        this.size = ROWS;
        this.candies = COLOR_KEYS.length - 1;
        this.selected = null;
        this.canMove = true;
        this.check = false;
        this.currBoost = null;
        this.boostLock = false;
        this.scene.resetBoosterUI();
        
    }

    
    create(savedLayout = null) 
    {
    
        for (let r = 0; r < ROWS; r++) 
        {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) 
            {
                if (savedLayout && savedLayout[r][c]) 
                {
                    const data = savedLayout[r][c];
                    this.grid[r][c] = new Candy(this.scene, r, c, data.type, data.special);
                } 
                else
                {
                    let type = Phaser.Math.Between(0, TYPES - 1);
                    this.grid[r][c] = new Candy(this.scene, r, c, type, null);
                }
                this.grid[r][c].check = false;
            }
        }

        for (let r = 0; r < ROWS; r++) 
        {
            this.imgGrid[r] = [];
            for (let c = 0; c < COLS; c++) 
            {
                let type = Phaser.Math.Between(0, TYPES - 1);
                this.imgGrid[r][c] = new Candy(this.scene, r, c, type, null, true);
            }
        }

        if (!savedLayout)
            this.resolve();
    }

    findPossibleMove() 
    {
        for (let r = 0; r < this.size; r++) 
        {
            for (let c = 0; c < this.size; c++) 
            {
                let a = this.grid[r][c];
                if (!a) 
                    continue;

                let directions = [[0, 1], [1, 0]]; 

                for (let [dr, dc] of directions) 
                {
                    let nr = r + dr;
                    let nc = c + dc;

                    if (this.inBounds(nr, nc)) 
                    {
                        let b = this.grid[nr][nc];
                        if (!b) continue;

                        this.swapGrid(a, b);
                        this.grid.forEach(row => row.forEach(c => {if(c) c.check = false}));
                        const matches = MatchFinder.check(this.grid, this.size, nr, nc, [a, b]);
                        this.swapGrid(a, b);
                        if (matches && matches.size >= 3) 
                        {
                            this.grid.forEach(row => row.forEach(c => {if(c) c.check = false}));
                            return matches; 
                        }
                    }
                }
            }
        }
        return null;
    }

    updateScore(amount) 
    {
        this.scene.addScore(amount);
    }

    updateMoves() 
    {
        this.scene.useMove();
    }

    pick(candy) 
    {
        if (!candy || !candy.sprite) 
            return;

        if (!this.canMove) 
            return;

        if (this.currBoost === 'lolipop') 
        {
            this.useLollipop(candy);
            return;
        }

        if (this.selected === candy) 
        {
            candy.sprite.setScale(candy.baseScale);
            this.selected = null;
            return;
        }

        if (this.selected == null) 
        {
            this.selected = candy;
            candy.sprite.setScale(candy.baseScale * 1.1);
        } 
        else 
        {
            this.selected.sprite.setScale(this.selected.baseScale);
            if (this.isNeighbor(this.selected, candy)) 
                this.swap(this.selected, candy);
            this.selected = null;
        }
    }

    isNeighbor(a, b) 
    {
        let r = a.row;
        let c = a.col;

        let r2 = b.row;
        let c2 = b.col;

        let moveLeft = c2 === c - 1 && r === r2;
        let moveRight = c2 === c + 1 && r === r2;

        let moveUp = r2 === r - 1 && c === c2;
        let moveDown = r2 === r + 1 && c === c2;

        return moveLeft || moveRight || moveUp || moveDown;
    }

    fillGapsFromImaginary(grid = this.grid, imgGrid = this.imgGrid, rows = 9, cols = 9) 
    {
        let totalMoved = 0;

        for (let c = 0; c < cols; c++) 
        {
            let emptyRow = rows - 1;
            for (let r = rows - 1; r >= 0; r--) 
            {
                if (grid[r][c] !== null) 
                {
                    if (r !== emptyRow) 
                    {
                        this.moveCandy(grid[r][c], grid, emptyRow, c);
                        grid[r][c] = null;
                        totalMoved++;
                    }
                    emptyRow--;
                }
            }

            for (let imgR = rows - 1; imgR >= 0; imgR--) 
            {
                if (emptyRow < 0) 
                    break;

                if (imgGrid[imgR][c] !== null) 
                {
                    let candy = imgGrid[imgR][c];
                    
                    grid[emptyRow][c] = candy;
                    imgGrid[imgR][c] = null;

                    candy.row = emptyRow; 
                    candy.move(); 
                    
                    emptyRow--;
                    totalMoved++;
                }
            }

            for (let r = rows - 1; r >= 0; r--) 
            {
                if (imgGrid[r][c] === null) 
                {
                    let type = Phaser.Math.Between(0, TYPES - 1);
                    imgGrid[r][c] = new Candy(this.scene, r, c, type, null, true);
                }
            }
        }
        return totalMoved;
    }

    moveCandy(candy, targetGrid, newRow, newCol) 
    {
        targetGrid[newRow][newCol] = candy;
        candy.row = newRow;
        candy.col = newCol;
        candy.move();
    }


    swap(a, b) 
    {
        if (this.currBoost == "switch")
        {
            this.useSwitch(a, b);
            return;
        }
        this.canMove = false;
        this.swapGrid(a, b);
        a.basicmove();
        b.basicmove();   
        if (this.resolveCombo(a, b))
        {
            return; 
        }     
        this.scene.time.delayedCall(250, () => 
        {
            const foundMatches = MatchFinder.find(this.grid, this.size, [a, b]);

            if (!foundMatches.size || foundMatches.size === 0) 
            {
                this.scene.tweens.add(
                {
                    targets: [a.sprite, b.sprite],
                    x: '+=5',
                    duration: 40,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => 
                    {
                        this.swapGrid(a, b);

                        a.basicmove();
                        b.basicmove();
                        
                        this.scene.time.delayedCall(250, () => { this.canMove = true })
                    }
                });
            } 
            else 
            {
                this.updateScore(foundMatches.size * 10);
                this.updateMoves();

                this.scene.resetHintTimer();

                foundMatches.forEach(candy => 
                {
                    if (candy && candy.sprite) 
                    {
                        this.scene.tweens.add(
                        {
                            targets: candy.sprite,
                            scale: 0,           // Shrink to nothing
                            alpha: 0,           // Fade out
                            angle: 90,          // Slight spin
                            duration: 200,
                            ease: 'Back.easeIn'
                        });
                    }
                });

                this.scene.time.delayedCall(250, () => 
                {
                    const time = this.fillGapsFromImaginary();
                    this.scene.time.delayedCall(300 + time, () => this.resolve());
                });
            }

            

        });
    } 

    swapGrid(a, b) 
    {
        [this.grid[a.row][a.col], this.grid[b.row][b.col]] = [this.grid[b.row][b.col], this.grid[a.row][a.col]];

        [a.row, b.row] = [b.row, a.row];
        [a.col, b.col] = [b.col, a.col];
    }

    getCandy(r, c) 
    {
        return this.grid[r][c];
    }

    inBounds(r, c)
    {
        return r >= 0 && c >= 0 && r < this.size && c < this.size;
    }

    resolve() 
    {
        if (MatchFinder.empty(this.grid, this.size))
        {
            const time = this.fillGapsFromImaginary();
            this.scene.resetHintTimer();
                    this.scene.time.delayedCall(300 + time, () => this.resolve());
        }
        const foundMatches = MatchFinder.find(this.grid, this.size);
        if (!foundMatches.size) 
        {
            this.canMove = true;
            return;
        }
        this.scene.resetHintTimer();
        this.updateScore(foundMatches.size * 10);
        this.canMove = false; 

        this.scene.time.delayedCall(250, () => 
        {
            const time = this.fillGapsFromImaginary();
                    this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }

    activateStriped(candy) 
    {
        if (!candy || candy.isProcessing) 
            return;
        candy.isProcessing = true;

        const size = this.size;
        const row = candy.row;
        const col = candy.col;

        if (candy.special === "striped-horizontal") 
        {
            for (let c = 0; c < size; c++) 
            {
                let target = this.grid[row][c];
                if (target && target !== candy) 
                    this.triggerSpecial(target);
                if (target) 
                {
                    this.grid[row][c] = null;
                    target.destroy();
                }
            }
        }
        else if (candy.special === "striped-vertical") 
        {
            for (let r = 0; r < size; r++) 
            {
                let target = this.grid[r][col];
                if (target && target !== candy) 
                    this.triggerSpecial(target);
                if (target) 
                {
                    this.grid[r][col] = null;
                    target.destroy();
                }
            }
        }
        this.updateScore(90);
    }

    triggerSpecial(target) 
    {
        if (target.special === "choco") 
            this.activateChoco(target, { type: target.type });
        else if (target.special === "wrapped") 
            this.activateWrapped(target);
        else if (target.special?.includes("striped")) 
            this.activateStriped(target);
    }

    activateWrapped(candy) 
    {
        if (!candy || candy.special !== "wrapped" || candy.isProcessing) 
            return;
        candy.isProcessing = true;

        const r = candy.row;
        const c = candy.col;

        this.grid[r][c] = null;
        candy.destroy();

        this.blueExplosion(candy.sprite.x, candy.sprite.y);
        this.scene.cameras.main.shake(100, 0.01);

        for (let row = Math.max(0, r - 1); row <= Math.min(this.size - 1, r + 1); row++) 
        {
            for (let col = Math.max(0, c - 1); col <= Math.min(this.size - 1, c + 1); col++) 
            {
                let target = this.grid[row][col];
                if (target) 
                {
                    this.triggerSpecial(target);
                    this.grid[row][col] = null;
                    target.destroy();
                }
            }
        }
        this.updateScore(90);
        this.scene.time.delayedCall(250, () => 
        {
            const time = this.fillGapsFromImaginary();
            this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }

    resolveCombo(a, b) 
    {
        const A = a.special;
        const B = b.special;

        console.log(A);
        console.log(B);

        let isCombo = true;

        if (A?.includes("striped") && B?.includes("striped"))
            this.comboStripStrip(a, b);

        else if (A === "wrapped" && B === "wrapped")
            this.comboWrappedWrapped(a, b);

        else if (((A === "striped-horizontal" || A === "striped-vertical") && B === "wrapped") || ((B === "striped-horizontal" || B === "striped-vertical") && A === "wrapped"))
            this.comboStripWrapped(a, b);

        else if (A === "choco" && B === "choco")
            this.comboChocoChoco();

        else if (A === "choco")
            this.activateChoco(a, b);

        else if (B === "choco")
            this.activateChoco(b, a);

        else
            isCombo = false;
        if (isCombo)
        {
            this.grid[a.row][a.col] = null;
            this.grid[b.row][b.col] = null;

            a.destroy();
            b.destroy();
            const foundMatches = MatchFinder.find(this.grid, this.size);
            if (!foundMatches.size) 
            {
                this.canMove = true;
                return;
            }
            this.canMove = false; 

            this.scene.time.delayedCall(250, () => 
            {
               const time = this.fillGapsFromImaginary();
                    this.scene.time.delayedCall(300 + time, () => this.resolve());
            });
        }
        return isCombo;
    }

    comboStripStrip(a, b) 
    {
        this.activateStriped(a);
        this.activateStriped(b);
        this.scene.time.delayedCall(250, () => 
        {
            const time = this.fillGapsFromImaginary();
            this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }

    comboWrappedWrapped(a, b) 
    {
        const r = b.row;
        const c = b.col;
        const size = this.size;
        const toDestroy = new Set();

        for (let row = r - 2; row <= r + 2; row++) {
            for (let col = c - 2; col <= c + 2; col++) {
                if (this.inBounds(row, col)) {
                    MatchFinder.collectExplosion(this.grid[row][col], this.grid, size, toDestroy);
                }
            }
        }

        this.executeComboDestruction(toDestroy);
    }



    comboStripWrapped(a, b) 
    {
        const center = a.special === "wrapped" ? a : b;
        const r = center.row;
        const c = center.col;

        for (let i = -1; i <= 1; i++) 
        {
            // Clear 3 Horizontal Rows
            let targetRow = r + i;
            if (this.inBounds(targetRow, c))
                this.clearFullRow(targetRow);

            let targetCol = c + i;
            if (this.inBounds(r, targetCol))
                this.clearFullCol(targetCol);
        }

        this.scene.time.delayedCall(250, () => 
        {
            const time = this.fillGapsFromImaginary();
            this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }

    comboChocoChoco() 
    {
        const toDestroy = new Set();
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c]) {
                    toDestroy.add(this.grid[r][c]);
                }
            }
        }
        this.executeComboDestruction(toDestroy);
    }

    clearFullRow(row) 
    {
        for (let c = 0; c < this.size; c++) 
        {
            let candy = this.grid[row][c];
            if (candy) 
            {
                this.grid[row][c] = null;
                this.triggerSpecial(candy);
                candy.destroy();
            }
        }
    }

    clearFullCol(col) 
    {
        for (let r = 0; r < this.size; r++) 
        {
            let candy = this.grid[r][col];
            if (candy) {
                this.grid[r][col] = null;
                this.triggerSpecial(candy);
                candy.destroy();
            }
        }
    }

    executeComboDestruction(toDestroy) 
    {
        toDestroy.forEach(candy => 
        {
            if (this.grid[candy.row][candy.col]) 
            {
                this.grid[candy.row][candy.col] = null;
                candy.destroy();
            }
        });

        this.updateScore(toDestroy.size * 20);
        this.scene.time.delayedCall(250, () => 
        {
            const time = this.fillGapsFromImaginary();
            this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }

    activateChoco(candy, other) 
    {
        let targets = [];
        const targetType = other.type;
        const comboSkill = other.special || "normal";

        // 1. Find targets
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] && this.grid[i][j].type === targetType) {
                    targets.push(this.grid[i][j]);
                }
            }
        }

        targets.forEach((t, index) => 
        {
            const strikeDelay = index * 100; // Time between each lightning bolt
            const explosionDelay = strikeDelay + 500; // Time before it actually pops

            // PHASE 1: TRANSFORMATION (The Lightning Strike)
            this.scene.time.delayedCall(strikeDelay, () => {
                // Create a dedicated graphics object for THIS specific bolt
                this.createLightningBolt(candy.sprite, t.sprite);

                // Convert to special
                if (comboSkill !== "normal" && !t.special) {
                    t.special = comboSkill;
                    if (comboSkill === "striped") {
                        t.special = Math.random() > 0.5 ? "striped-v" : "striped-h";
                    }
                    t.refresh(); 
                }
            });

            // PHASE 2: DESTRUCTION (The Explosion)
            this.scene.time.delayedCall(explosionDelay, () => {
                let candyToDestroy = this.grid[t.row][t.col];
                if (candyToDestroy) {
                    this.grid[t.row][t.col] = null;
                    this.triggerSpecial(candyToDestroy);
                    candyToDestroy.destroy();
                }
            });
        });

        // 3. Destroy the Chocolate Candy itself
        this.scene.tweens.add({
            targets: candy.sprite,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.grid[candy.row][candy.col] = null;
                candy.destroy();
            }
        });

        // 4. Board Resolve timing
        const totalWait = (targets.length * 100) + 1000;
        this.scene.time.delayedCall(totalWait, () => {
            const time = this.fillGapsFromImaginary();
            this.scene.time.delayedCall(300 + time, () => this.resolve());
        });
    }
    createLightningBolt(startObj, endObj) 
    {
        // 1. Create the graphics object
        const bolt = this.scene.add.graphics();
        
        // 2. FORCE depth to be higher than anything else (adjust 1000 if needed)
        bolt.setDepth(2000); 

        const startX = startObj.x;
        const startY = startObj.y;
        const endX = endObj.x;
        const endY = endObj.y;

        // 3. Draw a thick outer glow (blue/cyan)
        bolt.lineStyle(6, 0x00ffff, 0.5);
        this.drawJaggedLine(bolt, startX, startY, endX, endY);

        // 4. Draw a sharp inner core (white)
        bolt.lineStyle(2, 0xffffff, 1);
        this.drawJaggedLine(bolt, startX, startY, endX, endY);

        // 5. Flicker effect and destroy
        this.scene.tweens.add({
            targets: bolt,
            alpha: { from: 1, to: 0 },
            duration: 300,
            onComplete: () => bolt.destroy()
        });
    }

    drawJaggedLine(graphics, x1, y1, x2, y2) 
    {
        graphics.moveTo(x1, y1);
        
        const segments = 4;
        for (let i = 1; i < segments; i++) 
        {
            let t = i / segments;
            // Calculate point on line
            let px = x1 + (x2 - x1) * t;
            let py = y1 + (y2 - y1) * t;
            
            // Add random "jitter" to make it look like lightning
            px += (Math.random() * 30 - 15);
            py += (Math.random() * 30 - 15);
            
            graphics.lineTo(px, py);
        }
        graphics.lineTo(x2, y2);
        graphics.strokePath();
    }

    setSkill(Boost) 
    {
        this.currBoost = Boost;
        console.log("Board mode: " + Boost);
    }

    createExplosion(x, y) 
    {
        const particles = this.scene.add.particles(x, y, 'flare', 
        {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 0 },
            blendMode: 'ADD',
            lifespan: 600,
            gravityY: 300,
            quantity: 20,
            emitting: false
        });

        particles.explode();
        this.scene.time.delayedCall(1000, () => particles.destroy());
    }

    blueExplosion(x, y) 
    {
        const particles = this.scene.add.particles(x, y, 'flare2', 
        {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 600,
            gravityY: 300,
            quantity: 20,
            emitting: false
        });

        particles.explode();
        this.scene.time.delayedCall(1000, () => particles.destroy());
    }

    useLollipop(candy) 
    {
        if (!candy)
            return;
        
        this.createExplosion(candy.sprite.x, candy.sprite.y);
        this.scene.cameras.main.shake(100, 0.01);

        if (candy.special == "wrapped")
            this.activateWrapped(candy);
        else if (candy.special?.includes("striped")) 
            this.activateStriped(candy);
        else if (candy.special == "choco")
        {
            let target = null;
            while (1)
            {
                let r = Phaser.Math.Between(0, 8);
                let c = Phaser.Math.Between(0, 8);
                if (this.grid[r][c] && !this.grid[r][c].special)
                {
                    target = this.grid[r][c];
                    break;
                }
            }
            this.activateChoco(candy, target);
        }
        else
        {
            this.grid[candy.row][candy.col] = null;
            candy.destroy();
        }

        this.updateScore(50);
        this.currBoost = null;
        if (this.scene.resetCustomCursor) {
        this.scene.resetCustomCursor();
    }
    
    if (this.scene.resetBoosterUI)
        this.scene.resetBoosterUI();
        this.scene.time.delayedCall(250, () => 
            {
                this.resolve();
            });
    }

    useUFO() 
    {
        this.canMove = false;
        let targets = [];
        
        while(targets.length < 3) 
        {
            let r = Phaser.Math.Between(0, 8);
            let c = Phaser.Math.Between(0, 8);
            let candy = this.grid[r][c];
            if (candy && !targets.includes(candy) && !candy.special) 
                targets.push(candy);
        }
        
        const ufo = this.scene.add.image(this.scene.scale.width / 2, this.scene.scale.height - 100, 'ufo-icon');
        ufo.setDepth(2000).setScale(0.7);
        const beam = this.scene.add.graphics();
        beam.setDepth(1999);
        const beamUpdate = this.scene.events.on('update', () => {
        beam.clear();
        // Light yellow/white gradient effect
        beam.fillStyle(0xffffff, 0.15);
        beam.beginPath();
        beam.moveTo(ufo.x, ufo.y); // Top of beam at UFO center
        beam.lineTo(ufo.x - 40, ufo.y + 120); // Bottom left
        beam.lineTo(ufo.x + 40, ufo.y + 120); // Bottom right
        beam.closePath();
        beam.fillPath();
        beam.fillStyle(0xffffff, 0.3);
        beam.beginPath();
        beam.moveTo(ufo.x, ufo.y + 10);
        beam.lineTo(ufo.x - 20, ufo.y + 150);
        beam.lineTo(ufo.x + 20, ufo.y + 150);
        beam.closePath();
        beam.fillPath();
    });

        let chain = this.scene.tweens.chain(
        {
            targets: ufo,
            tweens: targets.map((target, index) => (
            {
                x: target.sprite.x,
                y: target.sprite.y - 20,
                duration: 600,
                ease: 'Back.easeOut',
                onComplete: () => 
                {
                    
                    this.scene.tweens.add(
                    {
                        targets: ufo,
                        scale: 0.85, // Grow slightly from 0.7
                        duration: 100,
                        yoyo: true,
                        scale: 1.3,
                        ease: 'Back.easeOut'
                    });
                    this.beamCandy(target);
                    if (index === targets.length - 1) 
                    {
                        this.scene.tweens.add(
                        {
                            targets: ufo,
                            y: -100,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => 
                            {
                                ufo.destroy();
                                beam.destroy();
                                this.finalizeUFO(targets);
                            }
                        });
                    }
                }
            }))
        });
    }

    beamCandy(target) 
    {
        this.scene.tweens.add(
        {
            targets: target.sprite,
            scale: target.baseScale * 1.4,
            duration: 200,
            yoyo: true,
            onStart: () => 
            {
                target.special = "wrapped";
                target.refresh();
            }
        });
    }

    finalizeUFO(targets) 
    {
        this.scene.time.delayedCall(400, () => 
        {
            targets.forEach((target, index) => 
            {
                this.scene.time.delayedCall(index * 250, () => this.activateWrapped(target));
            });

            if (this.scene.resetBoosterUI) 
                this.scene.resetBoosterUI();
            this.currBoost = null;
        });
    }
    
    useSwitch(candyA, candyB) 
    {
        this.canMove = false;

        this.swapGrid(candyA, candyB);
        candyA.basicmove();
        candyB.basicmove();

        this.currBoost = null;
        this.selected = null;
        this.canMove = true;

        if (this.scene.resetBoosterUI)
            this.scene.resetBoosterUI();

        this.scene.time.delayedCall(250, () => 
            {
                this.resolve();
            });
    }

    getBoardState() 
    {
        return this.grid.map((row, r) => row.map((candy, c) => 
        {
            if (!candy || !candy.sprite) return null; 
            
            return {
                type: candy.type,
                special: candy.special,
                row: r,
                col: c
            };
        }));
    }
}