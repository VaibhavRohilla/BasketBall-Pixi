import { Tween } from "@tweenjs/tween.js";
import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";



export class GameRestartPopup extends Container
{


    timer : {timeLeft : number, totalTime : number};
    spinnerUpdate! : (per : number) => void;
    continueTimer: Sprite;
    timerTween: Tween<{ timeLeft: number; totalTime: number; }>;

    constructor(timeLeft : number, onClickCallBack : any = undefined, onCompleteCallBack : any = undefined)
    {
        super();

        Globals.emitter?.Call("ad");
        this.timer = {timeLeft : timeLeft, totalTime : timeLeft};

        this.zIndex = 11;

        const darkBg = new Graphics();
        darkBg.beginFill(0x000000, 0.5);
        // darkBg.drawRect(0, 0,window.innerWidth*config.scaleFactor, window.innerHeight*config.scaleFactor);
        darkBg.drawRect(-4000, -500, 7000, 6000);
        darkBg.endFill();
        this.addChild(darkBg);


        const bgPanel  = new Sprite(Globals.resources.continueBG.texture);
        bgPanel.anchor.set(0.5);
        bgPanel.x = config.logicalWidth/2;
        bgPanel.y = config.logicalHeight/2;
        this.addChild(bgPanel);

        const textures : any = [
            Globals.resources.continueButton.texture,
            Globals.resources.continueButtonActive.texture,
            Globals.resources.continueButtonHover.texture
        ];

        const btnContinue = this.createButton(textures, config.logicalWidth/2, config.logicalHeight/2 + 300, onClickCallBack);

        const btnText = new TextLabel(btnContinue.x, btnContinue.y - 10, 0.5, "Watch AD", 66, 0x4f3438);
        this.addChild(btnText);


        const playTextures : any = [
            Globals.resources.continuePlayButton.texture,
            Globals.resources.continuePlayButtonActive.texture,
            Globals.resources.continuePlayButtonHover.texture
        ];

        this.createButton(playTextures, config.logicalWidth/2 + 20, config.logicalHeight/2, onClickCallBack);


        const continueText = new TextLabel(btnContinue.x, bgPanel.y - 310, 0.5, "Continue?", 70, 0x4f3438);
        this.addChild(continueText);


        this.continueTimer = new Sprite(Globals.resources.continueTimer.texture);
        this.continueTimer.anchor.set(0.5);
        this.continueTimer.x = config.logicalWidth/2;
        this.continueTimer.y = config.logicalHeight/2;
        this.addChild(this.continueTimer);


        this.generateSpinner3();


        this.timerTween = new Tween(this.timer).to({timeLeft : 0}, timeLeft * 1000)
        .onUpdate((valObj : {timeLeft : number, totalTime : number}) => {
            this.spinnerUpdate(valObj.timeLeft / valObj.totalTime);
        }).onComplete(() => {
            this.timerTween.stop();

            if(onCompleteCallBack)
            {
                onCompleteCallBack();
            }

            setTimeout(() => {
                this.destroy();
            }, 250);
        }).start();
    }




    createButton(textures : any[], x : number, y : number, clickOnCallback : any = undefined ) : AnimatedSprite
    {

        const btn = new AnimatedSprite(textures);
        btn.anchor.set(0.5);
        btn.x = x;
        btn.y = y;
        this.addChild(btn);

        btn.interactive = true;

        btn.on("pointerdown", () => {
            btn.gotoAndStop(1);
            this.timerTween.stop();

            if(clickOnCallback)
            {
                clickOnCallback();
            }

            setTimeout(() => {
                this.destroy();
            }, 250);
        });

        btn.on("pointerup", () => {
            btn.gotoAndStop(0);
        });

        btn.on("pointerover", () => {
            btn.gotoAndStop(2);
        });

        btn.on("pointerout", () => {
            btn.gotoAndStop(0);
        });

        return btn;
    }


    generateSpinner3()
    {

        const mask = new Graphics();
        mask.position.set(this.continueTimer.x, this.continueTimer.y);
        this.continueTimer.mask = mask;


        this.addChild(mask);
    
        this.spinnerUpdate =  (percentage : number) => {
            // Update phase
            const phase = percentage * (Math.PI * 2);
    
            const angleStart = 0 - Math.PI / 2;
            const angle = phase + angleStart;
            const radius = this.continueTimer.width/2;
    
            const x1 = Math.cos(angleStart) * radius;
            const y1 = Math.sin(angleStart) * radius;
    
            // Redraw mask
            mask.clear();
            mask.lineStyle(2, 0xff0000, 1);
            mask.beginFill(0xff0000, 1);
            mask.moveTo(0, 0);
            mask.lineTo(x1, y1);
            mask.arc(0, 0, radius, angleStart, angle, false);
            mask.lineTo(0, 0);
            mask.endFill();
        };
    };
}