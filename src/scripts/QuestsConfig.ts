import { GameData, Globals, setAdditionalScore, togglePowerUp } from "./Globals";
import { LoaderConfig } from "./LoaderConfig";
import { checkIfClaimed, DIRECTION, Quest, Reward } from "./quest";
export const images = {
	package: require("../sprites/package.png"),
	packageHover: require("../sprites/package-hover.png"),
	ball0: require("../sprites/ball0.png"),
	ball1: require("../sprites/ball1.png"),
	ball2: require("../sprites/ball2.png"),
	ball3: require("../sprites/ball3.png"),
	ball4: require("../sprites/ball4.png"),
	ball5: require("../sprites/ball5.png"),
	ball6: require("../sprites/ball6.png"),
	ball7: require("../sprites/ball7.png"),
	ball8: require("../sprites/ball8.png"),
	ball9: require("../sprites/ball9.png"),
	ball10: require("../sprites/ball10.png"),
	ball11: require("../sprites/ball11.png"),

	biscuit: require("../sprites/golden-biscuit-small.png"),
	arrowLeft: require("../sprites/button-left.png"),
	arrowRight: require("../sprites/button-right.png"),
	helpFullBiscuit: require("../sprites/helpful-biscuit.png"),
	mascotMessage: require("../sprites/message.png"),
};
export const questVar = {
	totalDunkCount: 1,
	totalHighscoreCount: 4,
	totalScoreCount: 4,
	highScore: 100,
	ballDunks: 10,
	scoreCount: 200,
}
export const Rewards: { [id: string]: Reward } = {
	bronzeBall: new Reward(
		"Bronze Ball",
		"bronzeBall",
		"2x score for one shot",
		"Bronze basketballs give you\n+200% score for one shot!\n \n Tap it before your shot to use it.",
		LoaderConfig.bronzeBallItem.default,
		() => {
			setAdditionalScore(2);
			Globals.emitter?.Call("changeBall", 12);
		},
		DIRECTION.RightToLeft
	),

	silverBall: new Reward(
		"Silver Ball",
		"silverBall",
		"3x score for one shot",
		"Silver basketballs give you\n+300% score for one shot!\n \n Tap it before your shot to use it.",
		LoaderConfig.silverBallItem.default,
		() => {
			setAdditionalScore(3);
			Globals.emitter?.Call("changeBall", 13);
		},
		DIRECTION.RightToLeft
	),

	goldenBall: new Reward(
		"Golden Ball",
		"goldenBall",
		"4x score for one shot",
		"Golden basketballs give you\n+400% score for one shot!\n \n Tap it before your shot to use it.",
		LoaderConfig.goldenBallItem.default,
		() => {
			setAdditionalScore(4);
			Globals.emitter?.Call("changeBall", 14);
		},
		DIRECTION.RightToLeft
	),
	potionBall: new Reward(
		"Potion Ball",
		"potionBall",
		"Reduces the Ball size",
		"This potion \n Reduces the Ball Size!\n \n Tap it to use it (valid for 45secs)",
		LoaderConfig.potionBall.default,
		() => {
			togglePowerUp("potionBall", 45);
		},
		DIRECTION.LeftToRight
	),

	potionBisquit: new Reward(
		"Potion Biscuit",
		"potionBisquit",
		"Collect 2x Biscuits",
		"This potion helps you\ncollect +100% more biscuits!\n \n Tap it to use it (valid for 45secs)",
		LoaderConfig.potionBisquit.default,
		() => {
			togglePowerUp("potionBisquit", 45);
		},
		DIRECTION.LeftToRight
	),
	potionHoop: new Reward(
		"Potion Hoop",
		"potionHoop",
		"Increase Hoops Size",
		"This potion helps you\nscore more by increasing hoops size!\n Tap it to use it (valid for 45secs)",
		LoaderConfig.potionHoop.default,
		() => {
			togglePowerUp("potionHoop", 45);
		},
		DIRECTION.LeftToRight
	),
	potionScore: new Reward(
		"Potion Score",
		"potionScore",
		"2x score for one shot",
		"This potion helps you score+200% more for one shot!\n \n Tap it to use it (valid for 45secs)",
		LoaderConfig.potionScore.default,
		() => {
			togglePowerUp("potionScore", 45);
		},
		DIRECTION.LeftToRight
	),
};

