import { Tween } from "@tweenjs/tween.js";
import { Body, Circle, Material } from "p2";
import { AnimatedSprite, Container, InteractionEvent, Resource, Sprite, Texture } from "pixi.js";
import { config } from "./appConfig";
import { getCurrentBall } from "./DataHandler";
import { sendToDB } from "./DbLogger";
// import { sendToDB } from "./DbLogger";
import { aimTracker, CollisionGroups, GameData, Globals, isPowerUpActive, TestGraphic } from "./Globals";
import { clamp, convertBodyPositionToPixiPosition, getAngleRelativeToX, toDegrees, toRadians } from "./Utilities";

const BallConfig = {
	radius: 150,
	mass: 10,
	gravityScale: 8,
	color: 0x70564d,
	lineWidth: 10,
	minRadius: 90,
	shrinkMultiplier: 0.7,
	defaultPos: { x: config.logicalWidth / 2, y: config.logicalHeight - 300 },
	maxY: 400,
	maxx: 200,
	resetYPos: config.logicalHeight / 2 + 300,
	velocity: 1600,
	maxPointerDistance: 170,
	//TODO: Changed from 100 to 10
	minDistance: 100,
};

export class Ball extends AnimatedSprite {
	body: Body;
	shape: Circle;
	aspectRatio: { x: number; y: number } = { x: 1, y: 1 };
	hasThrown = false;
	isComingDown = false;
	startPos!: { x: number; y: number };

	isEvntFired = false;
	evntStartPos: { x: number; y: number } = { x: 0, y: 0 };
	evntEndPos: { x: number; y: number } = { x: 0, y: 0 };

	// ballStartPos : {x : number, y : number} = {x : 0, y : 0};

	offset: { x: number; y: number } = { x: 0, y: 0 };
	scaleOffset = 0;
	currentStreak: number = 0;
	hasScored: boolean = false;
	shadow!: Sprite;

	canShrinkBall: boolean = false;

	isFirstThrow: boolean = true;

	hasColorBall: boolean = false;

	currentRadius: number = 0;
	resetTimeout: NodeJS.Timeout | undefined;


	constructor(allBallTextures: any[]) {
		super(allBallTextures);

		//load Data here and change below line 
		this.gotoAndStop(getCurrentBall());

		this.anchor.set(0.5);

		this.body = new Body({
			mass: BallConfig.mass,
			position: [BallConfig.defaultPos.x, BallConfig.defaultPos.y],
			//ccdSpeedThreshold: 0
		});

		//Reduce the ball damping to avoid a bit the energy loss.
		this.body.damping = 0.05;
		this.body.angularDamping = 0.05;

		this.body.gravityScale = BallConfig.gravityScale;

		this.shape = new Circle({ radius: BallConfig.radius });
		this.currentRadius = BallConfig.radius;
		this.shape.collisionGroup = CollisionGroups.BALL;
		this.shape.collisionMask = CollisionGroups.SURFACE | CollisionGroups.NET;
		this.shape.material = new Material();

		this.body.addShape(this.shape);
		this.zIndex = 3;

		// this.interactive = true;

		Globals.App?.world.addBody(this.body);

		this.implementDrag();

		this.body.velocity[0] = 0;
		this.body.velocity[1] = -40;


		this.recalculateAspectRatio();

		this.body.sleep();

		// this.width = (this.shape.radius * 2) * this.aspectRatio.x;
		// this.height = (this.shape.radius * 2 )* this.aspectRatio.y;

	}

	recalculateAspectRatio() {

		this.scale.set(1);




		this.aspectRatio = { x: 1, y: 1 };

		if (this.height == Math.max(this.height, this.width)) {
			this.aspectRatio.y = Math.max(this.height, this.width) / Math.min(this.height, this.width);
		} else
			this.aspectRatio.x = Math.max(this.height, this.width) / Math.min(this.height, this.width);



		this.width = (this.shape.radius * 2) * this.aspectRatio.x;
		this.height = (this.shape.radius * 2) * this.aspectRatio.y;
	}

