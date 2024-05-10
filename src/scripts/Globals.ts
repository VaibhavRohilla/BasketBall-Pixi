import { Howl } from "howler";
import * as PIXI from "pixi.js";
import { App } from "./App";
import { config } from "./appConfig";
import { getCurrentBall, getPowerUpData, savePowerUpInCookies as savePowerupsInCookies } from "./DataHandler";
import { Hoop } from "./Hoop";
import { MyEmitter } from "./MyEmitter";
import { SceneManager } from "./SceneManager";
import { getAngleBetween, getAngleRelativeToX, toDegrees, vector } from "./Utilities";



type globalDataType = {
	resources: PIXI.utils.Dict<PIXI.LoaderResource>;
	emitter: MyEmitter | undefined;
	isMobile: boolean;
	// fpsStats : Stats | undefined,
	soundResources: { [key: string]: Howl };
	App: App | undefined;
};

export const Globals: globalDataType = {
	resources: {},
	emitter: undefined,
	get isMobile() {
		//  return true;
		return PIXI.utils.isMobile.any;
	},
	// fpsStats: undefined,
	soundResources: {},
	App: undefined,
};


export const TestGraphic: PIXI.Graphics = new PIXI.Graphics();


export const CollisionGroups = {
	BALL: 0x0001,
	NET: 0x0002,
	SURFACE: 0x0004,
	TRIGGER: 0x0008,
};

export const GameData = {
	ballType: 0,
	score: 0,
	totalDunks: 0,
	highScore: 0,
	biscuitScore: 0,
	defaultScoreMultiplier: 1,
	scoreMultiplier: 1,
	additionalScore: 0,
	isCollidedWithJoint: false,
	get defaultBallId() {
		return getCurrentBall();
	},
	lastScore: 0,
	canThrow: true,
};

const CurrentlyActivePowerups: { [name: string]: { timer: number; timeout: NodeJS.Timeout | undefined } } = loadPowerUpData();
export const isAnyPotionActivated = () => Object.values(CurrentlyActivePowerups).length > 0;
export let isTimerRunning = false;
export function isPowerUpActive(powerUpName: string): boolean {
	if (CurrentlyActivePowerups[powerUpName]) return true;
	else return false;
}

export function getPowerUpTimer(powerUpName: string): number {

	return CurrentlyActivePowerups[powerUpName].timer;

}


export function togglePowerUp(powerUpName: string, timeOutSecs: number) {

	console.log("Toggle power up called :" + powerUpName);

	if (!CurrentlyActivePowerups[powerUpName]) {
		console.log("Toggling Powerup " + powerUpName);

		CurrentlyActivePowerups[powerUpName] = { timer: timeOutSecs, timeout: undefined };

		powerUpTimeOut(powerUpName);
		Globals.emitter?.Call("onPowerUpActivated", powerUpName);
	}
}

function powerUpTimeOut(powerUpName: string) {
	CurrentlyActivePowerups[powerUpName].timeout = undefined;
	console.log("powerup timer activating")
	if (CurrentlyActivePowerups[powerUpName].timer <= 0) {
		delete CurrentlyActivePowerups[powerUpName];
		Globals.emitter?.Call("onPowerUpTimerEnd", powerUpName);

		savePowerupData();

		if (!isAnyPotionActivated()) {
			isTimerRunning = false;
		}
		//Todo : Implement it in Main Scene
		return;
	}


	if (!CurrentlyActivePowerups[powerUpName].timeout) {

		CurrentlyActivePowerups[powerUpName].timer--;
		isTimerRunning = true;

		savePowerupData();

		CurrentlyActivePowerups[powerUpName].timeout = setTimeout(() => {
			powerUpTimeOut(powerUpName);
		}, 1000);
	}
}

function savePowerupData() {
	//TODO : save CurrentlyActivePowerUp to cookie

	const saveData: { [index: string]: number } = {};

	for (let pName in CurrentlyActivePowerups) {
		saveData[pName] = CurrentlyActivePowerups[pName].timer;
	}

	savePowerupsInCookies(saveData);

}

function loadPowerUpData() {
	const loadedData = getPowerUpData();

	const data: { [name: string]: { timer: number; timeout: NodeJS.Timeout | undefined } } = {};

	for (let key in loadedData) {
		data[key] = { timer: loadedData[key], timeout: undefined };
	}


	return data;
}

