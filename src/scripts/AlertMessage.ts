import { Easing, Tween } from "@tweenjs/tween.js";
import { Container, Graphics, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { TextLabel } from "./TextLabel";




const randomPhrases = [
    "Try Again",
    "Again",
    "One more Time"
];

export class AlertMessage extends Container
{
    bg : Graphics;
    text : TextLabel;
    holderRef : AlertMessageHolder;
    constructor(index : number,parentRef : AlertMessageHolder, phrase : string | undefined = undefined)
    {
        super();

        this.holderRef = parentRef;
        
        // this.zIndex = 10;

        let dimensions = {width : config.logicalWidth * 0.8, height : 160};

        this.bg = new Graphics();
        this.bg.x = config.logicalWidth/2;
        this.bg.y = config.logicalHeight + dimensions.height * 2;
        this.addChild(this.bg);

        this.text = new TextLabel(0, 0, 0.5, '', 70, phrase ? 0xffffff : 0x000000);


        this.text.style.fontWeight = 'bolder'
        this.bg.addChild(this.text);

        if(phrase == undefined)
        {
           
            this.bg.beginFill(0xffffff, 1);
            this.bg.drawRoundedRect(-dimensions.width/2, -dimensions.height/2, dimensions.width, dimensions.height, 25);
            this.bg.endFill();

            
            phrase = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
        } else
        {
            this.text.style.dropShadow = true;
            this.text.style.dropShadowBlur = 3;
        }
        

        this.text.upadteLabelText(phrase);


        this.tweenUp(index);
    }

    tweenUp(i : number)
    {
        new Tween(this.bg)
        .to({x : config.logicalWidth/2, y : config.logicalHeight/2 + i * 200}, 500)
        .onComplete(() => {
            setTimeout(() => {
                this.holderRef.removeFromList(this);
            }, 500);
        })
        .easing(Easing.Quadratic.Out)
        .start();
    }


    
}


export class AlertMessageHolder extends Container
{
    messagesOnScreen : AlertMessage[] = [];
    constructor()
    {
        super();

    }

    removeFromList(aMsg : AlertMessage)
    {
        const index = this.messagesOnScreen.indexOf(aMsg);
        if(index >= 0)
        {
            this.messagesOnScreen.splice(index, 1);
            aMsg.destroy();
        }
    }

    addAlertMessage(phrase : string | undefined)
    {
        console.log(phrase);
        const alertMsg = new AlertMessage(this.messagesOnScreen.length,this, phrase);
        this.addChild(alertMsg);
        this.messagesOnScreen.push(alertMsg); 
    }
}