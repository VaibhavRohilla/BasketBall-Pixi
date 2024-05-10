import { Graphics } from "pixi.js";
import { getCurrentBall, hasBall, purchaseBall, useBall } from "./DataHandler";
import { DIRECTION, getQuest, Quest } from "./quest";
import { AllQuests, ArrOfBalls, images, Rewards } from "./QuestsConfig";
import { Globals } from "./Globals";


const width = 720;
const height = 1280;


let scaleFactor = Math.min(
    window.innerWidth / width,
    window.innerHeight / height,
);




let otherScaleFactor = Math.min(
    window.innerWidth / height,
    window.innerHeight / width,
);

const rootNode = document.querySelector(':root') as HTMLElement;

if (rootNode) {
    rootNode.style.setProperty('--scaleValue', otherScaleFactor.toString());
    rootNode.style.setProperty('--widthInPx', window.innerWidth + "px");
    rootNode.style.setProperty('--heightInPx', window.innerHeight + "px");

}



const parentDiv = document.getElementById("parentDiv");

if (parentDiv)
    parentDiv.style.transform = `scale(${scaleFactor})`;


export function onResizeFunction() {
    scaleFactor = Math.min(
        window.innerWidth / width,
        window.innerHeight / height,
    );


    if (parentDiv)
        parentDiv.style.transform = `scale(${scaleFactor})`;



    let otherScaleFactor = Math.min(
        window.innerWidth / height,
        window.innerHeight / width,
    );


    if (rootNode) {
        rootNode.style.setProperty('--scaleValue', otherScaleFactor.toString());
        rootNode.style.setProperty('--widthInPx', window.innerWidth + "px");
        rootNode.style.setProperty('--heightInPx', window.innerHeight + "px");

    }
}



let isMascotVisible = false;
let isCBtnActive = false;


const continueBtn = document.getElementById("continueBtn");

if (continueBtn)
    continueBtn.addEventListener("click", () => {

        if (isMascotVisible || !isCBtnActive)
            return;

        removeAllQuestsFromDiv();
        showPanel(0);
    });


function toggleContinueBtn(value: boolean) {
    // console.log("Toggle ", value, isCBtnActive);
    if (isCBtnActive != value) {
        isCBtnActive = value;

        if (continueBtn) {

            continueBtn.classList.remove(isCBtnActive ? "deactiveBtn" : "activeBtn");
            continueBtn.classList.add(!isCBtnActive ? "deactiveBtn" : "activeBtn");

            // console.log(continueBtn.classList);
        }


    }
}


toggleContinueBtn(true);



const playBtn = document.getElementById("playBtn");
let onPlayCallback: (() => void) | undefined = undefined;
let useBallCallback: ((index: number) => void) | undefined = undefined;
// let nextBtn = document.getElementById("nextBtn");





createArrowButtons();

initializeMascot();

function createArrowButtons() {
    const nextBtn = document.getElementById("nextBtn") as HTMLImageElement;

    if (nextBtn) {
        nextBtn.src = images.arrowRight.default;
        nextBtn.className = "arrowBtn next";
        nextBtn.addEventListener("click", () => {
            plusSlides(1)
        });

    }

    const prevBtn = document.getElementById("prevBtn") as HTMLImageElement;

    if (prevBtn) {
        prevBtn.src = images.arrowLeft.default;
        prevBtn.className = "arrowBtn prev";
        prevBtn.addEventListener("click", () => {
            plusSlides(-1)
        });
    }

}

function initializeMascot() {
    const mascotImg = document.querySelector("#mascot img") as HTMLImageElement

    mascotImg.src = images.helpFullBiscuit.default;

    const mascotMsgDiv = document.querySelector("#mascotMsgDiv") as HTMLDivElement;
    mascotMsgDiv.style.backgroundImage = `url(${images.mascotMessage.default})`;


    const mascotDiv = document.querySelector("#mascotDiv") as HTMLDivElement;

    mascotDiv.addEventListener("click", () => {
        removeMascot();
    });
}


