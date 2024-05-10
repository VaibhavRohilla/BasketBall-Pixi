import { Quest } from "./quest";
import { ArrOfBalls } from "./QuestsConfig";

type scoreDataType = {
	score: number;
	highScore: number;
	level: number;
	otherScores: { [key: string]: number };
	purchasedBalls: number[];
	balance: number;
	selectedBall: number;
	powerUps: { [key: string]: number };
};

export function SaveQuestsData(quests: { [index: string]: Quest }) {
	// console.log("Saving Data " + JSON.stringify(quests));

	const dataToSave: { [index: string]: any } = {};
	for (let quest in quests) {
		dataToSave[quest] = {};
		dataToSave[quest].claimed = quests[quest].claimed;
		dataToSave[quest].completed = quests[quest].completed;
		dataToSave[quest].isUnlocked = quests[quest].isUnlocked;
	}
    if(dataToSave)
	saveInCookies("quests", JSON.stringify(dataToSave));
	console.log(dataToSave);
	
}


export function LoadQuestsData(): { [index: string]: Quest } {
	const quests = getFromCookies("quests");

	if(!quests)

	console.log("Loaded" + quests);
	if (quests) return JSON.parse(quests);
	else return {};
}

export const ScoreFunctions = {
	setHighScore(score: number) {
		if (score > ScoreData.highScore) {
			ScoreData.highScore = score;
			saveInCookies("highScore", ScoreData.highScore);
			//save in cookies
		}
	},
	getHighscore() {
		const highscore = getFromCookies("highScore");
		if (highscore) {
			return parseInt(highscore);
		} else {
			return 0;
		}
	},
	setScore(score: number) {
		ScoreData.score = score;
	},

	addOtherScore(name: string, score: number) {
		ScoreData.otherScores[name] = score;
		saveInCookies("otherScores", JSON.stringify(ScoreData.otherScores));
	},
	setOtherScore(name: string, score: number) {
		// console.log("Setting score :" + name);

		if (ScoreData.otherScores[name]) {
			ScoreData.otherScores[name] = score;
			saveInCookies("otherScores", JSON.stringify(ScoreData.otherScores));
		} else
			console.log("No score found for " + name);
	},
	getOtherScore(name: string) {
		// console.log("Getting score :" + name);
		// console.log(ScoreData.otherScores);
		if (ScoreData.otherScores[name]) {
			return ScoreData.otherScores[name];
		} else {
			console.log("No score found for " + name);
			return null;
		}
	},
	removeOtherScore(name: string) {
		if (ScoreData.otherScores[name]) {
			delete ScoreData.otherScores[name];
			saveInCookies("other", JSON.stringify(ScoreData.otherScores));
		} else console.log(`Can't remove invalid key : ${name}`);
	},
};

function loadAllOtherScores() {
	const otherScores = getFromCookies("otherScores");
	if (otherScores) {
		return JSON.parse(otherScores);
	} else {
		return {};
	}
}

function loadPurchasedBalls(): number[] {
	const purchasedBalls = getFromCookies("pBalls");

	if (purchasedBalls) {
		return JSON.parse(purchasedBalls);
	} else {
		return [0];
	}
}

function loadBalance(): number {
	const balance = getFromCookies("bal");

	if (balance) {
		return parseInt(balance);
	} else {
		return 1000;
	}
}

function loadPowerUps() {
	const powerups = getFromCookies("powerups");

	if (powerups)
		return JSON.parse(powerups);
	else
		return {};
}

export function getPowerUpData() {
	return ScoreData.powerUps;
}

export function savePowerUpInCookies(data: { [index: string]: number }) {
	ScoreData.powerUps = data;
	saveInCookies("powerups", JSON.stringify(ScoreData.powerUps));
}

 export function saveBallPowerUpInCookies(id : string)
 {
	saveInCookies("ballPowerups", id);
 }

 export function getBallPowerUpInCookies()
 {
	let ballPowerups = getFromCookies("ballPowerups");
	if(ballPowerups)
	  return ballPowerups
	else
	  console.log("the Ball Power Up is Already Empty");
 }

 export function deleteBallPowerUpInCookies()
 {
	let ballPowerups = getFromCookies("ballPowerups");
	if(ballPowerups)
	  saveInCookies("ballPowerups","");
	else
	  console.log("the Ball Power Up is Already Empty");
 }

export function updateBalance(amtToAdd: number) {
	ScoreData.balance += amtToAdd;
	// console.log(ScoreData.balance);

	if (ScoreData.balance < 0) ScoreData.balance = 0;

	saveInCookies("bal", ScoreData.balance);
}

export function getBalance(): number {
	return ScoreData.balance;
}

export function useBall(index: number): boolean {
	if (ScoreData.purchasedBalls.indexOf(index) != -1) {
		ScoreData.selectedBall = index;
		saveInCookies("sBall", ScoreData.selectedBall);
		return true;
	}

	return false;
}

export function getCurrentBall(): number {
	return ScoreData.selectedBall;
}

export function purchaseBall(index: number): boolean {
	if (ScoreData.balance >= ArrOfBalls[index].price) {
		ScoreData.balance -= ArrOfBalls[index].price;

		ScoreData.purchasedBalls.push(index);
		saveInCookies("pBalls", JSON.stringify(ScoreData.purchasedBalls));
		return true;
	}

	console.log("Purchase Fail");

	return false;
}

export function hasBall(index: number): boolean {
	return ScoreData.purchasedBalls.indexOf(index) != -1;
}

function saveInCookies(name: string, value: number | string) {
	const expiryDate = new Date();
	expiryDate.setTime(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
	document.cookie = name + "=" + value + "; expires=" + expiryDate.toUTCString();
}

function getFromCookies(name: string) {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") {
			c = c.substring(1, c.length);
		}
		if (c.indexOf(nameEQ) === 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
}

function deleteFromCookies(name: string) {
	document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
}

const ScoreData: scoreDataType = {
	score: 0,
	highScore: ScoreFunctions.getHighscore(),
	level: 1,
	otherScores: loadAllOtherScores(),
	purchasedBalls: loadPurchasedBalls(),
	balance: loadBalance(),
	selectedBall: parseInt(getFromCookies("sBall") + "") || 0,
	powerUps: loadPowerUps(),
};

console.log(ScoreData);
