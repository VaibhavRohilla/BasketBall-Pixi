import { LoadQuestsData, SaveQuestsData } from "./DataHandler";
import { GameData } from "./Globals";
import { AllQuests, Rewards, questVar } from "./QuestsConfig";


export class Quest {
    completed: boolean = false;
    claimed: boolean = false;

    constructor(public key: string, public name: string, public description: string, public reward: Reward, public rewardValue: number, public isUnlocked: boolean, public condition: () => boolean, public unlockCondition: () => boolean, public fetchCurrentProgressionLogic: () => number[]) {
    }

    get CurrentProgression() {

        return this.fetchCurrentProgressionLogic();//should return [currentProgression, maxProgression]
    }

    checkUnlockCondition() {
        if (this.isUnlocked)
            return;

        if (this.unlockCondition && this.unlockCondition())
            this.isUnlocked = true;

        SaveQuests();

    }

    checkCondition() {
        if (!this.isUnlocked)
            return false;



        if (this.completed)
            return true;


        if (this.condition && this.condition()) {
            this.completed = true;
            SaveQuests();
            // this.onComplete();
            return true;
        }

        return false;

    }

    claim() {
        this.claimed = true;
        SaveQuests();

    }
}


export function RefereshAllQuests() {

    for (let i = 0; i < AllQuests.length; i++) {
        if (AllQuests[i].claimed)
            continue;

        AllQuests[i].checkUnlockCondition();
        AllQuests[i].checkCondition();
    }

}

export enum DIRECTION {
    RightToLeft,
    LeftToRight
}

export class Reward {

    useCallback: (() => void) | undefined;

    constructor(public name: string, public id: string, public description: string, public mascotDescription: string, public rewardImgURL: string, useCallback: (() => void) | undefined = undefined, public collectEffectDirection: DIRECTION = DIRECTION.RightToLeft) {
        this.useCallback = useCallback;
    }

    use() {

        if (this.useCallback) {
            this.useCallback();
        }
    }
}

const quests: { [index: string]: Quest } = {};

export function SaveQuests() {
    SaveQuestsData(quests);
}


export function getQuest(key: string): Quest {
    return quests[key];
}

export function checkIfQuestCompleted(key: string) {
    const quest = getQuest(key);

    console.log(quest.checkUnlockCondition());

    if (quest)
        return quest.completed;
    else {
        return false;
    }
}

export function checkIfClaimed(key: string) {
    const quest = getQuest(key);

    if (quest)
        return quest.claimed;
    else {
        return false;
    }
}

export function makeQuests() {

    for (let i = 0; i <= 200; i++) {
        let n = Math.floor(Math.random() * 3);
        let item = chooseQuest(n)

        if (item != null)
            AllQuests.push(item);

    }
}
export function chooseQuest(questNumber: number) {
    if (questNumber == 0) {
        questVar.totalScoreCount++;
        questVar.scoreCount += 75;

        const indexCount = questVar.totalScoreCount;
        const scoreCount = questVar.scoreCount;

        let x = new Quest(
            `scorePoints${indexCount}`,
            "Score Points",
            `Score ${questVar.scoreCount} points`,
            chooseRandomReward(),
            1,
            false,
            () => {
                return GameData.lastScore >= scoreCount;
            },
            () => {
                return checkIfClaimed(`scorePoints${indexCount - 1}`);
            },
            () => {
                const maxScore = Math.min(GameData.lastScore, scoreCount);
                return [maxScore, scoreCount];
            }
        )

        return x;
    }
    if (questNumber == 1) {
        questVar.totalDunkCount++;
        questVar.ballDunks += 15;

        const indexCount = questVar.totalDunkCount;
        const dScoreCount = questVar.ballDunks;
        let x = new Quest(
            `totalDunks${questVar.totalDunkCount}`,
            "Total Dunks",
            `Score ${questVar.ballDunks} Dunks`,
            chooseRandomReward(),
            1,
            false,
            () => {
                return GameData.totalDunks >= dScoreCount;
            },
            () => {
                return checkIfClaimed(`totalDunks${indexCount - 1}`);
            },
            () => {
                const maxScore = Math.min(GameData.totalDunks, dScoreCount);
                return [maxScore, dScoreCount];
            }
        )

        return x;

    }
    if (questNumber == 2) {
        questVar.totalHighscoreCount++;
        questVar.highScore += 50;
        const hScoreCount = questVar.highScore;
        const indexCount = questVar.totalHighscoreCount;

        let x = new Quest(
            `highScore${questVar.totalHighscoreCount}`,
            "High Score",
            `Set ${questVar.highScore} Highscore`,
            chooseRandomReward(),
            1,
            false,
            () => {
                return GameData.highScore >= hScoreCount;
            },
            () => {
                return checkIfClaimed(`highScore${indexCount - 1}`);
            },
            () => {
                const maxScore = Math.min(GameData.highScore, hScoreCount);
                return [maxScore, hScoreCount];
            }
        )
        return x;

    }
    return null;
}

export function chooseRandomReward() {
    let n = Math.floor(Math.random() * 7);
    if (n - 1 == 0) { return Rewards.bronzeBall; }
    if (n - 1 == 1) { return Rewards.silverBall; }
    if (n - 1 == 2) { return Rewards.goldenBall; }
    if (n - 1 == 3) { return Rewards.potionBall; }
    if (n - 1 == 4) { return Rewards.potionBisquit; }
    if (n - 1 == 5) { return Rewards.potionHoop; }
    if (n - 1 == 6) { return Rewards.potionScore; }
    else return Rewards.potionScore;
}


export function addQuest(quest: Quest) {
    if (!quests[quest.key]) {
        quests[quest.key] = quest;
        // SaveQuests();
    }
    else
        console.log("Quest already exists");
}

export function allQuests() {
    return quests;
}

export function getUnlockedQuests() {
    const unlockedQuests = [];
    for (const quest in quests) {
        if (quests[quest].isUnlocked && !quests[quest].claimed)
            unlockedQuests.push(quests[quest]);
        // else
        // console.log(quests[quest]);
    }
    return unlockedQuests;
}

export function getCompletedQuests() {
    const completedQuests = [];
    for (const quest in quests) {
        if (quests[quest].completed)
            completedQuests.push(quest);
    }
    return completedQuests;
}

export function getClaimedQuests() {
    const claimedQuests = [];
    for (const quest in quests) {
        if (quests[quest].claimed)
            claimedQuests.push(quest);
    }
    return claimedQuests;
}


































// addQuest(new Quest("quest2", "Quest 2", "This is a quest2", "reward", "./package.png", true,() => {
//         return false;
//     }, () => {
//         console.log("completed");
//     },
//     undefined,
//     () => {
//         return [1, 1];
//     }));

// addQuest(new Quest("quest3", "Quest 3", "This is a quest3", "reward", "./package.png", false, () => {
//         return false;
//     }, () => {
//         console.log("completed");
//     },
//     undefined,
//     () => {
//         return [1, 2];
//     }));

// addQuest(new Quest("quest4", "Quest 4", "This is a quest4", "reward", "./package.png", true,() => {
//         return false;
//     }, () => {
//         console.log("completed");
//     },
//     undefined,
//     () => {
//         return [0, 10];
//     }));




