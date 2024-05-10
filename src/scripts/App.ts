import { GSSolver, World } from 'p2';
import * as PIXI from 'pixi.js'
import { CalculateScaleFactor } from './appConfig';
import { Globals } from './Globals';
import { Loader } from './Loader';
import { MainScene } from './MainScene';
import { MyEmitter } from './MyEmitter';
import { Scene } from './Scene';
import { SceneManager } from './SceneManager';
import { onResizeFunction } from './HtmlHandler';
import p2 from 'p2';
//import { TestScene } from './TestScene';
// import { Loader } from "./Loader";
// import { SceneManager } from "./SceneManager";
// import { MainScene } from "./MainScene";


export class App {

	app: PIXI.Application;
	world: World;

	isDeviceLandscape!: boolean;

	isDeviceOrientationChanged: boolean = false;

	constructor() {
		// create canvas


		PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;

		this.app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, antialias: true });
		// this.app = new PIXI.Application({width : window.innerWidth, height : window.innerHeight});
		this.isDeviceLandscape = window.innerWidth > window.innerHeight;

		this.checkIfDeviceRotated()
		CalculateScaleFactor();
		this.app.renderer.view.style.width = `${window.innerWidth}px`;
		this.app.renderer.view.style.height = `${window.innerHeight}px`;
		this.app.renderer.resize(window.innerWidth, window.innerHeight);

		this.app.view.oncontextmenu = (e) => {
			e.preventDefault();

		};
		// if (Globals.fpsStats)
		// 	document.body.appendChild(Globals.fpsStats.dom);

		// if (Globals.stats)
		// 	document.body.appendChild(Globals.stats.dom);



		this.app.renderer.view.style.width = `${window.innerWidth}px`;
		this.app.renderer.view.style.height = `${window.innerHeight}px`;
		this.app.renderer.resize(window.innerWidth, window.innerHeight);

		this.app.view.oncontextmenu = (e) => {
			e.preventDefault();
		};



		//Setting Up Window On Resize Callback
		window.onresize = (e) => {
			setTimeout(() => {
				this.checkIfDeviceRotated();

				if (this.isDeviceOrientationChanged) {
					// this.isDeviceOrientationChanged = false;
					document.body.removeChild(this.app.view);
				}

				CalculateScaleFactor();

				this.app.renderer.view.style.width = `${window.innerWidth}px`;
				this.app.renderer.view.style.height = `${window.innerHeight}px`;
				this.app.renderer.resize(window.innerWidth, window.innerHeight);

				SceneManager.instance!.resize();

				if (this.isDeviceOrientationChanged) {
					document.body.append(this.app.view);
					this.isDeviceOrientationChanged = false;
				}
				onResizeFunction();
			}, 50);
		}

		this.world = new World({
			gravity: [0, 100],

			solver: new GSSolver({
				iterations: 200,
				tolerance: 0.02,
			}),
		});


		//Created Emitter
		Globals.emitter = new MyEmitter();

		//Create Scene Manager
		new SceneManager();

		this.app.stage.addChild(SceneManager.instance.container);
		this.app.ticker.add(dt => SceneManager.instance!.update(dt));


		// loader for loading data
		const loaderContainer = new PIXI.Container();
		this.app.stage.addChild(loaderContainer);

		const loader = new Loader(this.app.loader, loaderContainer);


		loader.preload().then(() => {

			loader.preloadSounds(() => {

				setTimeout(() => {
					loaderContainer.destroy();
					// SceneManager.instance!.start(new MainScene());
					SceneManager.instance!.start(new MainScene());
					window.dispatchEvent(new Event('resize'));
				}, 1000);
			});
		});

		this.addInputHandler();
		this.tabChange();
		document.body.appendChild(this.app.view);
	}


	addInputHandler() {

		window.addEventListener("pointerdown", (ev: PointerEvent) => {

			Globals.emitter?.Call("onPointerDown", ev);

		});

	}
	tabChange() {
		document.addEventListener("visibilitychange", event => {
			if (document.visibilityState === "visible") {
				Globals.emitter?.Call("resume", true)
				console.log("tab active");
			} else {
				Globals.emitter?.Call("resume", false)
				console.log("tab inactive");
			}
		})
	}
	checkIfDeviceRotated() {

		console.log("Device Orientation Changed");
		if (navigator) {

			let arr = navigator.userAgent.match("SamsungBrowser")

			if (arr && arr.index != -1) {
				// console.log(" True")
				if (window.innerHeight != oldHeight || window.innerWidth != oldWidth) {
					oldWidth = window.innerWidth;
					oldHeight = window.innerHeight;

					this.isDeviceOrientationChanged = true;

				}
			}
		}

		if (window.innerWidth > window.innerHeight) {
			if (!this.isDeviceLandscape) {
				this.isDeviceLandscape = true;
				this.isDeviceOrientationChanged = true;
			}

			//landscape
		} else {
			if (this.isDeviceLandscape) {
				this.isDeviceLandscape = false;
				this.isDeviceOrientationChanged = true;
			}
			//portrait
		}
	}
}


let oldWidth = window.innerWidth;
let oldHeight = window.innerHeight;
