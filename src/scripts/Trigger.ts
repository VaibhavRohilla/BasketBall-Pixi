import { Body, Box } from "p2";
import { Graphics } from "pixi.js";
import { CollisionGroups, Globals } from "./Globals";



export class Trigger extends Body
{
    shape: Box;
    visual: Graphics;
    constructor(x : number, y : number, width : number, height : number, collisionMask : number)
    {
        super({
            position : [x, y],
            mass : 0,
            type : Body.KINEMATIC,
        });


        this.shape = new Box({width : width, height : height, collisionGroup : CollisionGroups.TRIGGER, collisionMask : collisionMask, sensor : true});
        this.addShape(this.shape);

        this.visual = new Graphics();

        this.on("collision", (event : any) => {

            console.log("collision", event);

            if(event.body.collisionGroup === collisionMask)
            {
                console.log("Collision with trigger", event.body.collisionGroup);
            }
        });

        // this.syncGraphic();
        Globals.App?.world.addBody(this);
    }

    updatePosition(x : number, y : number)
    {
        this.position[0] = x;
        this.position[1] = y;

        // this.syncGraphic();
    }


    syncGraphic()
    {
        this.visual.beginFill(0x00ff00);
        this.visual.drawRect(-this.shape.width/2, -this.shape.height/2, this.shape.width, this.shape.height);
        this.visual.x = this.position[0];
        this.visual.y = this.position[1];
        this.visual.endFill();
    }
}