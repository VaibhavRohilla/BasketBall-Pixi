import { Body, Box, Material } from "p2";
import { Graphics, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { CollisionGroups, Globals } from "./Globals";
import { convertBodyPositionToPixiPosition } from "./Utilities";



export class Plane extends Graphics
{

    planeShape: Box;
    planeBody: Body;

    constructor(width: number, height: number, x : number, y : number)
    {
        super();


        this.planeShape = new Box({width : width, height : height});
        
        const material = new Material();
        this.planeShape.material = material;

        this.planeShape.collisionGroup = CollisionGroups.SURFACE;
        this.planeShape.collisionMask = CollisionGroups.BALL;
        
        this.planeBody = new Body({position : [x, y], mass : 0});
        this.planeBody.addShape(this.planeShape);
        Globals.App?.world.addBody(this.planeBody);


        // this.beginFill(0xff0000);
        // this.drawRect(-this.planeShape.width/2, -this.planeShape.height/2, this.planeShape.width, this.planeShape.height);
        this.x= this.planeBody.position[0];
        this.y = this.planeBody.position[1];

        console.log("Plane Pos: \n x:", this.x , " y: " ,this.y)
    }


}