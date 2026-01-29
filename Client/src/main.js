import Phaser from "phaser";
import { Boot } from "./scenes/Boot.js";
import { Preloader } from "./scenes/Preloaderr.js";
import { Start } from "./scenes/Start.js";
import Game from "./scenes/Game.js";

const config = 
{
  type: Phaser.AUTO,
  pixelArt: false,
    roundPixels: true,
  scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 720,
        height: 1280
    },
    render: {
      pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: true
},
   parent: "game-parent",
  scene: [Boot, Preloader, Start, Game]
};

new Phaser.Game(config);
