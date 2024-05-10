import { Easing, Tween } from "@tweenjs/tween.js";
import { AnimatedSprite, Container, FrameObject, Graphics, Resource, Texture } from "pixi.js";
import { config } from "./appConfig";
import { ScoreFunctions, getBallPowerUpInCookies, saveBallPowerUpInCookies, useBall } from "./DataHandler";
import { getPowerUpTimer, Globals, isAnyPotionActivated, isPowerUpActive } from "./Globals";
import { HGraphic, HGraphicType } from "./HGraphic";
import { Reward } from "./quest";
import { Rewards } from "./QuestsConfig";
import { TextLabel } from "./TextLabel";
import { log } from "console";
import { stringify } from "querystring";

export class PowerUpHolder extends Container {
	powerUps: PowerUp[] = [];

	widthOfChild: number = 0;

	isOpened: boolean = false;
	counterBG: HGraphic;
	counterLabel: TextLabel;
	timerBG: HGraphic;
	timerLabel: TextLabel;

	constructor(arrayOfPowerUps: PowerUp[], rightToLeft: boolean, x: number, y: number) {
		super();


		let startX = 0;

		this.x = x;
		this.y = y;

		this.widthOfChild = arrayOfPowerUps[0].width;
		let noOfPowerups = 0;
		for (let i = 0; i < arrayOfPowerUps.length; i++) {
			arrayOfPowerUps[i].x = startX;
			this.addChild(arrayOfPowerUps[i]);
			arrayOfPowerUps[i].setX(startX);
			this.powerUps.push(arrayOfPowerUps[i]);

			if (rightToLeft) startX -= this.widthOfChild * 1.1;
			else startX += this.widthOfChild * 1.1;

			arrayOfPowerUps[i].slideBack();
			noOfPowerups += arrayOfPowerUps[i].counter;
			// arrayOfPowerUps[i].addCounter();
		}

		this.zIndex = 10;

		this.interactive = true;

		this.on("pointerdown", () => {
			// console.log(this.isOpened, "Opening");

			if (this.isOpened || this.isSliding) return;

			this.isOpened = true;

			this.powerUps.forEach((pwrUps) => {
				pwrUps.slideOut();
			});


			this.counterBG.renderable = false;
		});


		this.counterBG = new HGraphic(HGraphicType.CIRCLE, 0x2c2c2c, { radius: 15 }, 0.8);
		this.counterBG.y = 60;
		this.counterLabel = new TextLabel(0, 0, 0.5, noOfPowerups.toString(), 12, 0xffffff);
		this.counterBG.addChild(this.counterLabel);

		this.addChild(this.counterBG);


		this.timerBG = new HGraphic(HGraphicType.CIRCLE, 0x2c2c2c, { radius: 15 }, 0.8);
		this.timerBG.y = -60;
		this.timerLabel = new TextLabel(0, 0, 0.5, "0", 12, 0xffffff);
		this.timerBG.addChild(this.timerLabel);

		this.addChild(this.timerBG);



		if (noOfPowerups == 0 && !this.isAnyActivated)
			this.renderable = false;

		this.scale.set(config.minScaleFactor * 2);

	}



	get currentCount(): number {
		let count = 0;

		for (let pName in this.powerUps) {
			count += this.powerUps[pName].counter;
		}

		return count;
	}

	get currentTimer(): number {
		let minTimer = -1;

		this.powerUps.forEach(powerUp => {
			if (isPowerUpActive(powerUp.powerUpID)) {
				// console.log(powerUp.powerUpID);
				const t = getPowerUpTimer(powerUp.powerUpID);

				if (t < minTimer || minTimer < 0) {
					minTimer = t;
				}
			}
		});



		return minTimer;
	}

	get isAnyActivated(): boolean {

		for (let i = 0; i < this.powerUps.length; i++) {
			if (isPowerUpActive(this.powerUps[i].powerUpID)) {
				return true;
			}
		}

		return false;
	}