	changeBall(index: number) {

		this.body.angle = 0;


		this.gotoAndStop(index);

		this.recalculateAspectRatio();
		// this.checkAspectRatio();

		if (index > 11) {
			this.hasColorBall = true;

			Globals.emitter?.Call("colorBallChanged");
			// setTimeout(() => {
			//     this.gotoAndStop(GameData.defaultBallId);
			// },timeOutSecs * 1000);
		}
	}

	addShadow(container: Container) {
		this.shadow = new Sprite(Globals.resources.ballShadow.texture);
		this.shadow.anchor.set(0.5);
		this.shadow.x = config.logicalWidth / 2;
		this.shadow.y = config.logicalHeight - 120;
		this.shadow.zIndex = 1;
		container.addChild(this.shadow);
	}
	checkAspectRatio() {

		if (this._height == Math.max(this._height, this._width)) {
			this.aspectRatio.y = Math.max(this.height, this.width) / Math.min(this.height, this.width);
		} else
			this.aspectRatio.x = Math.max(this.height, this.width) / Math.min(this.height, this.width);


		this.width = (this.shape.radius * 2) * this.aspectRatio.x;
		this.height = (this.shape.radius * 2) * this.aspectRatio.y;
	}

	scored() {
		this.currentStreak++;
		this.hasScored = true;
		// this.isPerfectThrow = false;
		// console.log("perfect score : " + this.isPerfectThrow);

	}

	// lastMovedTime : number = 0;

	implementDrag() {
		this.on("pointerdown", (event) => {
			this.evntStartPos = { x: event.data.global.x, y: event.data.global.y };
			// this.ballStartPos = {x : this.body.position[0], y : this.body.position[1]};
			this.isEvntFired = true;

			const offsetTween = new Tween(this.offset).to({ x: 0, y: 0 }, 300);
			setTimeout(() => { if (this.isEvntFired) offsetTween.start(); this.isEvntFired = false; }, 300)
			// this.lastMovedTime = Date.now();
		});

		this.on("pointermove", (event: InteractionEvent) => {
			if (this.isEvntFired) {
				this.evntEndPos = { x: event.data.global.x, y: event.data.global.y };

				const direction = { x: this.evntEndPos.x - this.evntStartPos.x, y: this.evntEndPos.y - this.evntStartPos.y };


				// const currentTime = Date.now();

				// const deltaTime = currentTime - this.lastMovedTime;
				// this.lastMovedTime = currentTime;


				const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

				if (distance > BallConfig.maxPointerDistance * config.minScaleFactor) {
					// this.scaleOffset = 0;
					// this.isEvntFired = false;
					// this.offset = {x : 0, y : 0};
					// this.evntEndPos = {x : event.data.global.x, y : event.data.global.y};

					this.onPointerUp(event);
				} else {
					// const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
					direction.x /= BallConfig.maxPointerDistance * config.minScaleFactor;
					direction.y /= BallConfig.maxPointerDistance * config.minScaleFactor;

					this.shadow.alpha = 1 - Math.abs(direction.y);

					this.offset.x = direction.x * BallConfig.maxPointerDistance;
					this.offset.y = direction.y < 0 ? direction.y * BallConfig.maxPointerDistance : 0;

					this.scaleOffset = 10 * Math.max(Math.abs(direction.x), Math.abs(direction.y));
				}
			}
		});

		this.on("pointerup", this.onPointerUp.bind(this));

		this.on("pointerupoutside", this.onPointerUp.bind(this));
	}

