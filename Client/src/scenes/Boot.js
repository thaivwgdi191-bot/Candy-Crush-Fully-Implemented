// Boot.js
export class Boot extends Phaser.Scene 
{
    constructor() {
        super('Boot');
    }

    preload() 
    {
        // Load the background first
        this.load.image('bgload', './picture/3706928.png');
    }

    create() {
        this.scene.start('Preloader');
    }
}