	checkRenderable() {
		let counter = 0;


		for (let i = 0; i < this.powerUps.length; i++) {
			counter += this.powerUps[i].counter;
		}

		if (counter > 0) {
			this.renderable = true;
		} else {
			this.renderable = false;

		}
		this.counterLabel.upadteLabelText(this.currentCount.toString());
	}

	resize() {
		this.scale.set(config.minScaleFactor * 2);
	}

	updateTimer() {

		this.powerUps.forEach(powerUp => {
			powerUp.updateTimer();
		});

		const t = this.currentTimer;



		if (t < 0 || !this.counterBG.renderable)
			this.timerBG.renderable = false;
		else {
			// console.log(t);

			if (!this.timerBG.renderable)
				this.timerBG.renderable = true;


			this.timerLabel.upadteLabelText(t.toString());
		}

	}

	get isSliding() {
		for (let i = 0; i < this.powerUps.length; i++) {
			if (this.powerUps[i].isSliding) return true;
		}

		return false;
	}

	pointerGotDown() {
		if (!this.isOpened || this.isSliding) return;

		this.isOpened = false;
		this.powerUps.forEach((pwrUps) => {
			pwrUps.slideBack();
		});

		this.counterLabel.upadteLabelText(this.currentCount.toString());

		this.counterBG.renderable = true;


	}
	pointerDown() {
		this.counterLabel.upadteLabelText(this.currentCount.toString());
	}
}

export class PowerUp extends AnimatedSprite {
	isSliding: boolean = false;
	defaultX: number = 0;
	counterBG: HGraphic;
	counterLabel: TextLabel;
	counter: number = 0;
	defaultInteractivity: boolean = false;
	powerUpID: string;
	useCallback!: () => void;
	timerBG: HGraphic;
	timerLabel: TextLabel;

	constructor(textures: any[], idName: string) {
		super(textures);
		
		// console.log("Called Active Ball PowerUp");
		
		
		this.powerUpID = idName;
		this.anchor.set(0.5);
		this.gotoAndStop(0);
		// this.interactive = true;
		this.scale.set(0.4);
		
		const score = ScoreFunctions.getOtherScore(this.powerUpID);
		if (score) {
			this.counter = score;
		} else {
			ScoreFunctions.addOtherScore(this.powerUpID, 0);
			this.counter = 0;
		}
		
	
		// this.counter = 2;

		//Text
		this.counterBG = new HGraphic(HGraphicType.CIRCLE, 0x2c2c2c, { radius: 40 }, 0.8);
		this.counterBG.y = 140;
		this.counterLabel = new TextLabel(0, 0, 0.5, this.counter.toString(), 34, 0xffffff);
		this.counterBG.addChild(this.counterLabel);

		this.addChild(this.counterBG);


		this.timerBG = new HGraphic(HGraphicType.CIRCLE, 0x2c2c2c, { radius: 40 }, 0.8);
		this.timerBG.y = -150;
		this.timerLabel = new TextLabel(0, 0, 0.5, "0", 34, 0xffffff);
		this.timerBG.addChild(this.timerLabel);

		this.addChild(this.timerBG);

		this.timerBG.renderable = false;

		this.on("pointerdown", () => {
			this.usePowerUp();
			// console.log("CALLED");

		});
		this.on("pointerover", () => {
			if (this.currentFrame != 1) this.gotoAndStop(1);
		});

		this.on("pointerout", () => {
			if (this.currentFrame != 0) this.gotoAndStop(0);
		});


		const currentBall = getBallPowerUpInCookies();

		if (this.counter > 0 && currentBall)
			this.defaultInteractivity = true;
		else
			this.disablePowerUp();

			if(currentBall)
			{
				if(currentBall == this.powerUpID)
					{
						console.log("Called Active Ball PowerUp"+"   "+currentBall + "   " + this.powerUpID);
						this.usePowerUp();
					}
			}
		this.checkIfNeedToBeDeactivated();
	
	}

