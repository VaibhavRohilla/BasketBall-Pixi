import { Resource, Sprite, Texture } from "pixi.js";
import { TextLabel } from "./TextLabel";


export class Button extends Sprite
{
    buttonLabel : TextLabel;


    constructor(texture : Texture<Resource> | undefined, text : string, position : {x:number, y:number}, color : number = 0xffffff)
    {
        super(texture);

        this.interactive = true;
        this.anchor.set(0.5);
        this.tint = color;
        this.buttonLabel = new TextLabel(0, 0, 0.5, text, 42, color);
        this.x = position.x;
        this.y = position.y;
        this.addChild(this.buttonLabel);
    }

    setActive(active : boolean)
    {
       this.renderable = active;
       this.interactive = active;
    }
}