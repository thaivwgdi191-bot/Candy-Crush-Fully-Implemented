export class Preloader extends Phaser.Scene
{
    constructor() 
    {
        super('Preloader');
    }

    init() 
    {
        const { width, height } = this.cameras.main;
        
        this.add.image(width / 2, height / 2, 'bgload').setDisplaySize(width, height);

        const barWidth = 300;
        const barHeight = 20;
        const posX = width / 2;
        const posY = height * 0.85; 

        this.add.rectangle(posX, posY, barWidth, barHeight).setStrokeStyle(2, 0xffffff);
        
        this.bar = this.add.rectangle(posX - (barWidth / 2) + 2, posY, 4, barHeight - 4, 0xffffff);

        this.load.on('progress', (p) => 
        {
            this.bar.width = 4 + (barWidth - 8) * p;
        });
    }

    preload() 
    {
        this.load.setPath('/picture');

        // Backgrounds
        this.load.image('setting_icon', 'setting.png')
        this.load.image('bg', 'heheh.png');
        this.load.image('bgload', '3706928.png');
        this.load.image('blank', 'blank.png');
        this.load.image('flare', 'star.png');
        this.load.image('flare2', 'blue-star.png');

        //Font
        this.add.text(-100, -100, "loading", { fontFamily: 'CandyFont' });

        // ===== NORMAL CANDIES =====
        this.load.image('Blue', 'Blue.png');
        this.load.image('Green', 'Green.png');
        this.load.image('Orange', 'Orange.png');
        this.load.image('Purple', 'Purple.png');
        this.load.image('Red', 'Red.png');
        this.load.image('Yellow', 'Yellow.png');
        this.load.image('Choco', 'Choco.png');

        // ===== Striped CANDIES =====
        // Blue
        this.load.image('Blue-Striped-Horizontal', 'Blue-Striped-Horizontal.png');
        this.load.image('Blue-Striped-Vertical', 'Blue-Striped-Vertical.png');

        // Green
        this.load.image('Green-Striped-Horizontal', 'Green-Striped-Horizontal.png');
        this.load.image('Green-Striped-Vertical', 'Green-Striped-Vertical.png');

        // Orange
        this.load.image('Orange-Striped-Horizontal', 'Orange-Striped-Horizontal.png');
        this.load.image('Orange-Striped-Vertical', 'Orange-Striped-Vertical.png');

        // Purple
        this.load.image('Purple-Striped-Horizontal', 'Purple-Striped-Horizontal.png');
        this.load.image('Purple-Striped-Vertical', 'Purple-Striped-Vertical.png');

        // Red
        this.load.image('Red-Striped-Horizontal', 'Red-Striped-Horizontal.png');
        this.load.image('Red-Striped-Vertical', 'Red-Striped-Vertical.png');

        // Yellow
        this.load.image('Yellow-Striped-Horizontal', 'Yellow-Striped-Horizontal.png');
        this.load.image('Yellow-Striped-Vertical', 'Yellow-Striped-Vertical.png');

        // ===== WRAPPED CANDIES =====
        this.load.image('Blue-Wrapped', 'Blue-Wrapped.png');
        this.load.image('Green-Wrapped', 'Green-Wrapped.png');
        this.load.image('Orange-Wrapped', 'Orange-Wrapped.png');
        this.load.image('Purple-Wrapped', 'Purple-Wrapped.png');
        this.load.image('Red-Wrapped', 'Red-Wrapped.png');
        this.load.image('Yellow-Wrapped', 'Yellow-Wrapped.png');

        // ===== BOOSTERS =====
        this.load.image('Boost-Blue-Fish', 'Boost-Blue-Fish.png');
        this.load.image('Boost-Green-Fish', 'Boost-Green-Fish.png');
        this.load.image('Boost-Orange-Fish', 'Boost-Orange-Fish.png');
        this.load.image('Boost-Purple-Fish', 'Boost-Purple-Fish.png');
        this.load.image('Boost-Red-Fish', 'Boost-Red-Fish.png');
        this.load.image('Boost-Yellow-Fish', 'Boost-Yellow-Fish.png');

        this.load.image('brush', 'Boost-Brush.png');
        this.load.image('coconutWheel', 'Boost-CoconutWheel.png');
        this.load.image('lolipop', 'Boost-Lolipop.png');
        this.load.image('switch', 'Boost-Switch.png');
        this.load.image('ufo-icon', 'Boost-Ufo.png');
        this.load.image('ufo', 'Ufo_icon.png');
    }


    create() 
    {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'bgload').setDisplaySize(width, height);
        
        // let scaleX = width / bg.width;
        // let scaleY = height / bg.height;
        // let baseScale = Math.max(scaleX, scaleY);
         
        this.time.delayedCall(300, () => 
        {
            this.scene.start("Start");
        });
    }
}
