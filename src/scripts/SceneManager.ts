import * as PIXI from "pixi.js";
import TWEEN from "@tweenjs/tween.js";
import { Globals } from "./Globals";
import { Scene } from "./Scene";
import { Container } from "pixi.js";

export class SceneManager {
	static instance: SceneManager;

	container!: PIXI.Container;
	scene: Scene | null = null;

	constructor() {
		if (SceneManager.instance != undefined) {
			console.log("SceneManager already created!");
			return;
		}

		SceneManager.instance = this;

		this.container = new PIXI.Container();
		this.scene = null;
	}

	start(scene: Scene) {
		if (this.scene) {
			this.scene.destroyScene();
			this.scene = null;
		}

		this.scene = scene;
		this.scene.initScene(this.container);
		// this.container.addChild(this.scene.sceneContainer);

		if (window.orientation == 90 || window.orientation == -90) {
			//orientation
		}
	}

	update(dt: number) {
		TWEEN.update();

		if (this.scene && this.scene.update) {
			this.scene.update(dt);
		}

		// Globals.stats.update();
		// Globals.fpsStats.update();

		// Globals.stats.begin();

		// // monitored code goes here

		// Globals.stats.end();
	}

	resize() {
		if (this.scene) {
			this.scene.resize();
		}
	}

	recievedMessage(msgType: string, msgParams: any) {
		if (this.scene && this.scene.recievedMessage) {
			this.scene.recievedMessage(msgType, msgParams);
		}
	}
}
