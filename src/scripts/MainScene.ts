import { Tween, Easing } from "@tweenjs/tween.js";
import { Body, Box, ContactMaterial } from "p2";
import * as PIXI from "pixi.js";
import { Graphics, MaskData, Point, Resource, Sprite } from "pixi.js";
import { start } from "repl";
import { AlertMessage, AlertMessageHolder } from "./AlertMessage";
import { CalculateScaleFactor, config } from "./appConfig";
import { Ball } from "./Ball";
import { deleteBallPowerUpInCookies, getBalance, getBallPowerUpInCookies, ScoreFunctions, updateBalance } from "./DataHandler";
import { GameRestartPopup } from "./GameRestartPopup";
import { aimTracker, CollisionGroups, GameData, Globals, isPowerUpActive, nFormatter, PauseAllPowerup, ResumeAllPowerup, TestGraphic } from "./Globals";
import { Hoop } from "./Hoop";
import { addOnBallAssignCallback, addOnBallSlideOutCallback, addOnPlayCallback, showQuestPanel } from "./HtmlHandler";
import { Plane } from "./Plane";
import { PowerUp, PowerUpHolder } from "./PowerUpHolder";
import { getClaimedQuests, getQuest, getUnlockedQuests, RefereshAllQuests } from "./quest";
import { AllQuests, Rewards } from "./QuestsConfig";
import { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";
import { TextLabel } from "./TextLabel";
import { Trigger } from "./Trigger";
import { checkIfMouseOver, getAngleBetween, getAngleRelativeToX, normalizeDirection, toDegrees, toRadians, vector } from "./Utilities";
import { throws } from "assert";
import { log } from "console";


// const hoopXOffset = -135;
// let hoopYOffset = -60;



export class MainScene extends Scene {
	ball: Ball;

	hoop: Hoop;
	trigger: Trigger;

	scoreLabel: TextLabel;
	highscoreLabel: TextLabel;
	totalDunksLabel: TextLabel;
	biscuitScore!: TextLabel;
	scoreMultiplier!: TextLabel;
	fingerPointer: PIXI.Sprite | null = null;
	fingerPointerTween: Tween<any>[] = [];
	overlay: PIXI.Graphics;
	ballPowerUps: PowerUpHolder;
	potionPowerUps: PowerUpHolder;
	allPowerups: PowerUp[];
	biscuit: PIXI.Sprite;

	alertMessageHolder: AlertMessageHolder;
	clouds: { sprite: PIXI.Sprite, speed: number }[] = [];
	pause: boolean = false;
	mask !: Graphics;
	biscuitCounter!: Sprite;
	foreground!: PIXI.Sprite;
	background!: PIXI.Sprite;
	cloud1!: PIXI.Sprite;
	cloud0!: PIXI.Sprite;

	constructor() {
		super(0x3c3c);

		this.mainContainer.sortableChildren = true;

		this.bgMusicInit();
		

		this.foreground = new Sprite(Globals.resources.bg2.texture);
		this.foreground.scale.set(Math.max(window.innerWidth / this.foreground.width, window.innerHeight / this.foreground.height));
		this.addChildToIndexFullScene(this.foreground, 1);

		this.background = new Sprite(Globals.resources.bg1.texture);
		this.background.scale.set(Math.max(window.innerWidth / this.background.width, window.innerHeight / this.background.height));
		this.addChildToIndexFullScene(this.background, 1);

		this.cloud1 = new Sprite(Globals.resources.cloud1.texture);
		this.cloud1.anchor.set(0.5);
		this.cloud1.x = window.innerWidth * 0.3;
		this.cloud1.y = window.innerHeight * 0.2;
		this.cloud1.scale.set(Math.max(window.innerWidth / this.cloud1.width, window.innerHeight / this.cloud1.height));
		this.addChildToIndexFullScene(this.cloud1, 2);
		this.clouds.push({ sprite: this.cloud1, speed: (Math.random() * 0.2) + 0.1 });

		this.cloud0 = new Sprite(Globals.resources.cloud0.texture);
		this.cloud0.anchor.set(0.5);
		this.cloud0.x = window.innerWidth * 0.5;
		this.cloud0.y = window.innerHeight * 0.15;
		this.cloud0.scale.set(Math.max(window.innerWidth / this.cloud0.width, window.innerHeight / this.cloud0.height));
		this.addChildToIndexFullScene(this.cloud0, 1);
		this.clouds.push({ sprite: this.cloud0, speed: (Math.random() * 0.2) + 0.1 });



		//create Pad
		const pad = new Sprite(Globals.resources.pad.texture);
		pad.zIndex = 1;
		pad.scale.set(1.5);
		pad.anchor.set(0.5, 1);
		pad.x = config.logicalWidth / 2;
		pad.y = config.logicalHeight + 50;
		this.addChild(pad);

		const allBallTextures: any[] = [
			Globals.resources.ball0.texture,
			Globals.resources.ball1.texture,
			Globals.resources.ball2.texture,
			Globals.resources.ball3.texture,
			Globals.resources.ball4.texture,
			Globals.resources.ball5.texture,
			Globals.resources.ball6.texture,
			Globals.resources.ball7.texture,
			Globals.resources.ball8.texture,
			Globals.resources.ball9.texture,
			Globals.resources.ball10.texture,
			Globals.resources.ball11.texture,
			Globals.resources.bronzeBall.texture, //12
			Globals.resources.silverBall.texture, //13
			Globals.resources.goldenBall.texture, //14
		];


		const plane = new Plane(config.logicalWidth, 200, config.logicalWidth / 2, config.logicalHeight - 20);
		this.addChild(plane);

		this.ball = new Ball(allBallTextures);
		this.ball.addShadow(this.mainContainer);
		this.addChild(this.ball);



		this.hoop = new Hoop(this.ball.shape.material);
		this.hoop.bg.zIndex = 0;
		this.addChild(this.hoop.bg);
		this.addChild(this.hoop.ctx);
		this.addChild(this.hoop.hoopVisual);

		this.trigger = new Trigger(config.logicalWidth / 2, 900, 150, 120, CollisionGroups.BALL);

		this.biscuit = new Sprite(Globals.resources.goldenBiscuitSmall.texture);
		this.biscuit.anchor.set(0.5);
		this.biscuit.scale.set(0.9);
		this.addChild(this.biscuit);

		new Tween(this.biscuit.scale).to({ x: 1.05, y: 1.05 }, 500).easing(Easing.Quadratic.InOut).yoyo(true).repeat(Infinity).start();

		// this.addChild(this.trigger.visual);
		// this.trigger.syncGraphic();

		Globals.App?.world.on("beginContact", (event: any) => {
			// console.log(event.shapeA.collisionGroup, event.shapeB.collisionGroup);
			if (
				(event.shapeA.collisionGroup === CollisionGroups.BALL && event.shapeB.collisionGroup === CollisionGroups.TRIGGER) ||
				(event.shapeB.collisionGroup === CollisionGroups.BALL && event.shapeA.collisionGroup === CollisionGroups.TRIGGER)
			) {
				this.showScore(1);

				if (!GameData.isCollidedWithJoint) {
					console.log("Perfect Score");
					GameData.scoreMultiplier += 1;

					Globals.soundResources.perfectPoint?.play();

				} else {
					GameData.scoreMultiplier = 1;

				}
				// console.log("throw",GameData.isCollidedWithJoint);

				this.updateScoreMultiplierStatus();

			}

			if (
				(event.shapeA.collisionGroup === CollisionGroups.BALL && event.shapeB.collisionGroup === CollisionGroups.NET) ||
				(event.shapeB.collisionGroup === CollisionGroups.BALL && event.shapeA.collisionGroup === CollisionGroups.NET)
			) {
				const net = event.shapeA.collisionGroup === CollisionGroups.NET ? event.bodyA : event.bodyB;

				if (net.isJoint) {
					GameData.isCollidedWithJoint = true;
					Globals.soundResources.ballColHoop?.play();
					Globals.soundResources.ballColHoop?.rate(0.03)
				}
			}
		});

		this.scoreLabel = new TextLabel(0, -340, 0.5, "", 100, 0xffffff);
		this.scoreLabel.style.fontWeight = "bold";
		this.hoop.bg.addChild(this.scoreLabel);

		GameData.highScore = ScoreFunctions.getHighscore();
		const totalDunks = ScoreFunctions.getOtherScore("totalDunks");

		// console.log(ScoreFunctions.getOtherScore("bronzeBall"));

		if (totalDunks) GameData.totalDunks = totalDunks;
		else GameData.totalDunks = 0;

		// console.log(ScoreFunctions.getOtherScore("bronzeBall"));

		this.highscoreLabel = new TextLabel(-170, -250, 0.5, nFormatter(GameData.highScore).toString(), 35, 0xffffff);
		this.highscoreLabel.style.fontWeight = "bold";
		this.highscoreLabel.anchor.set(0, 0.5);

		const highscoreIcon = new Sprite(Globals.resources.highscoreIcon.texture);
		highscoreIcon.anchor.set(0.5);
		highscoreIcon.scale.set(0.35);
		highscoreIcon.x = -195;
		highscoreIcon.y = this.highscoreLabel.y;
		this.hoop.bg.addChild(this.highscoreLabel, highscoreIcon);

		this.totalDunksLabel = new TextLabel(-170, -205, 0.5, GameData.totalDunks.toString(), 35, 0xffffff);
		this.totalDunksLabel.style.fontWeight = "bold";
		this.totalDunksLabel.anchor.set(0, 0.5);


		const hoopsIcon = new Sprite(Globals.resources.hoopIcon.texture);
		hoopsIcon.anchor.set(0.5);
		hoopsIcon.scale.set(0.35);
		hoopsIcon.x = -195;
		hoopsIcon.y = this.totalDunksLabel.y;
		this.hoop.bg.addChild(this.totalDunksLabel, hoopsIcon);
		this.addBiscuitScoreBG();

		this.scoreMultiplier = new TextLabel(0, -230, 0.5, `x ${GameData.scoreMultiplier}`, 90, 0xffad36);
		this.scoreMultiplier.style.stroke = 0x952231;
		this.scoreMultiplier.style.strokeThickness = 10;
		this.scoreMultiplier.renderable = false;

		this.hoop.bg.addChild(this.scoreMultiplier);



		this.createHelpFingerPointer();

		setTimeout(() => {
			this.ball.body.wakeUp();
		}, 150);

		// this.addChild(new GameRestartPopup(10, this.onPlayAgain.bind(this), this.onWatchAd.bind(this)));

		setTimeout(() => {
			console.log("Time Started");
			this.hoop.updateKnotDamping();
			this.hoop.updateThreadDamping();
			this.ball.interactive = true;

			// this.setNewHoopPosition();
		}, 1000);

		addOnPlayCallback(this.onPlayBtnPressed.bind(this));

		addOnBallSlideOutCallback(this.ballSlideOut.bind(this));

		addOnBallAssignCallback(this.ballAssignCallback.bind(this));

		this.overlay = new Graphics();
		this.overlay.beginFill(0x000000, 0.5);
		this.overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
		this.overlay.endFill();
		this.overlay.renderable = false;
		//this.addToScene(this.overlay);

		const ballPowerups = [
			new PowerUp([Globals.resources.bronzeBallItem.texture, Globals.resources.bronzeBallItemHover.texture], "bronzeBall"),
			new PowerUp([Globals.resources.silverBallItem.texture, Globals.resources.silverBallItemHover.texture], "silverBall"),
			new PowerUp([Globals.resources.goldenBallItem.texture, Globals.resources.goldenBallItemHover.texture], "goldenBall"),
		];

		this.ballPowerUps = new PowerUpHolder(ballPowerups, true, window.innerWidth - ballPowerups[0].width, window.innerHeight - 200 * config.minScaleFactor);
		this.addToScene(this.ballPowerUps);
		// this.ballPowerUps.renderable = true;
		const potionPowerups = [
			new PowerUp([Globals.resources.potionBall.texture, Globals.resources.potionBallHover.texture], "potionBall"),
			new PowerUp([Globals.resources.potionBisquit.texture, Globals.resources.potionBisquitHover.texture], "potionBisquit"),
			new PowerUp([Globals.resources.potionHoop.texture, Globals.resources.potionHoopHover.texture], "potionHoop"),
			new PowerUp([Globals.resources.potionScore.texture, Globals.resources.potionScoreHover.texture], "potionScore"),
		];

		this.allPowerups = [...ballPowerups, ...potionPowerups];
		

		this.potionPowerUps = new PowerUpHolder(potionPowerups, false, +potionPowerups[0].width, window.innerHeight - 200 * config.minScaleFactor);
		this.addToScene(this.potionPowerUps);

	

		// this.showScoreMultiplier(2, true);


		// this.setNewHoopPosition(true);

		aimTracker.recalculateAngles(this.hoop);

		// console.log(config.logicalWidth);

		this.hoop.updatePosition(config.logicalWidth / 2, this.hoop.y - 0);

		this.alertMessageHolder = new AlertMessageHolder();
		this.mainContainer.addChild(this.alertMessageHolder);
		this.alertMessageHolder.zIndex = 10;


		this.debugCode();



		// setTimeout(() => {
		// 	// const angle = 90 + (Math.abs((540 - this.hoop.x))/290) * 4;
		// 	const angle = 180 - aimTracker.testAngle;
		// 	let convertedDir = {x : Math.cos(toRadians(-angle)), y : Math.sin(toRadians(-angle))};
		// 	convertedDir = normalizeDirection(convertedDir);
		// 	this.ball.throwBall(convertedDir);
		// }, 3000);

		// setTimeout(() => {
		// 	Globals.emitter?.Call("showAlertMsg", {phrase : "First message check"});

		// 	Globals.emitter?.Call("showAlertMsg", {phrase : "Second message check"});
		// }, 1000);
		// 	setTimeout(() => {
		// 	Globals.emitter?.Call("showAlertMsg", {phrase : "First message check"});

		// }, 3000);

		
	}




	aimingLine!: Graphics;
	debugCode() {

		return;

		const defaultBallPos = { x: config.logicalWidth / 2, y: 1660.01318359375 }

		// return;
		if (!this.aimingLine) {


			this.aimingLine = new Graphics();
			this.aimingLine.zIndex = 99;
			// this.addChild(this.aimingLine)




			TestGraphic.zIndex = 99;

			this.addChild(TestGraphic);

			TestGraphic.beginFill(0xff0000, 1);
			TestGraphic.drawCircle(defaultBallPos.x, defaultBallPos.y, 20);
			TestGraphic.endFill();

			// let y = defaultBallPos.y - (this.hoop.y - hoopYOffset); 

			// console.log(y);
			let x = Math.abs(190);

			let worldGravity = Globals.App?.world.gravity;

			// let g = (worldGravity ? worldGravity[1] : 100) * this.ball.body.gravityScale;
			let g = 874.5;
			// let g = 9.8;




			let y0 = -(defaultBallPos.y - this.hoop.y);
			console.log(y0);
			// let x0 = 





			let initialVelocity = 1600;
			let angle1 = Math.atan(x / y0);

			let a = (g * (x * x)) / (initialVelocity * initialVelocity);
			let firstSol = Math.acos((a - y0) / Math.sqrt((y0 * y0) + (x * x)));

			let angleFromFirstEq = (firstSol + angle1) / 2;


			console.log(toDegrees(angleFromFirstEq), "Angle");
			console.log(90 - toDegrees(angleFromFirstEq));

			const aForAngle = aimTracker.calculateAngleToFireInRadians({ x: x, y: y0 });

			console.log(toDegrees(aForAngle), "Angle");
			console.log(90 - toDegrees(aForAngle));



			// TestGraphic.beginFill(0xff0000, 1);
			// TestGraphic.drawCircle(defaultBallPos.x - hoopXOffset,defaultBallPos.y + y0, 20);
			// TestGraphic.endFill();




			// let t = 0;
			// const parabola = new Graphics();
			// parabola.zIndex = 99;

			// this.addChild(parabola);

			// parabola.moveTo(defaultBallPos.x,defaultBallPos.y);

			// parabola.lineStyle({
			// 	color : 0xff0000,
			// 	width : 8,
			// 	alpha : 1
			// });

			// // aimTracker.testAngle = 93.6

			// let testAngle = toRadians(aimTracker.testAngle);

			// let hMax = (initialVelocity * initialVelocity) * (Math.sin(testAngle) * Math.sin(testAngle)) 

			// hMax /= (2 * g);

			// console.log(`🔝 ${hMax}`);

			// let sign = (hoopXOffset / Math.abs(hoopXOffset)) 
			// function Vx(): number {
			// 	return initialVelocity * Math.cos(testAngle) ;
			// }

			// function Vy(): number {
			// 	return initialVelocity * Math.sin(testAngle) ;
			// }

			// let h = defaultBallPos.y;

			// let maxPoint = 0;
			// for(t = 0; t <= (1.82 * 2); t+= 0.01)
			// {
			// 	let x = defaultBallPos.x + (sign * Vx() * t) 
			// 	let y = (h - (Vy() * t)) + (g * (t*t)) / 2;

			// 	maxPoint = Math.max(1660 - y, maxPoint);
			// 	// console.log(y);
			// 	parabola.lineTo(x, y);

			// }

			// console.log(`Max Point : ${maxPoint}`);
		}








		this.aimingLine.clear();

		this.aimingLine.lineStyle({
			color: 0x78f400,
			width: 6,
			alpha: 1
		});

		this.aimingLine.moveTo(defaultBallPos.x, defaultBallPos.y);
		this.aimingLine.lineTo(this.hoop.x, this.hoop.y);

		const direction1 = { x: this.hoop.x - defaultBallPos.x, y: this.hoop.y - defaultBallPos.y }
		// console.log(normalizeDirection(direction1));
		// console.log(getAngleRelativeToX(direction1));


		this.aimingLine.moveTo(defaultBallPos.x, defaultBallPos.y);
		this.aimingLine.lineTo(this.hoop.x + this.hoop.wireWidth / 2, this.hoop.y);

		const direction2 = { x: (this.hoop.x + this.hoop.wireWidth / 2) - defaultBallPos.x, y: this.hoop.y - defaultBallPos.y }
		// console.log(normalizeDirection(direction2));
		// console.log(getAngleRelativeToX(direction2));


		this.aimingLine.moveTo(defaultBallPos.x, defaultBallPos.y);
		this.aimingLine.lineTo(this.hoop.x - this.hoop.wireWidth / 2, this.hoop.y);

		const direction3 = { x: (this.hoop.x - this.hoop.wireWidth / 2) - defaultBallPos.x, y: this.hoop.y - defaultBallPos.y }
		// console.log(normalizeDirection(direction3));
		// console.log(getAngleRelativeToX(direction3));

		// console.log(toDegrees(getAngleRelativeToX(direction2)),toDegrees(getAngleRelativeToX(direction1)),toDegrees(getAngleRelativeToX(direction3)))





	}




	ballSlideOut(questID: string, rewardID: string) {
		console.log("BALL SLIDE OUT " + questID + " " + rewardID);

		for (let i = 0; i < this.allPowerups.length; i++) {
			if (this.allPowerups[i].powerUpID == rewardID) {
				this.allPowerups[i].addCounter(getQuest(questID).rewardValue);
				Globals.soundResources.ui_scroll?.play();

				break;
			}
		}

		this.potionPowerUps.checkRenderable();
		this.ballPowerUps.checkRenderable();
	}

	ballAssignCallback(index: number) {

		Globals.soundResources.ui_click?.play();

		if (index >= 0 && index < 13) {
			this.ball.changeBall(index);
		} else console.log("NOT ENOUGH MONEY");

	}

	createHelpFingerPointer() {
		this.fingerPointer = new Sprite(Globals.resources.fingerPointer.texture);
		this.fingerPointer.zIndex = 4;
		this.fingerPointer.scale.set(1.5);
		this.fingerPointer.x = config.logicalWidth / 2 - 40;
		this.fingerPointer.y = 1500;

		this.tweenHelpFinger();

		this.addChild(this.fingerPointer);
	}

	tweenHelpFinger() {
		if (this.fingerPointer == null) return;

		this.fingerPointer.alpha = 1;
		this.fingerPointer.scale.set(1.5);
		this.fingerPointer.x = config.logicalWidth / 2 - 40;
		this.fingerPointer.y = 1500;

		// this.fingerPointerTween = [];

		if (this.fingerPointerTween.length == 0) {
			this.fingerPointerTween.push(new Tween(this.fingerPointer.scale).to({ x: 1.2, y: 1.2 }, 500).easing(Easing.Cubic.Out));
			this.fingerPointerTween.push(new Tween(this.fingerPointer).to({ y: 960, alpha: 0 }, 1000).easing(Easing.Quadratic.Out));

			this.fingerPointerTween[1].onComplete(() => {
				this.tweenHelpFinger();
			});

			this.fingerPointerTween[0].onComplete(() => {
				this.fingerPointerTween[1].start();
			});
		}

		this.fingerPointerTween[0].start();
	}

	setNewHoopPosition(start: boolean) {
		if (start) {
			const xPos = Math.random() * 580 + config.logicalWidth / 2 - 290;
			this.hoop.updatePosition(xPos, undefined);
		} else {
			const changeBothSides = Math.random() > 0.5;

			if (changeBothSides) {
				const xPos = Math.random() * 580 + config.logicalWidth / 2 - 290;
				const yPos = Math.random() * 200 + 700 - 100;

				this.hoop.updatePosition(xPos, yPos);
			} else {
				const xPos = Math.random() * 400 + config.logicalWidth / 2 - 200;
				this.hoop.updatePosition(xPos, undefined);
			}
		}
	}

	addBiscuitScoreBG() {
		this.biscuitCounter = new Sprite(Globals.resources.goldenBiscuitCounter.texture);
		this.biscuitCounter.anchor.set(1);
		this.biscuitCounter.zIndex = 4;
		console.log(-window.innerWidth);

		this.biscuitCounter.x = +this.biscuitCounter.width * this.biscuitCounter.scale.x;
		this.biscuitCounter.y = +this.biscuitCounter.height * 1.5 * this.biscuitCounter.scale.y;

		// biscuitCounter.height = 100;


		const biscuit = new Sprite(Globals.resources.goldenBiscuitSmall.texture);
		biscuit.anchor.set(1);

		biscuit.zIndex = 4;

		biscuit.x = -biscuit.width * 2;
		biscuit.y = 15;
		this.biscuitCounter.addChild(biscuit);

		this.biscuitScore = new TextLabel(
			-120,
			-40,
			0.5,
			getBalance().toString(),
			46,
			0xffffff
		);
		this.biscuitScore.zIndex = 4;

		this.biscuitScore.style.fontWeight = "bold";
		this.biscuitCounter.addChild(this.biscuitScore);
		this.addChild(this.biscuitCounter);
	}


	bgMusicInit() {
		Globals.soundResources.bgMusic.loop(true);
		Globals.soundResources.bgMusic?.play();
		Globals.soundResources.bgMusic.volume(1);
	}


	updateScoreMultiplierStatus() {

		if (GameData.scoreMultiplier <= 1) {
			this.scoreMultiplier.renderable = false;
			return;
		}

		this.scoreMultiplier.renderable = true;
		this.scoreMultiplier.scale.set(0);
		this.scoreMultiplier.upadteLabelText(`x ${GameData.scoreMultiplier}`);

		new Tween(this.scoreMultiplier.scale).to({ x: 1, y: 1 }, 400).easing(Easing.Elastic.InOut).start();

	}


	showScore(score: number) {




		if (isPowerUpActive("potionScore")) {
			GameData.additionalScore = 2;
		}

		score *= GameData.scoreMultiplier;


		let hasAdditionalScoreAdded = GameData.additionalScore > 0;

		score += (score * GameData.additionalScore);
		Globals.soundResources.collectBiscuit?.play();
		Globals.soundResources.winSound?.play();


		this.biscuitScore.upadteLabelText(getBalance().toString());




		this.ball.scored();

		const tween = new Tween(this.biscuit.scale).to({ x: 0, y: 0 }, 500).yoyo(true).repeat(1).easing(Easing.Bounce.Out).start();
		let biscuitBalance = 0;
		if (isPowerUpActive("potionBisquit")) {

			biscuitBalance += 1 * 2;

			Globals.emitter?.Call("showAlertMsg", { phrase: `+${biscuitBalance} bonus biscuits` })

		} else biscuitBalance++;

		GameData.biscuitScore += biscuitBalance;
		updateBalance(biscuitBalance);
		this.biscuitScore.upadteLabelText(getBalance().toString());

		if (!hasAdditionalScoreAdded) {
			const scoreText = new TextLabel(config.logicalWidth / 2, 900, 0.5, "+" + score, 56, 0xffffff);
			scoreText.zIndex = 5;
			scoreText.style.dropShadow = true;
			scoreText.style.dropShadowDistance = 2;
			scoreText.style.fontWeight = "bold";
			scoreText.style.lineJoin = "bevel";
			scoreText.style.strokeThickness = 11;
			(scoreText.style.stroke = "0x4f3438"), this.addChild(scoreText);

			new Tween(scoreText.scale)
				.to({ x: 1.5, y: 1.5 }, 750)
				.easing(Easing.Linear.None)
				.onComplete(() => {
					new Tween(scoreText)
						.to({ alpha: 0 }, 250)
						.easing(Easing.Quadratic.Out)
						.onComplete(() => {
							scoreText.destroy();
						})
						.start();
				})
				.start();
		} else {
			Globals.emitter?.Call("showAlertMsg", { phrase: `+${score} bonus score` })

		}


		GameData.score += score;

		this.scoreLabel.upadteLabelText(GameData.score.toString());

		GameData.totalDunks++;

		this.totalDunksLabel.upadteLabelText(GameData.totalDunks.toString());
		if (ScoreFunctions.getOtherScore("totalDunks")) ScoreFunctions.setOtherScore("totalDunks", GameData.totalDunks);
		else ScoreFunctions.addOtherScore("totalDunks", GameData.totalDunks);
	}

	resize(): void {

		super.resize();



		this.overlay.clear();
		this.overlay.beginFill(0x000000, 0.5);
		this.overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
		this.overlay.endFill();
		this.ballPowerUps.resize();
		this.potionPowerUps.resize();

		this.ballPowerUps.x = window.innerWidth - this.ballPowerUps.widthOfChild * this.ballPowerUps.scale.x;
		this.ballPowerUps.y = window.innerHeight - 200 * config.minScaleFactor;

		this.potionPowerUps.x = +this.potionPowerUps.widthOfChild * this.potionPowerUps.scale.x;
		this.potionPowerUps.y = window.innerHeight - 200 * config.minScaleFactor;



		this.biscuitCounter.x = +this.biscuitCounter.width * this.biscuitCounter.scale.x;
		this.biscuitCounter.y = +this.biscuitCounter.height * 1.5 * this.biscuitCounter.scale.y;
		// this.hoop.resize();
		this.foreground.scale.set(config.minScaleFactor * 4);
		this.background.scale.set(config.minScaleFactor * 4);
		this.cloud1.scale.set(config.minScaleFactor * 4);
		this.cloud0.scale.set(config.minScaleFactor * 4);
	}

	update(dt: number): void {
		// throw new Error('Method not implemented.');
		// console.log(Globals.App?.app.ticker.deltaMS );
		if (!this.pause) {
			this.resize();

			dt = Globals.App?.app.ticker.deltaMS != undefined ? Globals.App?.app.ticker.deltaMS : 0;
			Globals.App?.world.step(1 / (20 * (20 / Globals.App?.app.ticker.deltaMS)));
			// Globals.App?.world.step(1/60);

			this.ball.update(dt);
			this.hoop.update(dt);
			this.hoop.render();

			// console.log(dt);
			//TODO: remove console of dt.

			this.trigger.updatePosition(this.hoop.x, this.hoop.y + 200);

			this.biscuit.x = this.trigger.position[0];
			this.biscuit.y = this.trigger.position[1] + 50;

			// this.trigger.syncGraphic();

			if (this.potionPowerUps.renderable)
				this.potionPowerUps.updateTimer();


			if (this.ballPowerUps.renderable)
				this.ballPowerUps.updateTimer();

			this.debugCode();



			this.clouds.forEach(cloud => {
				cloud.sprite.x += cloud.speed;

				if (cloud.sprite.x > config.logicalWidth + cloud.sprite.width * 1.2) {
					cloud.speed = (Math.random() * 0.2) + 0.1;
					cloud.sprite.x = -(config.logicalWidth / 2 + cloud.sprite.width * 1.2);
				}
			});

			
			this.ballPowerUps.pointerDown();
			this.potionPowerUps.pointerDown();
			/* setTimeout(() => {
				this.ballPowerUps.checkRenderable();
				// this.potionPowerUps.checkRenderable();
			}, 500); */
			// this.potionPowerUps.checkRenderable();
		}

	}

	recievedMessage(msgType: string, msgParams: any): void {
		// throw new Error('Method not implemented.');
		if (msgType == "Mask Mascot") {
			this.ballPowerUps.interactive = false;
			this.potionPowerUps.interactive = false;
			if (msgParams) {

				this.mask = new Graphics();
				this.mask.beginFill(0x000000, 0.5);
				this.mask.drawRect(-4000, -500, 7000, 6000);
				this.mask.endFill();
				this.mask.zIndex = 99;
				this.addToScene(this.mask);
			}
			else if (!msgParams && this.mask)
				this.mask.destroy()
		}
		else if (msgType === "resume") {
			if (!msgParams) {
				Globals.soundResources.bgMusic?.mute(true);
			}
			else if (msgParams) {
				Globals.soundResources.bgMusic?.mute(false);
			}
		}
		else if (msgType === "showAlertMsg") {

			if (msgParams.phrase)
				this.alertMessageHolder.addAlertMessage(msgParams.phrase);
			else
				this.alertMessageHolder.addAlertMessage(undefined);

		} else if (msgType === "resetStreak") {

			Globals.soundResources.loseSound?.play();
			PauseAllPowerup();
			this.ballPowerUps.interactive = false;
			this.potionPowerUps.interactive = false;

			GameData.scoreMultiplier = 1;
			this.updateScoreMultiplierStatus();

			this.hoop.updatePosition(config.logicalWidth / 2, 700);

			this.ball.interactive = false;

			if (GameData.score > GameData.highScore) {
				GameData.highScore = GameData.score;
				this.highscoreLabel.upadteLabelText(nFormatter(GameData.highScore).toString());
				ScoreFunctions.setHighScore(GameData.highScore);
				this.addChild(new GameRestartPopup(10, this.freezeGame.bind(this, GameData.score), this.freezeGame.bind(this, GameData.score)));
			} else this.freezeGame(GameData.score);

			GameData.score = 0;

			this.scoreLabel.upadteLabelText("");
		} else if (msgType == "onBallScored") {

			console.log(msgParams);
			// if(msgParams)
			// {
			// 	console.log("perfec");
			// 	GameData.scoreMultiplier += 1;
			// 	this.updateScoreMultiplierStatus();

			//  } else
			//  {
			//  	GameData.scoreMultiplier = 1;
			//  	this.updateScoreMultiplierStatus();
			//  }

			if (GameData.score >= 9 && GameData.score <= 13) this.setNewHoopPosition(true);
			if (GameData.score > 13) this.setNewHoopPosition(false);
		} else if (msgType == "onFirstThrow") {

			ResumeAllPowerup();

			//TODO : Save On First Throw in Cookies



			if (this.fingerPointer != null) {
				for (let i = 0; i < this.fingerPointerTween.length; i++) {
					this.fingerPointerTween[i].stop();
				}

				this.fingerPointer.destroy();
				this.fingerPointer = null;
			}
		} else if (msgType == "onPointerDown") {
			if (checkIfMouseOver(this.ballPowerUps)) console.log("Called");
			if (this.ballPowerUps && !checkIfMouseOver(this.ballPowerUps)) this.ballPowerUps.pointerGotDown();


			if (this.potionPowerUps && !checkIfMouseOver(this.potionPowerUps)) this.potionPowerUps.pointerGotDown();	
		} else if (msgType == "changeBall") {

			this.ball?.changeBall(msgParams);

		} else if (msgType == "onPowerUpActivated") {

			//  if(msgParams == "potionBall"){
			// 	this.ball.body.sleep()
			// 	setTimeout(() => {
			//       this.ball.body.wakeUp();
			// 	 }, 250);

			//  }
			if (this.potionPowerUps.renderable) {
				this.potionPowerUps.powerUps.forEach((potion) => {
					potion.checkIfNeedToBeDeactivated();
				});
			}

			if (this.ballPowerUps.renderable) {
				this.ballPowerUps.powerUps.forEach((potion) => {
					potion.checkIfNeedToBeDeactivated();
				});
			}
		} else if (msgType == "onPowerUpTimerEnd") {

			if (msgParams == "potionScore") {
				GameData.additionalScore = 0;
			}

			if (this.potionPowerUps.renderable) {
				this.potionPowerUps.powerUps.forEach((potion) => {
					potion.checkIfNeedToBeDeactivated();
				});
			}

			if (this.ballPowerUps.renderable) {
				this.ballPowerUps.powerUps.forEach((potion) => {
					potion.checkIfNeedToBeDeactivated();
				});
			}
		} else if (msgType == "hoopPositionChanged") {
			// console.log(this.hoop.x);
			aimTracker.recalculateAngles(this.hoop);
		} else if (msgType == "powerUpClicked") {
			if (msgParams == "bronzeBall" || msgParams == "silverBall" || msgParams == "goldenBall") {
				this.ballPowerUps.powerUps.forEach((ball) => {
					ball.disablePowerUp();
				});
			}

		} else if (msgType == "colorBallReset") {
			this.ballPowerUps.powerUps.forEach((ball) => {
				if (ball.counter > 0) {
					ball.disablePowerUp(false);
					deleteBallPowerUpInCookies();
				}
			});
		} else if (msgType == "pause") {
			// console.log(this.hoop.x);
			this.pause = true;
		} else if (msgType == "resume") {
			// console.log(this.hoop.x);
			this.pause = false;
		}
		else if (msgType == "ad") {
			this.onWatchAd();
		}
		else if(msgType == "UpdateBalance")
		{
		this.biscuitScore.upadteLabelText(getBalance().toString());
		}
	}

	freezeGame(score: number) {

		this.overlay.renderable = true;

		this.ball.interactive = false;
		GameData.canThrow = false;


		let totalScore = ScoreFunctions.getOtherScore("totalScore");
		if (totalScore != null) {
			ScoreFunctions.setOtherScore("totalScore", totalScore + score);
			console.log(totalScore + score);

			GameData.lastScore = totalScore + score;
		} else {
			ScoreFunctions.addOtherScore("totalScore", score);
			GameData.lastScore = score;
		}

		RefereshAllQuests();
		showQuestPanel(getUnlockedQuests(), GameData.lastScore);
	}

	onPlayBtnPressed() {

		ResumeAllPowerup();

		// GameData.biscuitScore = 0;
		GameData.canThrow = true;

		this.overlay.renderable = false;
		this.ball.interactive = true;
		this.ballPowerUps.interactive = true;
		this.potionPowerUps.interactive = true;
	}

	onWatchAd() {
		console.log("ad");
		setTimeout(() => {
			this.ball.interactive = false;
		}, 250);
	}
}