import {COLOR_KEYS, CANDY_ADJUSTMENTS} from "../utils/Constants.js";

export default class Candy 
{
    constructor(scene, row, col, type, special, isImaginary = false) 
    {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.type = type;
        this.special = special;
        this.isProcessing = false;
        const { tileSize, offsetX, offsetY } = scene.layout;
        const baseAdjustment = CANDY_ADJUSTMENTS[COLOR_KEYS[this.type]] || 1.0;
        this.tileSize = tileSize;

        const frame = scene.textures.getFrame(this.getTexture());
        const width = frame.sourceSize ? frame.sourceSize.w : frame.width;
        const height = frame.sourceSize ? frame.sourceSize.h : frame.height;
        const scaleFactor = tileSize * 0.85 / Math.max(width, height) * baseAdjustment;

        const visualRow = isImaginary ? row - 9 : row; 

        this.sprite = scene.add.image(
            offsetX + col * tileSize + tileSize / 2,
            offsetY + visualRow * tileSize + tileSize / 2,
            this.getTexture()
        )
        .setScale(scaleFactor)
        .setInteractive()
        .setVisible(!isImaginary);

        this.baseScale = this.sprite.scale;


        this.sprite.setData("candy", this);

    }

    move() {
        const { tileSize, offsetX, offsetY } = this.scene.layout;
        const targetY = offsetY + this.row * tileSize + tileSize / 2;

        this.scene.tweens.add({
            targets: this.sprite,
            x: offsetX + this.col * tileSize + tileSize / 2,
            y: targetY,
            duration: 400, 
            ease: 'Bounce.easeOut',
            onUpdate: () => {
                if (!this.sprite.visible && this.sprite.y >= offsetY) {
                    this.sprite.setVisible(true);
                }
            }
        });
    }

basicmove()
{
    const { tileSize, offsetX, offsetY } = this.scene.layout;

    const targetY = offsetY + this.row * tileSize + tileSize / 2;

    this.scene.tweens.add({
        targets: this.sprite,
        x: offsetX + this.col * tileSize + tileSize / 2,
        y: targetY,
        duration: 200,
        onUpdate: () => 
        {
            if (!this.sprite.visible && this.sprite.y >= offsetY)
                this.sprite.setVisible(true);
        }
    });
}


    destroy() 
    {
        this.scene.tweens.add(
        {
            targets: this.sprite,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => this.sprite.destroy()
        });
    }

    static sameColor(a, b)
    {
        if (!a || !b)
            return false;
        if (a.type === b.type)
            return true;
        return false
    }

    getTexture() 
    {
        if (this.special === "striped-horizontal") 
            return `${COLOR_KEYS[this.type]}-Striped-Horizontal`;
        if (this.special === "striped-vertical") 
            return `${COLOR_KEYS[this.type]}-Striped-Vertical`;
        if (this.special === "wrapped")
            return `${COLOR_KEYS[this.type]}-Wrapped`;
        if (this.special === "choco")
            return `Choco`;

        return COLOR_KEYS[this.type];
    }

    refresh() 
    {
        const texture = this.getTexture();
        this.sprite.setTexture(texture);
        const frame = this.scene.textures.getFrame(texture);
        const baseAdjustment = CANDY_ADJUSTMENTS[texture] || 1.0;
        const width = frame.sourceSize ? frame.sourceSize.w : frame.width;
        const height = frame.sourceSize ? frame.sourceSize.h : frame.height;
        const scaleFactor = this.tileSize * 0.85 / Math.max(width, height) * baseAdjustment;
        this.sprite.setScale(scaleFactor);
        this.baseScale = this.sprite.scale;
    }
    getCenterX() {
    const { tileSize, offsetX } = this.scene.layout;
    return offsetX + this.col * tileSize + tileSize / 2;
}

// Gets the Y pixel coordinate based on a specific row
getCenterY(targetRow = this.row) {
    const { tileSize, offsetY } = this.scene.layout;
    return offsetY + targetRow * tileSize + tileSize / 2;
}
}