	onPointerUp(event: any) {
		if (this.isEvntFired) {
			// this.scale.set(1);
			this.scaleOffset = 0;
			this.isEvntFired = false;

			const offsetTween = new Tween(this.offset).to({ x: 0, y: 0 }, 300);
			// this.offset = {x : 0, y : 0};
			this.evntEndPos = { x: event.data.global.x, y: event.data.global.y };

			if (this.evntEndPos.y < this.evntStartPos.y) {
				const direction = { x: this.evntEndPos.x - this.evntStartPos.x, y: this.evntEndPos.y - this.evntStartPos.y };

				const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

				const normalizedDirection = { x: direction.x / distance, y: direction.y / distance };


				if (distance > BallConfig.minDistance * config.minScaleFactor && Math.abs(normalizedDirection.x) <= 0.8) {
					this.offset = { x: 0, y: 0 };

					direction.x = clamp(
						direction.x,
						-BallConfig.maxPointerDistance * config.minScaleFactor,
						BallConfig.maxPointerDistance * config.minScaleFactor
					);
					// const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
					direction.x /= BallConfig.maxPointerDistance * config.minScaleFactor;
					direction.y /= BallConfig.maxPointerDistance * config.minScaleFactor;


					this.throwBall(direction);
				} else offsetTween.start();



			} else offsetTween.start();
		}
		//	this.shrinkBall();
	}

	isPerfectThrow = false;

	maxHeightReached = 0;

	throwBall(direction: { x: number; y: number }) {
		if (this.isFirstThrow) {
			this.isFirstThrow = false;
			Globals.emitter?.Call("onFirstThrow");
		}

		GameData.isCollidedWithJoint = false;

		this.interactive = false;
		this.startPos = { x: this.x, y: this.y };
		this.hasThrown = true;

		this.body.angularVelocity = 2 * (direction.x == 0 ? 0.1 : direction.x / Math.abs(direction.x));
		this.body.position = [this.x, this.y];

		const velocity = { x: direction.x * BallConfig.velocity, y: -BallConfig.velocity };
		const angle = getAngleRelativeToX(velocity);

		let degreeAngle = -toDegrees(angle);

		console.log(`🌠 ${degreeAngle}`);

		// if(aimTracker.angle == 90)
		{
			const maxAngle = (aimTracker.isHoopAtLeftSide) ? aimTracker.leftSideAngle : aimTracker.rightSideAngle;
			const minAngle = (aimTracker.isHoopAtLeftSide) ? aimTracker.rightSideAngle : aimTracker.leftSideAngle;


			if (degreeAngle <= maxAngle && degreeAngle >= minAngle) {
				console.log(`⁉ ${degreeAngle}`);

				degreeAngle = degreeAngle * (1 - aimTracker.helpWeight) + aimTracker.angle * aimTracker.helpWeight;

				console.log(`🩹 ${degreeAngle}`);

			}

			console.log(degreeAngle);

		}








		const convertedDir = { x: Math.cos(toRadians(-degreeAngle)), y: Math.sin(toRadians(-degreeAngle)) };


		TestGraphic.moveTo(this.x, this.y);
		TestGraphic.lineTo(this.x + (convertedDir.x * BallConfig.velocity), this.y + (convertedDir.y * BallConfig.velocity));

		convertedDir.x *= BallConfig.velocity;
		convertedDir.y *= BallConfig.velocity;

		this.body.velocity[0] = convertedDir.x;
		this.body.velocity[1] = convertedDir.y;


		console.log(this.body.velocity[0], " Velocity 1")
		console.log(this.body.velocity[1], " Velocity 2")


		// this.body.velocity[0] = -5 + Math.random() * 10;
		// this.body.velocity[1] = BallConfig.velocity;
		this.shape.collisionMask = CollisionGroups.SURFACE;
		this.zIndex = 3;

		new Tween(this.shadow).to({ alpha: 0 }, 250).start();


	}

	hasLogged = false;