	addCounter(val: number = 1) {
		this.counter += val;

		if (ScoreFunctions.getOtherScore(this.powerUpID))
			ScoreFunctions.setOtherScore(this.powerUpID, this.counter);
		else
			ScoreFunctions.addOtherScore(this.powerUpID, this.counter);

		this.counterLabel.upadteLabelText(this.counter.toString());
		const currentBall = getBallPowerUpInCookies();
	
		if (!this.defaultInteractivity && this.counter > 0 && !currentBall) {
			this.disablePowerUp(false);

		}
	
		
		console.log(this.counter);

	}

	usePowerUp() {
		const currentBall = getBallPowerUpInCookies();

		if (this.counter <= 0 && !currentBall) return;

        console.log("Started PowerUP"+ this.powerUpID);
		

		this.interactive = false;

		if(!currentBall)
		this.counter--;

		if (ScoreFunctions.getOtherScore(this.powerUpID)) ScoreFunctions.setOtherScore(this.powerUpID, this.counter);
		else ScoreFunctions.addOtherScore(this.powerUpID, this.counter);
		this.counterLabel.upadteLabelText(this.counter.toString());

		this.playUseEffect();

		if (this.counter < 0 && !currentBall) {
			this.disablePowerUp();
		}

		if(currentBall)
		{
			this.disablePowerUp();
		}
		
	

		if(this.powerUpID == "bronzeBall" || "silverBall" || "goldenBall")
		{
          saveBallPowerUpInCookies(this.powerUpID);
		}
	
	}

	updateTimer() {

		if (!this.counterBG.renderable) {
			this.timerBG.renderable = false;
			return;
		}

		if (isPowerUpActive(this.powerUpID)) {

			if (!this.timerBG.renderable)
				this.timerBG.renderable = true;


			this.timerLabel.upadteLabelText(getPowerUpTimer(this.powerUpID).toString());

		} else if (this.timerBG.renderable) {
			this.timerBG.renderable = false;
		}
	}

	checkIfNeedToBeDeactivated() {

		const currentBall = getBallPowerUpInCookies();

		if (isPowerUpActive(this.powerUpID)) {
			if (this.defaultInteractivity)
				this.disablePowerUp();
		} else if (!this.defaultInteractivity && this.counter > 0 && !currentBall) {
			this.disablePowerUp(false);
			
		}
	}

	playUseEffect() {

		Globals.emitter?.Call("powerUpClicked", this.powerUpID);

		const useTween = new Tween(this.scale)
			.to({ x: 0.35, y: 0.35 }, 250)
			.onComplete(() => {
				Rewards[this.powerUpID]?.use();
			})
			.repeat(1)
			.yoyo(true)
			.start();
	}

	disablePowerUp(val: boolean = true) {

		
		this.defaultInteractivity = !val;
		this.alpha = val ? 0.5 : 1;
		
		if (this.interactive) this.interactive = this.defaultInteractivity;
	}

	setX(x: number) {
		this.defaultX = x;
	}

	slideBack() {
		if (this.isSliding) return;

		this.gotoAndStop(0);

		this.isSliding = true;

		this.counterBG.renderable = false;

		const tween = new Tween(this)
			.to({ x: 0 }, 750)
			.onComplete(() => {
				this.interactive = false;
				this.isSliding = false;
			})
			.easing(Easing.Bounce.Out)
			.start();
	}

	slideOut() {
		if (this.isSliding) return;

		this.isSliding = true;
		this.counterBG.renderable = true;


		const tween = new Tween(this)
			.to({ x: this.defaultX }, 750)
			.onComplete(() => {
				this.isSliding = false;
				this.interactive = this.defaultInteractivity;
				// console.log(this.interactive);

			})
			.easing(Easing.Bounce.Out)
			.start();
	}
}