export function callMascot(msg: string) {
    if (isMascotVisible)
        return;

    isMascotVisible = true;

    const mascotDiv = document.querySelector("#mascotDiv") as HTMLDivElement;
    mascotDiv.style.display = "block";

    const mascot = document.querySelector("#mascot") as HTMLDivElement

    mascot.className = "slide-in-elliptic-right-fwd";


    const mascotMsg = document.querySelector("#mascotMsg") as HTMLParagraphElement;

    Globals.emitter?.Call("Mask Mascot", true);

    setTimeout(() => {
        const mascotMsgDiv = document.querySelector("#mascotMsgDiv") as HTMLDivElement;
        mascotMsgDiv.style.display = "block";

        let src = images.mascotMessage.default;
        let img = new Image();
        img.addEventListener('load', function () {
            console.log("Preload Imaged");
            const mascotMsgDiv = document.querySelector("#mascotMsgDiv") as HTMLDivElement;
            mascotMsgDiv.style.backgroundImage = `url(${src})`;
            mascotMsg.innerText = msg;
        });
        img.src = src;
        // Globals.emitter?.Call("Mask Mascot", true);

        toggleContinueBtn(true);

        setTimeout(() => {
            removeMascot();
        }, 5000)

    }, 1000);

    // mascotMsg.innerText = "Bronze basketballs give you\n+50% score for one shot!\n \n Tap it before your shot to use it.";
}


export function removeMascot() {
    if (!isMascotVisible)
        return;

    isMascotVisible = false;
    const mascotDiv = document.querySelector("#mascotDiv") as HTMLDivElement;
    mascotDiv.style.display = "none";

    const mascot = document.querySelector("#mascot") as HTMLDivElement
    mascot.className = "";

    const mascotMsgDiv = document.querySelector("#mascotMsgDiv") as HTMLDivElement;
    mascotMsgDiv.style.display = "none";
    Globals.emitter?.Call("Mask Mascot", false);

}


export function addOnPlayCallback(callBack: () => void) {
    onPlayCallback = callBack;
}


let onBallSlideOutCallback: ((questID: string, rewardID: string) => void) | undefined = undefined;

export function addOnBallSlideOutCallback(callback: (questID: string, rewardID: string) => void) {
    onBallSlideOutCallback = callback;
}


export function addOnBallAssignCallback(callback: (index: number) => void) {
    useBallCallback = callback;
}



if (playBtn)
    playBtn.addEventListener("click", () => {
        if (onPlayCallback) {
            onPlayCallback();
        }

        if (useBallCallback)
            useBallCallback(slideIndex);
        showPanel(-1);
    });

function removeAllQuestsFromDiv() {
    const container = document.getElementById('cardParents');

    if (container)
        container.innerHTML = "";


}
// <div class="progress-styled" ><progress max = "100" value="${maxAndCurrent*100}"></progress></div>