export const AllQuests = [
	new Quest(
		"scorePoints1",
		"Score Points",
		"Score 10 points",
		Rewards.bronzeBall,
		1,
		true,
		() => {
			return GameData.lastScore >= 10;
		},
		() => {
			return true;
		},
		() => {
			const maxScore = Math.min(GameData.lastScore, 10);
			return [maxScore, 10];
		}
	),
	new Quest(
		"earnCount1",
		"Earn Biscuits",
		"Earn 3 Biscuits",
		Rewards.goldenBall,

		// Rewards.silverBall,
		1,
		true,
		() => {
			return GameData.biscuitScore >= 3;
		},
		() => {
			return true;
		},
		() => {
			const maxScore = Math.min(GameData.biscuitScore, 3);
			return [maxScore, 3];
		}
	),
	new Quest(
		"scorePoints2",
		"Score Points",
		"Score 50 points",
		Rewards.potionBisquit,
		1,
		false,
		() => {
			return GameData.lastScore >= 50;
		},
		() => {
			return checkIfClaimed("scorePoints1");
		},
		() => {
			const maxScore = Math.min(GameData.lastScore, 50);
			return [maxScore, 50];
		}
	),
	new Quest(
		"totalDunks1",
		"Total Dunks",
		"Score 30 Dunks",
		Rewards.goldenBall,
		1,
		false,
		() => {
			return GameData.totalDunks >= 30;
		},
		() => {
			return checkIfClaimed("scorePoints1");
		},
		() => {
			const maxScore = Math.min(GameData.totalDunks, 30);
			return [maxScore, 30];
		}
	),

	new Quest(
		"highScore1",
		"High Score",
		"Set 5 Highscore",
		Rewards.bronzeBall,
		1,
		true,
		() => {
			return GameData.highScore >= 5;
		},
		() => {
			return true;
		},
		() => {
			const maxScore = Math.min(GameData.highScore, 5);
			return [maxScore, 5];
		}
	),

	new Quest(
		"highScore2",
		"High Score",
		"Set 10 Highscore",
		Rewards.silverBall,
		1,
		false,
		() => {
			return GameData.highScore >= 10;
		},
		() => {
			return checkIfClaimed("highScore1");
		},
		() => {
			const maxScore = Math.min(GameData.highScore, 10);
			return [maxScore, 10];
		}
	),

	new Quest(
		"highScore3",
		"High Score",
		"Set 20 Highscore",
		Rewards.potionHoop,
		1,
		false,
		() => {
			return GameData.highScore >= 20;
		},
		() => {
			return checkIfClaimed("highScore2");
		},
		() => {
			const maxScore = Math.min(GameData.highScore, 20);
			return [maxScore, 20];
		}
	),

	new Quest(
		"highScore4",
		"High Score",
		"Set 50 Highscore",
		Rewards.potionBall,
		1,
		false,
		() => {
			return GameData.highScore >= 50;
		},
		() => {
			return checkIfClaimed("highScore3");
		},
		() => {
			const maxScore = Math.min(GameData.highScore, 50);
			return [maxScore, 50];
		}
	),

	new Quest(
		"scorePoints3",
		"Score Points",
		"Score 60 points",
		Rewards.potionScore,
		1,
		false,
		() => {
			return GameData.lastScore >= 60;
		},
		() => {
			return checkIfClaimed("scorePoints2");
		},
		() => {
			const maxScore = Math.min(GameData.lastScore, 60);
			return [maxScore, 60];
		}
	),


];

export const ArrOfBalls = [
	{
		url: images.ball0.default,
		price: -1,
	},
	{
		url: images.ball1.default,
		price: 100,
	},
	{
		url: images.ball2.default,
		price: 200,
	},
	{
		url: images.ball3.default,
		price: 400,
	},
	{
		url: images.ball4.default,
		price: 600,
	},
	{
		url: images.ball5.default,
		price: 800,
	},
	{
		url: images.ball6.default,
		price: 1000,
	},
	{
		url: images.ball7.default,
		price: 1200,
	},
	{
		url: images.ball8.default,
		price: 1400,
	},
	{
		url: images.ball9.default,
		price: 1600,
	},
	{
		url: images.ball10.default,
		price: 1800,
	},
	{
		url: images.ball11.default,
		price: 2000,
	},
];
