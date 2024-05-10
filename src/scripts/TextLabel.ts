import { Text } from "pixi.js";


export class TextLabel extends  Text
{


    constructor(x : number, y : number, anchor :number, textToShow :string ,size : number, public defaultColor :number =  0xff7f50, font : string = "FredokaOne") {
        super(textToShow);

        this.x = x;
        this.y = y;
        this.anchor.set(anchor);
        this.style = {
            fontFamily: font,
            fontSize: size,
            fill: [this.defaultColor]
        };
        
        this.text = textToShow;
    }

    upadteLabelText(text : string, color : number = this.defaultColor)
    {
        this.text = text;
        this.style.fill = [color];
    }
}