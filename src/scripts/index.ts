// require('./que')
import "../styles/style.css";
import "./DbLogger";
import { App } from "./App";
import { Globals } from "./Globals";
import Stats from "stats.js";

import { AllQuests, ArrOfBalls } from "./QuestsConfig";
import * as QUEST from "./quest";
import * as HTMLHANDLER from "./HtmlHandler";
import { LoadQuestsData } from "./DataHandler";

const test = require("./test");

//SpineParser.registerLoaderPlugin();

//Globals.socket = new Socket();

// Globals.fpsStats = new Stats();
// Globals.fpsStats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// Globals.fpsStats.domElement.style.cssText = "position:absolute;top:25px;left:40px;";

// Globals.stats = new Stats();
// Globals.stats.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// Globals.stats.domElement.style.cssText = "position:absolute;top:25px;left: 125px;";

Globals.App = new App();
QUEST.makeQuests();

//Globals.App.addOrientationCheck();

let arrOfBalls = [
	{
		url: require("/src/sprites/ball0.png").default,
		price: undefined,
	},
	{
		url: require("/src/sprites/ball1.png").default,
		price: 100,
	},
	{
		url: require("/src/sprites/ball4.png").default,
		price: 200,
	},
];
for (let i = 0; i < AllQuests.length; i++) {
	QUEST.addQuest(AllQuests[i]);
}

const loadedQuests = LoadQuestsData();

Object.keys(loadedQuests).forEach((key) => {

	console.log(loadedQuests[key].claimed);

	QUEST.getQuest(key).claimed = loadedQuests[key].claimed;
	QUEST.getQuest(key).completed = loadedQuests[key].completed;
	QUEST.getQuest(key).isUnlocked = loadedQuests[key].isUnlocked;

});

HTMLHANDLER.addBallsToGameOverPanel(ArrOfBalls);

test.setCallbackMethod(HTMLHANDLER.showQuestCompletedEffect);

HTMLHANDLER.AssignClaimCallback((questID) => {
	QUEST.getQuest(questID).claim();
});
HTMLHANDLER.addOnBallAssignCallback((index: number) => {
	return false;
});

// console.log(QUEST.getQuest("scorePoints1"));
// QUEST.addBallsToGameOverPanel(arrOfBalls);
test.setCallbackMethod(HTMLHANDLER.showQuestCompletedEffect);

HTMLHANDLER.AssignClaimCallback((questID) => {
	QUEST.getQuest(questID).claim();
});

// HTMLHANDLER.showPanel(0);