export function PauseAllPowerup() {
	for (let id in CurrentlyActivePowerups) {
		if (CurrentlyActivePowerups[id].timeout) {
			clearTimeout(CurrentlyActivePowerups[id].timeout);
			CurrentlyActivePowerups[id].timeout = undefined;
		}
	}
	isTimerRunning = false;
	savePowerupData();
}

export function ResumeAllPowerup() {
	for (let id in CurrentlyActivePowerups) {

		if (!CurrentlyActivePowerups[id].timeout) {
			powerUpTimeOut(id);
			isTimerRunning = true;
		}
	}

}

// let coinMultiplierTimeout : NodeJS.Timeout | undefined = undefined;

export function setAdditionalScore(val: number) {
	GameData.additionalScore = val;
}



export const aimTracker = {
	helpWeight: 0.7,//TODO : CHANGED HELP WIEGHT FOR TESTING FROM 0.7
	leftSideAngle: 0,
	rightSideAngle: 0,
	angle: 0,
	defaultBallPosition: { x: config.logicalWidth / 2, y: 1660.01318359375 },
	isHoopAtLeftSide: false,
	recalculateAngles(hoop: Hoop) {

		this.isHoopAtLeftSide = hoop.x <= this.defaultBallPosition.x;

		const targetPoint = { x: Math.abs(this.defaultBallPosition.x - hoop.x), y: -(this.defaultBallPosition.y - hoop.y) };


		// if(targetPoint.x == 0)
		// {
		// 	this.angle = 90;
		// 	this.rightSideAngle = 85;
		// 	this.leftSideAngle = 95;

		// 	console.log("🏀" , this.leftSideAngle, this.angle, this.rightSideAngle);

		// 	return;
		// }
		console.log(hoop.wireWidth / 2);
		const minPoint = { x: targetPoint.x - hoop.wireWidth / 2, y: targetPoint.y };
		const maxPoint = { x: targetPoint.x + hoop.wireWidth / 2, y: targetPoint.y }

		let initialX = 0;

		if (minPoint.x < 0) {
			const addData = Math.abs(minPoint.x);
			initialX += addData;
			targetPoint.x += addData;
			maxPoint.x += addData;
			minPoint.x += addData;
		}


		console.log(targetPoint);
		console.log(minPoint);
		console.log(maxPoint);

		this.angle = 90 - toDegrees(this.calculateAngleToFireInRadians(targetPoint, initialX))
		this.leftSideAngle = 180 - toDegrees(this.calculateAngleToFireInRadians(maxPoint, initialX))
		this.rightSideAngle = 0 - toDegrees(this.calculateAngleToFireInRadians(minPoint, initialX))




		if (hoop.x > this.defaultBallPosition.x) {
			this.angle = 180 - this.angle;

			this.rightSideAngle = 180 - this.rightSideAngle;
			this.leftSideAngle = 180 - this.leftSideAngle;

			console.log(this.angle);

		}



		console.log("🏀", this.leftSideAngle, this.angle, this.rightSideAngle);

		// TestGraphic.clear();
		// console.log("Cleared")
		// TestGraphic.beginFill(0xff0000, 1);
		// TestGraphic.drawCircle(this.defaultBallPosition.x -  targetPoint.x, this.defaultBallPosition.y + targetPoint.y, 20);
		// TestGraphic.endFill();

		// TestGraphic.beginFill(0xff0000, 1);
		// TestGraphic.drawCircle(this.defaultBallPosition.x -  minPoint.x, this.defaultBallPosition.y + minPoint.y, 20);
		// TestGraphic.endFill();

		// TestGraphic.beginFill(0xff0000, 1);
		// TestGraphic.drawCircle(this.defaultBallPosition.x -  maxPoint.x, this.defaultBallPosition.y + maxPoint.y, 20);
		// TestGraphic.endFill();

	},
	calculateAngleToFireInRadians(endPosition: vector, initialX: number = 0): number {
		const initialVelocity = 1600; //Move somewhere else from here
		const gravity = 874.5;

		endPosition.x = endPosition.x - initialX;

		const phi = Math.atan(endPosition.x / endPosition.y);

		const eq = (gravity * (endPosition.x * endPosition.x)) / (initialVelocity * initialVelocity);

		const firstSol = Math.acos((eq - endPosition.y) / Math.sqrt((endPosition.y * endPosition.y) + (endPosition.x * endPosition.x)));

		const resultedAngle = (firstSol + phi) / 2;

		return resultedAngle;

	}

}

export function nFormatter(num: number) {
	if (num >= 1000000000) {
		return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
	}
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
	}
	return num;
}