function createAndAddQuestDiv(questId: string, nameOfQuest: string, rewardID: string, currentProgression: number, maxProgression: number) {
    const container = document.getElementById('cardParents');


    if (container == null)
        return;

    let maxAndCurrent = currentProgression / maxProgression;

    let classToAdd = maxAndCurrent >= 1 ? "questCardCompleted" : "questCard";
    let prizeBoxAnimationClass = maxAndCurrent >= 1 ? "pulse" : "";
    maxAndCurrent = Math.min(1, maxAndCurrent);
    createKeyFrame(questId, (maxAndCurrent * 100).toString() + "%");

    const onClick = prizeBoxAnimationClass.length > 0 ? `onClick="callMethod('${questId}', '${rewardID}');"` : "";

    let firstString = `<div class="questCardField ${classToAdd} ${questId + "class"}">
    <div class="questData">
        <div class="text-sm"><p class="card_text">${nameOfQuest}</p></div>
        
        <div class="progress">
        <div class="progress-value" id="${questId}" style="animation: ${questId} 3s normal forwards" ></div>
            <span>${currentProgression}/${maxProgression}</span>
        </div>
    </div>

    <div class="questImg">            
        <div class="prizeBox ${questId + "btn"} ${prizeBoxAnimationClass.length > 0 ? "activePrizeBox" : ""}" ${onClick}>
            <img  draggable="false" src="${images.package.default}"  class="img-2 ${prizeBoxAnimationClass} background" > 
            <img  draggable="false" src="${images.packageHover.default}"  class="${prizeBoxAnimationClass} background hoverBtn" />  
        </div>
    </div>

    </div>
    
    <div class="questCardField questCard ${questId + "class"}" style="display:none;">
        <div class="questData">
            <div class="text-bg">
                <p class="card_text">${nameOfQuest}</p>
            </div>
            
            <div class="subheading">
                <p class="card_text">${Rewards[rewardID].description}</p>
            </div>
        </div>

        <div class="questImg">            
            <div class="prizeBox">
                <img draggable="false" src="${Rewards[rewardID].rewardImgURL}"  class="reward-img reward-effect" id="${rewardID + questId}" > 
            </div>
        </div>
    </div>
    
    `;

    firstString += "</div>"

    container.innerHTML += firstString;

    if (prizeBoxAnimationClass.length > 0) {
        // console.log("Assiging for " + questId);
        // // document.getElementById(questId+"btn")?

        // const elemnt = document.getElementsByClassName(questId+"btn");
        // elemnt[0]?.addEventListener("click", () => {
        //     console.log("QUEST ID " + questId);
        //     showQuestCompletedEffect(questId, rewardID);
        // });
    }
}

let claimCallback: ((questID: string) => void) | undefined = undefined;

export function AssignClaimCallback(callback: (questID: string) => void) {
    claimCallback = callback;
}


export function showQuestCompletedEffect(questID: string, rewardID: string) {

    const elementsToDelete = Array.from(document.getElementsByClassName(questID + "class") as HTMLCollectionOf<HTMLElement>);

    toggleContinueBtn(false);



    if (elementsToDelete.length > 1) {
        elementsToDelete[0].style.display = "none";
        elementsToDelete[1].style.display = "block";
    }

    setTimeout(() => {
        createSlideOutImageEffect(questID, rewardID);
    }, 1000);

    if (claimCallback)
        claimCallback(questID);
    // getQuest()
}


function createSlideOutImageEffect(questID: string, rewardID: string) {
    const element = document.getElementById(rewardID + questID) as HTMLImageElement;
    if (!element)
        return;


    const elementPosition = element?.getBoundingClientRect();


    const newElement = document.createElement("img");
    newElement.src = element.src;
    newElement.style.position = "fixed";
    newElement.style.overflow = "hidden";
    newElement.style.zIndex = "10";

    const isWidthMin = Math.min(newElement.width, newElement.height);
    const aspectRatio = Math.max(newElement.width, newElement.height) / Math.min(newElement.width, newElement.height);




    if (elementPosition) {
        newElement.style.top = elementPosition.top.toString() + "px";
        newElement.style.left = elementPosition.left.toString() + "px";

        newElement.style.bottom = elementPosition.bottom.toString() + "px";
        newElement.style.right = elementPosition.right.toString() + "px";



        newElement.style.width = elementPosition.width / scaleFactor + "px";

    }
    // newElement.className = "slide-out-blurred-br";


    if (Rewards[rewardID].collectEffectDirection == DIRECTION.RightToLeft)
        newElement.className = "slide-out-elliptic-right-bck";
    else if (Rewards[rewardID].collectEffectDirection == DIRECTION.LeftToRight)
        newElement.className = "slide-out-elliptic-left-bck";

    element.style.display = "none";

    // const body = document.body;

    // body.appendChild(newElement);

    const parentDiv = document.querySelector("#parentDiv");

    if (parentDiv)
        parentDiv.appendChild(newElement);

    setTimeout(() => {


        const elementsToDelete = document.getElementsByClassName(questID + "class");

        for (let i = elementsToDelete.length - 1; i >= 0; i--) {
            elementsToDelete[i].remove();
        }


        if (onBallSlideOutCallback)
            onBallSlideOutCallback(questID, rewardID);

        callMascot(Rewards[rewardID].mascotDescription);
    }, 1000)



}
let isDivActivated = false;
function activateMainDiv() {
    const div = document.querySelector("#parentDiv") as HTMLDivElement;
    if (div) {

        isDivActivated = true;
        div.style.display = "block";
    }
}





