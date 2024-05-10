import { Easing, Tween } from "@tweenjs/tween.js";
import { Body, Box, Circle, ContactMaterial, DistanceConstraint, LinearSpring, Material, Particle, RotationalSpring, World } from "p2";
import { join } from "path";
import { Graphics, LINE_CAP, LINE_JOIN, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { CollisionGroups, Globals, isPowerUpActive, isTimerRunning } from "./Globals";
import { lerp } from "./Utilities";



const initialConfig = {
    threadDamping : 0.99,
    knotDamping : 0.99,
}


const hoopConfig = {
    threadWidth : 12,
    threadHeight : 60,
    threadAmount : 4,
    threadDamping : 0.6,
    threadGravityScale : 10,
    threadColor : 0xffffff,

    knotDamping : 0.5,

    wireColor : 0xff6c00,
    defaultWireWidth : 330,
    increasedWireWidth : 430,
    lerpWeight : 0.15,


};


export class Hoop
{

    bg : Sprite;

    wireWidth = hoopConfig.defaultWireWidth;
    wireNewWidth = hoopConfig.defaultWireWidth;
    wireHeight = 25;

    x : number;
    y = 0;
    newX : number;
    newY : number ;


    jointRadius = 20;
    rotationalSpring: any;
    jointLeft: Body;
    jointRight: Body;
    knotLeft: Body;
    knotRight: Body;
    netLeft: any[];
    netRight: any;

    ctx : Graphics = new Graphics();
    hoopVisual : Sprite;
    // hoopGraphic = new Graphics();
    knotLinks: any[];

    updateThreadDamping! : () => void;
    updateKnotDamping! : () => void;
    
    
    constructor(contactMat : Material)
    {
        this.x = config.logicalWidth/2;
        this.y = 700;

        this.newX = this.x;
        this.newY = this.y;


        //hoopBg
        this.bg = new Sprite(Globals.resources.hoopBackground.texture);
        this.bg.anchor.set(0.5);
        this.bg.x = config.logicalWidth/2;
        this.bg.y = config.logicalHeight/2;
        this.bg.scale.set(1.5);



        this.hoopVisual = new Sprite(Globals.resources.hoop.texture);
        this.hoopVisual.anchor.set(0.5);


        // Create the main frame of the hoop
        // The joints will hold the whole net

        // Left part of the  net
        this.netLeft = [];
        this.jointLeft = this.createJoint(this.jointLeftX(), contactMat);
        this.createNetShapes (this.netLeft, this.jointLeft, this.jointLeftX());

        // Right part of the  net
        this.netRight = [];
        this.jointRight = this.createJoint (this.jointRightX (), contactMat);
        this.createNetShapes(this.netRight, this.jointRight, this.jointRightX ());

        // Reconcile the left and right thread more and more
        // In other word create the visual belt on the net
        let belt = new LinearSpring(this.netLeft[2], this.netRight[2], { restLength : this.wireWidth * 0.2, stiffness : 10 });
        Globals.App?.world.addSpring(belt);

        // Create the knot in the net
        
        this.knotLeft = new Body ({ mass : 0, position : [this.jointLeft.position[0] * 2/3 + this.jointRight.position[0] * 1 / 3, this.y] });
        this.knotLeft.damping = initialConfig.knotDamping;
        this.knotLeft.angularDamping = initialConfig.knotDamping;
        this.knotLeft.addShape (new Particle ({collisionGroup : CollisionGroups.NET, collisionMask : CollisionGroups.BALL}));
        this.knotLeft.shapes[0].sensor = true;
        Globals.App?.world.addBody (this.knotLeft);

        this.knotRight = new Body ({ mass : 0, position : [this.jointRight.position[0] * 2/3 + this.jointLeft.position[0] * 1 / 3, this.y] });
        this.knotRight.damping = initialConfig.knotDamping;
        this.knotRight.angularDamping = initialConfig.knotDamping;
        this.knotRight.addShape (new Particle ({collisionGroup : CollisionGroups.NET, collisionMask : CollisionGroups.BALL}));
        this.knotRight.shapes[0].sensor = true;
        Globals.App?.world.addBody (this.knotRight);
        
        const knots : any[]= [];
        
        const knotPositions =[
            726.9354858398438,
            773.1709594726562,
            726.9760131835938,
            773.3984375,
            772.7177124023438,
            814.5097045898438,
            814.7067260742188,
            851.359375,
            880.23779296875,
            880.4865112304688,
            899.147216796875
        ];

        for (let i = 1 ; i < 12 ; i++) {

            // console.log(knotPositions[i-1]);
            const knot = new Body ({ mass : 1, position : [(this.jointLeftX () + this.jointRightX ()) / 2, knotPositions[i-1]] });
            knot.damping = initialConfig.knotDamping;
            knot.angularDamping = initialConfig.knotDamping;
            const knotShape = new Particle ();
            knotShape.collisionGroup = CollisionGroups.NET;
            knotShape.collisionMask = CollisionGroups.BALL;
            knotShape.sensor = true;
            knot.addShape (knotShape);
            Globals.App?.world.addBody (knot);
            knots[i] = knot;


            

        }


        // setTimeout(() => {
        //     const knotPositions : any[] = [];
        //     knots.forEach((knot) => {
        //         // const position = [knot.position[0], knot.position[1]];
        //         knotPositions.push(knot.position[1]);
        //     });

        //     console.log(knotPositions);
        // }, 5000);

        this.updateKnotDamping = () => {
            this.knotLeft.damping = hoopConfig.knotDamping;
            this.knotRight.damping = hoopConfig.knotDamping;
            this.knotLeft.angularDamping = hoopConfig.knotDamping;
            this.knotRight.angularDamping = hoopConfig.knotDamping;

            for (let i = 1 ; i < knots.length ; i++) {
                const knot = knots[i];
                knot.damping = hoopConfig.knotDamping;
                knot.angularDamping = hoopConfig.knotDamping;
            }

        };
                        
        this.knotLinks = [];
        this.knotLinks.push ([this.knotLeft,    knots[1]]);
        this.knotLinks.push ([this.knotRight,   knots[3]]);
        this.knotLinks.push ([this.netLeft[0],  knots[2]]);
        this.knotLinks.push ([this.netLeft[1],  knots[2]]);
        this.knotLinks.push ([knots[2],    knots[1]]);
        this.knotLinks.push ([knots[1],    knots[5]]);
        this.knotLinks.push ([knots[3],    knots[5]]);
        this.knotLinks.push ([knots[3],    knots[4]]);
        this.knotLinks.push ([this.netRight[0], knots[4]]);
        this.knotLinks.push ([this.netRight[1], knots[4]]);
        this.knotLinks.push ([this.netLeft[2], knots[6]]);
        this.knotLinks.push ([knots[2],    knots[6]]);
        this.knotLinks.push ([knots[5],    knots[6]]);
        this.knotLinks.push ([knots[8],    knots[6]]);
        this.knotLinks.push ([this.netRight[2], knots[7]]);
        this.knotLinks.push ([knots[4],    knots[7]]);
        this.knotLinks.push ([knots[5],    knots[7]]);
        this.knotLinks.push ([knots[8],    knots[7]]);
        this.knotLinks.push ([this.netLeft[2],  knots[9]]);
        this.knotLinks.push ([this.netLeft[3],  knots[9]]);
        this.knotLinks.push ([knots[8],    knots[9]]);
        this.knotLinks.push ([knots[11],   knots[9]]);
        this.knotLinks.push ([this.netRight[2], knots[10]]);
        this.knotLinks.push ([this.netRight[3], knots[10]]);
        this.knotLinks.push ([knots[8],    knots[10]]);
        this.knotLinks.push ([knots[11],   knots[10]]);

        for (let i = 0 ; i < this.knotLinks.length ; i++) {

            Globals.App?.world.addSpring (new LinearSpring (this.knotLinks[i][0], this.knotLinks[i][1], {
                restLength : (i < 2) ? (this.wireWidth * 0.05) : (this.wireWidth * 0.1),
                stiffness : (i < 2) ? 50 : 10
            }));
        }

        this.ctx.zIndex = 1;
        this.hoopVisual.zIndex = 2;
    }

    // Used when the screen is resized
    // resize() 
    // {
    //     // this.newX = window.innerWidth/2;
    //     // this.newY = window.innerHeight/4;

    //     this.x = window.innerWidth/2;
    //     this.y = window.innerHeight/4;
    // }



    jointLeftX () {
        return this.x - this.wireWidth / 2; + this.jointRadius;
    }

    jointRightX () {
        return this.x + this.wireWidth / 2; - this.jointRadius;
    }

    // Each part of the net (left and right) are mainly composed of N threads
    createNetShapes (net : any[], joint : Body, jointX : number) {

        let parent : any = undefined;

        for (let i = 0 ; i < hoopConfig.threadAmount ; i++) {

            const threadShape = new Box ({ width: hoopConfig.threadWidth, height: hoopConfig.threadHeight });
            threadShape.collisionGroup = CollisionGroups.NET;
            threadShape.collisionMask = CollisionGroups.BALL;
            const thread = new Body ({
                mass: 1,
                position: [jointX, this.y + (i + 0.5) * hoopConfig.threadHeight ]
            });

            thread.damping = initialConfig.threadDamping;
            thread.angularDamping = initialConfig.threadDamping;

            

            this.updateThreadDamping = () => {
                thread.damping = hoopConfig.threadDamping;
                thread.angularDamping = hoopConfig.threadDamping;
            };



            thread.gravityScale = hoopConfig.threadGravityScale;
            thread.addShape (threadShape);
            Globals.App?.world.addBody (thread);

            // Bind the thread to the hoop joint
            let bind = undefined;
            const thread2 = (i === 0  && parent == undefined) ? joint : parent;
            const threadHeight2 = (i === 0) ? this.jointRadius : (hoopConfig.threadHeight / 2);

            
            // if(thread2 != undefined)
            // {
                // console.log("Thread Created");
                // console.log(thread2)
                const rotationalSpring = new RotationalSpring (thread2, thread, {
                    stiffness : 50,
                    damping: 0.01
                });

                Globals.App?.world.addSpring (rotationalSpring);
    
                bind = new DistanceConstraint (thread2, thread, {
                    distance: threadHeight2 + hoopConfig.threadHeight /2,
                    collideConnected : false
                });

                Globals.App?.world.addConstraint (bind);
            // }
            

            /*
            bind = new p2.RevoluteConstraint (thread2, thread, {
                localPivotA: [0, threadHeight2],
                localPivotB: [0, -threadHeight / 2],
            });
            */

            parent = thread;
            net.push (thread);
        }
    };

    createJoint (jointX : number, contactMat : Material) {

        // console.log("Creating Joint");
        const jointShape = new Circle ({ radius: this.jointRadius, collisionGroup : CollisionGroups.NET, collisionMask : CollisionGroups.BALL });
        const joint : any= new Body ({ mass: 0, position: [jointX, this.y] });
joint.isJoint = true;
    
        joint.addShape (jointShape);

        // Force restitution to generate the bounce
        jointShape.material = new Material();
        // console.log(jointShape.material);
        // console.log(contactMat)
        Globals.App?.world.addContactMaterial (new ContactMaterial (jointShape.material, contactMat, {
            restitution : 0.5,
            stiffness : Number.MAX_VALUE
        }));

        Globals.App?.world.addBody (joint);
        return joint;
    };


    isUpdatingPosition = false;

    updatePosition(x : number | undefined, y : number | undefined)
    {

        if(this.isUpdatingPosition)
            return;

        const endPos = {x : x != undefined ? x : this.x, y : y != undefined ? y : this.y};

        // if(x != undefined)
        //     this.newX = x;

        // if(y != undefined)
        //     this.newY = y;


        
        this.isUpdatingPosition = true;
        
        new Tween(this).to(endPos, 1250).easing(Easing.Circular.Out).onComplete(() => {
            Globals.emitter?.Call("hoopPositionChanged");
            this.isUpdatingPosition = false;
        }).start();


        const bgEndPos = {x : endPos.x , y : endPos.y + 260};

        new Tween(this.bg).to(bgEndPos, 1250).easing(Easing.Circular.Out).start();
        

        // this.resize();
    }

    updateWidth(scale : number) {
        this.wireNewWidth = hoopConfig.defaultWireWidth * scale;
    };




    
   

    update(dt : number) {


        if(isPowerUpActive("potionHoop") && isTimerRunning)
        {
            this.wireNewWidth = hoopConfig.increasedWireWidth;
        } else
        {
            this.wireNewWidth = hoopConfig.defaultWireWidth
        }
    
        // Update the loop position
        // this.x = lerp(this.x, this.newX, hoopConfig.lerpWeight, dt);
        // this.y = lerp (this.y, this.newY, hoopConfig.lerpWeight, dt);
        // this.bg.x = lerp(this.x, this.newX, hoopConfig.lerpWeight, dt);
        // this.bg.y = lerp(this.y, this.newY, hoopConfig.lerpWeight, dt) + 260;


        
        this.wireWidth = lerp (this.wireWidth,this.wireNewWidth,hoopConfig.lerpWeight, dt);

        this.jointLeft.position[0] = this.jointLeftX ();
        this.jointLeft.position[1] = this.y;

        this.jointRight.position[0] = this.jointRightX ();
        this.jointRight.position[1] =this.y;
        
        this.knotLeft.position[0] = this.jointLeft.position[0] * 2/3 + this.jointRight.position[0] * 1 / 3;
        this.knotLeft.position[1] = this.y;

        this.knotRight.position[0] = this.jointRight.position[0] * 2/3 + this.jointLeft.position[0] * 1 / 3;
        this.knotRight.position[1] = this.y;

        this.netLeft[0].position[0] += dt / 10;
    };

    renderJoint (joint : Body) {

        const x = joint.position[0];
        const y = joint.position[1];



        this.ctx.beginFill(0, 0);


        this.ctx.arc(x, y, this.jointRadius * 2 * config.minScaleFactor, 0, 2 * Math.PI);

        this.ctx.endFill();
    };

    renderKnots () {

        this.ctx.beginFill (0, 0);

        this.ctx.lineStyle({
            width : hoopConfig.threadWidth / 2,
            color : hoopConfig.threadColor,
            join : LINE_JOIN.ROUND,
            cap : LINE_CAP.ROUND
        });

        for (let i = 0 ; i < this.knotLinks.length ; i++) {

            const k1 = this.knotLinks[i][0];
            const k2 = this.knotLinks[i][1];

            this.ctx.moveTo (k1.position[0], k1.position[1]);
            this.ctx.lineTo (k2.position[0], k2.position[1]);
        }


        // this.ctx.stroke ();
    };

    renderThread (joint : Body, threads : any[]) {

        this.ctx.beginFill (0, 0);

        
        this.ctx.moveTo (joint.position[0], joint.position[1]);
        for (let i = 0 ; i < threads.length ; i++)
            this.ctx.lineTo (threads[i].position[0], threads[i].position[1]);
        
        this.ctx.endFill();
        // this.ctx.stroke ();
    };

    render() {

        this.ctx.clear();

        
        // this.ctx.line.join = LINE_JOIN.ROUND;
        // this.ctx.line.cap = LINE_CAP.ROUND;
        
        // Render the main framework net part (left and right threads)
        this.ctx.lineStyle({
            width : hoopConfig.threadWidth,
            color : hoopConfig.threadColor,
            join : LINE_JOIN.ROUND,
            cap : LINE_CAP.ROUND
        });
        // this.ctx.strokeStyle = threadColor;
        // this.ctx.lineWidth = threadWidth;

        this.renderThread(this.jointLeft, this.netLeft);
        this.renderThread (this.jointRight, this.netRight);

        this.renderKnots ();

        // this.renderJoint(this.jointLeft);
        // this.renderJoint(this.jointRight);


        // Render the metal wire hoop

        this.hoopVisual.x = this.x;
        this.hoopVisual.y = this.y;
        this.hoopVisual.width = this.wireWidth + 15;
        this.hoopVisual.height = this.wireHeight;
        // this.ctx.strokeStyle = wireColor;
        // this.ctx.lineWidth = wireHeight;
        
        // this.ctx.lineStyle({
        //     width : this.wireHeight,
        //     color : hoopConfig.wireColor,
        //     join : LINE_JOIN.ROUND,
        //     cap : LINE_CAP.ROUND
        // });

        // this.ctx.beginFill (0, 0);
        // this.ctx.moveTo ((this.x - this.wireWidth / 2), this.y);
        // this.ctx.lineTo ((this.x + this.wireWidth / 2), this.y);
        // this.ctx.endFill();
        // this.ctx.stroke ();
    };
}