	update(dt: number) {

		if (this.isComingDown && this.y > BallConfig.resetYPos - 500) {
			this.alpha = 1 - (this.y - (BallConfig.resetYPos - 500)) / 500;
		}

		//console.log("ball direction: \nX: " + Math.floor(this.body.position[0]) + " Y: " +  Math.floor(this.body.position[1]));

		if (!this.hasLogged && this.body.position[1] >= 2000) {
			this.hasLogged = true;

			console.log("OUT OF BOUNDS");
			sendToDB({
				type: "outOfBounds",
				x: Math.floor(this.body.position[0]),
				y: Math.floor(this.body.position[1]),
				velocity: JSON.stringify(this.body.velocity),
				rotation: this.body.angle,
			});
		}

		if (this.isComingDown && this.y > BallConfig.resetYPos) {
			this.isComingDown = false;


			this.resetBall();
		}

		this.x = this.body.position[0] + this.offset.x;
		this.y = this.body.position[1] + this.offset.y;

		this.rotation = this.body.angle;

		if (this.hasThrown) {
			this.currentRadius = (this.y / this.startPos.y) * (BallConfig.radius - BallConfig.minRadius) + BallConfig.minRadius;
			this.shape.radius = this.currentRadius;
			this.shape.updateBoundingRadius();
		}

		// TODO : if ball size powerup is activated
		if (isPowerUpActive("potionBall")) {
			this.shrinkBall();
		} else {
			// BallConfig.shrinkMultiplier = 1;
		}
		//call shrink method

		if (this.maxHeightReached < (1660 - this.y)) {
			this.maxHeightReached = (1660 - this.y);
		}


		if ((this.y < BallConfig.maxY || this.x > 1600 || this.x < 0) && this.hasThrown) {

			this.hasThrown = false;
			this.zIndex = 0;
			this.shape.collisionMask = CollisionGroups.TRIGGER | CollisionGroups.NET;
			this.isComingDown = true;
			// this.body.damping = 0.99;



			setTimeout(() => {
				// this.body.damping = 0.05;
				if (this.shape.collisionMask != CollisionGroups.SURFACE)
					this.body.gravityScale = 12;
			}, 500);
		}

		this.width = this.shape.radius * 2 * this.aspectRatio.x + this.scaleOffset;
		this.height = this.shape.radius * 2 * this.aspectRatio.y + this.scaleOffset;

		if (this.shadow) this.shadow.x = this.x;
	}

	shrinkBall() {


		this.shape.radius = this.currentRadius * BallConfig.shrinkMultiplier;
		this.shape.updateBoundingRadius();
	}

	resetBall() {

		if (this.resetTimeout)
			clearTimeout(this.resetTimeout);

		this.body.sleep();

		this.resetTimeout = setTimeout(() => {
			this.body.wakeUp();
			this.resetTimeout = undefined;
			if (GameData.canThrow)
				this.interactive = true;
		}, 150);


		this.shape.collisionMask = CollisionGroups.SURFACE;
		// this.body.damping = 0.05;
		this.body.gravityScale = BallConfig.gravityScale;

		this.zIndex = 3;

		this.body.velocity = [0, 0];

		console.log("Max Height 🏀 :" + this.maxHeightReached);

		this.maxHeightReached = 0;

		this.body.angularVelocity = 0;
		// this.interactive = true;
		this.body.position = [BallConfig.defaultPos.x, BallConfig.defaultPos.y];

		this.shape.radius = BallConfig.radius;
		this.currentRadius = this.shape.radius;
		this.shape.updateBoundingRadius();

		this.alpha = 1;
		this.width = BallConfig.radius * 2;
		this.height = BallConfig.radius * 2;
		this.shadow.alpha = 1;

		if (this.hasColorBall) {

			this.changeBall(GameData.defaultBallId);
			Globals.emitter?.Call("colorBallReset");
			GameData.additionalScore = 0;
		}

		if (this.hasScored) {
			this.hasScored = false;


			console.log("perfect score : " + this.isPerfectThrow);

			Globals.emitter?.Call("onBallScored", this.isPerfectThrow);


		} else {
			// if (isPowerUpActive("potionBall")) {
			// 	// TODO : Remove this
			// 	this.hasScored = false;
			// 	this.canShrinkBall = true;
			// 	// Globals.emitter?.Call("onBallScored");
			// 	return;
			// }

			// this.isPerfectThrow = false;
			// console.log("perfect score : " + this.isPerfectThrow);

			if (this.currentStreak == 0) {
				Globals.emitter?.Call("showAlertMsg");
			} else if (this.currentStreak > 0) {
				this.currentStreak = 0;
				Globals.emitter?.Call("resetStreak");
			}
		}

		this.isPerfectThrow = false;
		this.hasLogged = false;
	}
}