function createKeyFrame(questID: string, percentage: string) {
    var style = document.createElement("style");
    // style.type = 'text/css';
    var keyFrames = '\
    @-webkit-keyframes B_DYNAMIC_VALUE {\
        0% {\ width: 0; }\
        100% {\ width: A_DYNAMIC_VALUE; }\
    }\
    @-moz-keyframes B_DYNAMIC_VALUE {\
        0% {\ width: 0; }\
        100% {\ width: A_DYNAMIC_VALUE; }\
    }';
    keyFrames = keyFrames.replace(/A_DYNAMIC_VALUE/g, percentage);
    style.innerHTML = keyFrames.replace(/B_DYNAMIC_VALUE/g, questID)

    document.getElementsByTagName('head')[0].appendChild(style);
}



export function addToQuestList(listOfQuests: Quest[]) {
    let subHead = document.getElementById('subHead');

    if (listOfQuests.length == 0) {

        if (subHead)
            subHead.style.display = 'none';
    } else {
        if (subHead)
            subHead.style.display = 'block';
    }

    // for (let i = 0; i < listOfQuests.length; i++) {
    //     const quest = listOfQuests[i];
    //     createAndAddQuestDiv(quest.key, quest.name, quest.reward.id, quest.CurrentProgression[0], quest.CurrentProgression[1]);
    // }

    // let i = 0;
    console.log(listOfQuests.length);

    for (let i = 0; i < listOfQuests.length; i++) {
        const quest = listOfQuests[i];

        createAndAddQuestDiv(quest.key, quest.name, quest.reward.id, quest.CurrentProgression[0], quest.CurrentProgression[1]);
    }

    // listOfQuests.forEach(quest => {
    //     createAndAddQuestDiv(quest.key, quest.name, quest.reward.id, quest.CurrentProgression[0], quest.CurrentProgression[1]);

    // });
}


export function plusSlides(n: number) {

    showSlides(slideIndex += n);
}

function showSlides(n: number) {
    let i;
    let slides = Array.from(document.getElementsByClassName("mySlides") as HTMLCollectionOf<HTMLElement>);


    if (n >= slides.length) {
        slideIndex = 0
    }

    if (n < 0) {
        slideIndex = slides.length - 1
    }

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }


    slides[slideIndex].style.display = "";
    // const u = document.getElementById("ballUse" + slideIndex);

    // if (u) {
    //     u.style.display = "none";
    // }

    if (!hasBall(slideIndex)) {
        disablePlayBtn(true);
    }
    else if (hasBall(slideIndex)) {
        disablePlayBtn(false);

        slides[slideIndex].style.height = "155px";
        const imgs = Array.from(document.getElementsByClassName("img-1") as HTMLCollectionOf<HTMLElement>);
        imgs[slideIndex].style.setProperty("margin-top", "0%");

        // useBall(slideIndex);

        if (useBallCallback) {
            enableAllUseButtons();

            // useBallCallback(slideIndex);
        }
    }

}

