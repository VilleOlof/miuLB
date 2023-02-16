import { Platform, PlatformType } from "./main";

function FormatString(str: string, ...val: string[]) {
    for (let index: number = 0; index < val.length; index++) {
      str = str.toString().replace(`{${index}}`, val[index]);
    }
    return str;
}

const time_regex = new RegExp('[1-9]');
export function FormatTime(seconds: number) {
    var minus: boolean = seconds < 0;
    if (minus) seconds = -seconds;

    var a: string = new Date(seconds * 1000).toISOString().substring(12, 19)
    var milli: string = (seconds - Math.floor(seconds)).toString().substring(0, 5);

    let index: number = 0;

    for (let str of a.split("")) {
        if (time_regex.test(str)) break;
        index++;
    }

    a = a.substring(index);

    return `${minus ? "-" : ""}${a}${milli.substring(1)}`;
}

export class ClassicRequest {

    public platform: Platform = Platform.Global;
    public level: string = "";
    public amount: number = 0;
    public skip: number = 0;
    public orderBy: string = "time";
    public orderByDesc: boolean = false;
    public username: string = "";
    public usernameQuery: boolean = false;
    
    public constructor() {
        this.GetElementValues();
    }

    private GetElementValues(): void {
        this.platform = (document.getElementById('platform') as HTMLSelectElement).value as Platform;
        this.level = (document.getElementById('classicLevel') as HTMLSelectElement).value;
        this.amount = parseInt((document.getElementById('classicAmount') as HTMLInputElement).value);
        this.skip = parseInt((document.getElementById('classicSkip') as HTMLInputElement).value);
        this.orderBy = (document.getElementById('orderBy') as HTMLSelectElement).value;
        this.orderByDesc = (document.getElementById('orderByDescending') as HTMLInputElement).checked;
        this.username = (document.getElementById('usernameQuery') as HTMLInputElement).value;

        if (this.username != "") { 
            this.usernameQuery = true; 
            this.level = this.username; //it uses the level field for the username incase of a username query
        }

        if (this.orderBy == "updatedAt") {
            this.level = "";
        }
    }
}

export class CustomRequest {

    public start = 0;
    public end = 0;
    public level = "";

    public constructor() {
        this.GetElementValues();
    }

    private GetElementValues(): void {
        this.start = parseInt((document.getElementById('customAmount') as HTMLInputElement).value);
        this.end = parseInt((document.getElementById('customSkip') as HTMLInputElement).value);
        this.level = (document.getElementById('customlevel') as HTMLInputElement).value;

        var start: number = this.end + 1;
        var end: number = this.start + this.end;

        this.start = start;
        this.end = end;
    }

}

export default class DataHandler {

    public static async MakeClassicRequest(request: ClassicRequest): Promise<scores[]> {

        var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_CLASSIC_TEMPLATE, 
            request.level, 
            request.amount.toString(), 
            request.skip.toString(), 
            request.orderBy, 
            request.orderByDesc.toString(), 
            request.platform, 
            request.usernameQuery.toString()
        );

        var response: any = await fetch(path);

        if (response.status == 200) {
            var scores = new Array<scores>();
            var jsonData: any = await response.json();

            scores = JSON.parse(jsonData.scores);

            return scores;
        }

        return [];
    }

    public static async MakeWeeklyRequest(request: ClassicRequest): Promise<scores[]> {

        var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_WEEKLY_TEMPLATE,
            import.meta.env.VITE_WEEKLY_STATUS,
            "true",
            request.level,
            request.platform,
            request.amount.toString(),
            request.skip.toString(),
            request.orderBy,
            request.orderByDesc.toString(),
        );

        var response: any = await fetch(path);

        if (response.status == 200) {
            var scores = new Array<scores>();
            var jsonData: any = await response.json();

            scores = JSON.parse(jsonData.scores);

            return scores;
        }

        return [];
    }

    public static async MakeCustomRequest(request: CustomRequest): Promise<custom_scores[]> {

        var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_CUSTOM_TEMPLATE,
            request.start.toString(),
            request.end.toString(),
            request.level,
        );

        var response: any = await fetch(path);

        if (response.status == 200) {
            var scores = new Array<custom_scores>();
            var jsonData: any = await response.json();

            scores = JSON.parse(jsonData.scores);

            return scores;
        }

        return [];
    }
}

export class scores {
    public username: string;
    public time: number;
    public level: string;
    public skin: string;
    public platform: PlatformType;
    public timestamp: number;
    public rank: number;

    public constructor(username: string, time: number, level: string, skin: string, platform: PlatformType, timestamp: number, rank: number) {
        this.username = username;
        this.time = time;
        this.level = level;
        this.skin = skin;
        this.platform = platform;
        this.timestamp = timestamp;
        this.rank = rank;
    }
}

export class custom_scores {
    public user: string;
    public time: number;
    public GlobalRank: number;

    public constructor(username: string, time: number, rank: number) {
        this.user = username;
        this.time = time;
        this.GlobalRank = rank;
    }
}

const classicChapters = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5", "Chapter 6"]
export async function GetClassicLevels(): Promise<{[key: string]: string}> {
    var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_JSONDATA_TEMPLATE,"classicLevelOrder");
    var LookupPath: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_JSONDATA_TEMPLATE,"classicLevels");

    var response: any = await fetch(path);

    if (response.status == 200) {
        var levelOut: {[key: string]: string} = {};
        var levels = new Array<string>();
        var jsonData: any = await response.json();
        
        classicChapters.forEach(chapter => {
            var classic_levels: string[] = jsonData[chapter];
            classic_levels.forEach(level => {
                levels.push(level);
            });
        });

        var lookupResponse: any = await fetch(LookupPath);
        var lookupData: any = await lookupResponse.json();

        levels.forEach(level => {
            levelOut[(lookupData[level])] = level;
        });

        return levelOut;
    }

    return {};
}

export async function GetClassicLevelsLookup(): Promise<{[key: string]: string}> {
    var LookupPath: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_JSONDATA_TEMPLATE,"classicLevels");

    var response: any = await fetch(LookupPath);

    if (response.status == 200) {
        return await response.json();
    }

    return {};
}

export async function GetWeeklyLevels(status: string): Promise<string[]> {
    var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_WEEKLY_DATA_TEMPLATE,status, "false");

    var response: any = await fetch(path);

    if (response.status == 200) {
        return JSON.parse((await response.json()).levels);
    }

    return [];
}

export async function GetCustomLevels(): Promise<string[]> {
    var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_CUSTOMLEVELS_TEMPLATE, "true");

    var response: any = await fetch(path);

    if (response.status == 200) {
        var levels = new Array<string>();
        var jsonData: any = await response.json();

        levels = JSON.parse(jsonData.levels);

        levels.sort();

        return levels;
    }

    return [];
}

export async function GetMedalTimes(medalType: string): Promise<{ [key: string]: number}> {
    var path: string = import.meta.env.VITE_BACKEND_IP + FormatString(import.meta.env.VITE_BACKEND_JSONDATA_TEMPLATE, medalType);

    var response: any = await fetch(path);

    if (response.status == 200) {
        var jsonData: any = await response.json();

        return jsonData;
    }

    return {};
}