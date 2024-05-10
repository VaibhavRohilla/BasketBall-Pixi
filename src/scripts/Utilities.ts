import { Globals } from "./Globals";
import * as PIXI from 'pixi.js';
import { config } from "./appConfig";
import { DisplayObject } from "pixi.js";


export const getMousePosition = () => Globals.App!.app.renderer.plugins.interaction.mouse.global;

export const utf8_to_b64 = (str : string) => window.btoa(encodeURIComponent(str));

export const clamp = (num : number, min : number, max : number) => Math.min(Math.max(num, min), max);

export const lerp = (oldValue : number, newValue : number, weight : number, dt : number) => oldValue + (oldValue * (1 - weight) + newValue * weight - oldValue) * dt /50;


export const checkIfMouseOver = (component :  DisplayObject) => {
    const rect1 = component.getBounds();
    // console.log(rect1);

    const point = getMousePosition();

    if (rect1.x <= point.x &&
        rect1.x + rect1.width >= point.x &&
        rect1.y <= point.y &&
        rect1.y + rect1.height >= point.y) {
        // Over!
        return true;
    } else {
        // not over
        return false;
    }
};

export const fetchGlobalPosition = (component : DisplayObject) => {
    let point = new PIXI.Point();
    
    component.getGlobalPosition(point, false);
    return point;
};

export const convertBodyPositionToPixiPosition = (position : number[]) => {

    let point = {x : 0, y : 0};
    point.x = (position[0] - config.minLeftX) / config.minScaleFactor;
    point.y = (position[1] - config.minTopY) / config.minScaleFactor;
    return point;
};

export type vector = {
    x : number,
    y : number
}

export function normalizeDirection(direction : {x : number, y : number}) : {x : number, y : number}
{
    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    return { x: direction.x / distance, y: direction.y / distance };
    
}

export function getAngleBetween(vec1 : vector, vec2 : vector) : number
{
    // const firstAngle = Math.atan2(vec1.x, vec2.x);
    // const secondAngle = Math.atan2(vec1.y, vec2.y);

    // let angle = secondAngle - firstAngle;

    // angle = angle * 180 / Math.PI;

    // return angle;

    return Math.atan2(vec2.y - vec1.y, vec2.x - vec1.x) * 180 / Math.PI;
}

export function getAngleRelativeToX(vec : vector) : number
{
    return Math.atan2(vec.y, vec.x);
}

export function toRadians (angle : number) : number {
    return angle * (Math.PI / 180);
}

export function toDegrees (angle : number) {
    return angle * (180 / Math.PI);
  }




// globalThis.logThis = (message, color = null) => {

//     const Style = {
//         base: [
//           "color: #fff",
//           "background-color: #444",
//           "padding: 2px 4px",
//           "border-radius: 2px"
//         ],
//         red: [
//           "color: #eee",
//           "background-color: red"
//         ],
//         green: [
//           "background-color: green"
//         ],
//         blue: [
//             "background-color: #0091F7"
//           ]
//       }



//     let extra = [];

//     if(color != null)
//     {
//         extra = Style[color];
//     }
    
//     let style = Style.base.join(';') + ';';
    
//     style += extra.join(';'); // Add any additional styles
    
//     console.log(`%c${message}`, style);
// };