export function disablePlayBtn(value: boolean) {
    if (playBtn) {
        if (value) {

            if (!playBtn.getAttribute("disabled"))
                playBtn.setAttribute("disabled", "true");
        }
        else {

            playBtn.removeAttribute("disabled");
        }
    }
    // console.log("Play btn disabled ", value);
    // console.log(playBtn);
}
function getBallDivHTML(index: number, url: string, price: number) {
    let string = `<div  class=\"mySlides\"><img draggable="false" class="img-1"src=\"${url}\">`;
    if (!hasBall(index)) {

        string += `  <div  class="ballPrice" id="ball${index}"> <img id="coinIcon" draggable = "false" src="${images.biscuit.default}"  < p >${price} </p></div>`;
        string += `<p class="" style="display:none;" id="ballUse${index}"></p>`;

    } else {

        string += `<p class="ballPrice" style="display:none;" id="ballUse${index}">USE</p>`;
    }

    // console.log("INDEX :  " + index);
    // console.log("PRICE :  " + price);
    string += "</div>"
    return string;
}


let slideIndex = 0;


export function addBallsToGameOverPanel(arrOfBalls: any[]) //arrOfBalls : [] 
{
    var container = document.getElementById('ballsList');
    if (container == null) return;

    let html = "";
    for (let i = 0; i < arrOfBalls.length; i++) {
        html += getBallDivHTML(i, arrOfBalls[i].url, arrOfBalls[i].price);
    }





    html += container.innerHTML;
    container.innerHTML = html;


    for (let i = 0; i < arrOfBalls.length; i++) {
        const e = document.getElementById("ball" + i);
        const u = document.getElementById("ballUse" + i);


        if (e && u) {
            // console.log("Add Event for "+ i, );
            e.addEventListener("click", () => {


                
                
                const buyFeedBack = purchaseBall(i);
                Globals.emitter?.Call("UpdateBalance");
                
                if (buyFeedBack) {
                    e.style.display = "none";
                    u.style.display = "";
                    disablePlayBtn(false);

                    // useBall(i);

                    if (useBallCallback) {
                        enableAllUseButtons();

                        // useBallCallback(i);
                    }
                } else {
                    if (useBallCallback) {
                        useBallCallback(-1); //buy fail
                    }
                }

            });



        }

        // if (u) {
        //     u.addEventListener("click", () => {


        //         useBall(i);

        //         if (useBallCallback) {
        //             enableAllUseButtons();

        //             u.style.display = "none";
        //             useBallCallback(i);
        //         }
        //     });
        // }

    }


    // for

    showSlides(slideIndex);
}

function enableAllUseButtons() {
    for (let i = 0; i < ArrOfBalls.length; i++) {

        if (!hasBall(i))
            continue;

        // const u = document.getElementById("ballUse" + i);

        // if (u) {
        //     u.style.display = "";
        // }
    }
}

export function showPanel(index: number) {

    if (parentDiv == null)
        return;

    if (index == -1) {
        parentDiv.style.zIndex = "-1";
        setDisplayOfElementID("questPanel", "none");
        setDisplayOfElementID("gameOverPanel", "none");
        return;
    }
    // parentDiv.style.position = "relative";
    parentDiv.style.zIndex = "1";
    if (index == 0) {
        removeAllQuestsFromDiv();
        isQuestActivated = false;
    }

    setDisplayOfElementID("questPanel", index == 0 ? "none" : "block");
    setDisplayOfElementID("gameOverPanel", index == 0 ? "block" : "none");
}

function setDisplayOfElementID(id: string, displayValue: string) {
    const element = document.getElementById(id);

    console.log("Log Index : " + id + " : " + displayValue);

    if (element) {
        element.style.display = displayValue;
    } else {
        console.error("Not found  " + id);
    }
}


let isQuestActivated = false;

export function showQuestPanel(quests: Quest[], score: number) {

    if (isQuestActivated)
        return;

    isQuestActivated = true;

    // if (!isDivActivated) {
    //     activateMainDiv();
    // }

    const scorePoints = document.getElementById("score-points");

    if (scorePoints) {
        scorePoints.textContent = `You Scored ${score} Points`;
    }
    showPanel(1);



    addToQuestList(quests);
}



function spin(element: HTMLElement) {

    if (element)
        element.style.transform = "rotate(-45deg)";
}

