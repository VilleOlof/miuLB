import DataHandler, { ClassicRequest, CustomRequest, GetClassicLevelsLookup, GetMedalTimes, GetWeeklyLevels, scores, custom_scores, FormatTime, GetClassicLevels, GetCustomLevels} from "./DataHandler";
import Ping from "./Ping";

const UsernameMaxLength = 16;

var latestClassicRequest: ClassicRequest = undefined;
var latestCustomRequest: CustomRequest = undefined;

async function Main(): Promise<void> {
	HandlePlatformSelect(Platform.Global);
	RegisterEventListeners();
	await LoadMedalTimes();
	await SetupSelectionMenus();

	await CheckParametersUponStart();
}

async function SetupSelectionMenus(): Promise<void> {

	await ClassicSelectionMenu();

	var customLevels: string[] = await GetCustomLevels();
	var customlevelList = document.getElementById('customLevelList') as HTMLDataListElement;

	customLevels.forEach((level) => {
		var option = document.createElement('option');
		option.value = level;
		customlevelList.appendChild(option);
	});

	var weeklyTitle = document.getElementById('weeklyTitle') as HTMLParagraphElement;
	weeklyTitle.style.display = "none";
}

async function ClassicSelectionMenu(): Promise<void> {
	var classicLevels: {[key: string]: string} = await GetClassicLevels();
	var classicLevelSelect = document.getElementById('classicLevel') as HTMLSelectElement;

	classicLevelSelect.innerHTML = "";

	for (var key in classicLevels) {
		var option = document.createElement('option');
		option.value = classicLevels[key];
		option.text = key;
		classicLevelSelect.add(option);
	}

	var weeklyTitle = document.getElementById('weeklyTitle') as HTMLParagraphElement;
	weeklyTitle.style.display = "none";
}

async function SwitchClassicSelectionMenu(weekly: boolean): Promise<void> {
	if (!weekly) {
		await ClassicSelectionMenu();
		return;
	}

	var weeklyLevels: string[] = await GetWeeklyLevels(import.meta.env.VITE_WEEKLY_STATUS);
	var classicLevelSelect = document.getElementById('classicLevel') as HTMLSelectElement;

	classicLevelSelect.innerHTML = "";

	weeklyLevels.forEach((level) => {
		var option = document.createElement('option');
		option.value = level;
		option.text = level;
		classicLevelSelect.add(option);
	});

	var weeklyTitle = document.getElementById('weeklyTitle') as HTMLParagraphElement;
	weeklyTitle.style.display = "inherit";
}

export enum Platform {
	Global = "Global",
	Steam  = "Steam",
	Switch = "Switch",
	Custom = "Custom"
}
export enum PlatformType {
	Classic,
	Custom
}

function CompareClassicRequests(a: ClassicRequest, b: ClassicRequest): boolean {
	if (a == undefined || b == undefined) return false;
	return a.platform == b.platform && a.level == b.level && a.amount == b.amount && a.skip == b.skip && a.orderBy == b.orderBy && a.orderByDesc == b.orderByDesc;
}
export function CompareCustomRequests(a: CustomRequest, b: CustomRequest): boolean {
	if (a == undefined || b == undefined) return false;
	return a.start == b.start && a.end == b.end && a.level == b.level;
}

export function GetPlatformType(platform: Platform): PlatformType {
	if (platform == Platform.Custom) return PlatformType.Custom;
	else return PlatformType.Classic;
}

function HandlePlatformSelect(value: string): void {
	var type: PlatformType = GetPlatformType(value as Platform);

	var classicOptions = document.getElementById('classicOptions') as HTMLDivElement;
	var customOptions  = document.getElementById('customOptions') as HTMLDivElement;

	if (type == PlatformType.Custom) {
		classicOptions.style.display = "none";
		customOptions.style.display  = "inherit";
	}
	else {
		classicOptions.style.display = "inherit";
		customOptions.style.display  = "none";

		if (value.startsWith("Weekly")) {
			SwitchClassicSelectionMenu(true);
		}
		else {
			SwitchClassicSelectionMenu(false);
		}
	}
}

async function FetchScores(platform: string, InjectRequest: ClassicRequest | CustomRequest | undefined = undefined): Promise<void> {

	if (platform.startsWith("Weekly")) {
		//Weekly challenge
		var weeklyPlatform: Platform = platform.split("_")[1] as Platform;

		//Global, have to fetch both platforms on their own
		if (weeklyPlatform == Platform.Global) {

			var steamWeeklyRequest = new ClassicRequest();
			steamWeeklyRequest.platform = Platform.Steam;
			var steamWeeklyScores = await DataHandler.MakeWeeklyRequest(steamWeeklyRequest);

			var switchWeeklyRequest = new ClassicRequest();
			switchWeeklyRequest.platform = Platform.Switch;
			var switchWeeklyScores = await DataHandler.MakeWeeklyRequest(switchWeeklyRequest);

			var combinedScores = steamWeeklyScores.concat(switchWeeklyScores);

			combinedScores.sort((a, b) => a.time - b.time);
			combinedScores.forEach((score, index) => score.rank = index + 1);

			combinedScores = combinedScores.slice(0, steamWeeklyRequest.amount);

			var globalRequest = new ClassicRequest();
			AddRequestAsParameter(globalRequest, "Weekly_" + Platform.Global);

			await AddClassicScores(combinedScores, undefined, false);

			return;
		}

		var weeklyRequest = new ClassicRequest();
		weeklyRequest.platform = weeklyPlatform;
		var weeklyScores = await DataHandler.MakeWeeklyRequest(weeklyRequest);

		AddRequestAsParameter(weeklyRequest, "Weekly_" + weeklyPlatform);
		await AddClassicScores(weeklyScores, undefined, false);

		return;
	}
	//Non-Weekly Challenge, Standard scores

	if (platform as Platform == Platform.Custom) {

		var customRequest = new CustomRequest();
		if (CompareCustomRequests(latestCustomRequest, customRequest)) return;

		if (InjectRequest != undefined) customRequest = InjectRequest as CustomRequest;

		AddRequestAsParameter(customRequest)
		latestCustomRequest = customRequest;

		var customScores = await DataHandler.MakeCustomRequest(customRequest);
		AddCustomScores(customScores);

		return;
	}

	var classicRequest = new ClassicRequest();
	if (CompareClassicRequests(latestClassicRequest, classicRequest)) return;

	if (InjectRequest != undefined) classicRequest = InjectRequest as ClassicRequest;

	AddRequestAsParameter(classicRequest)
	latestClassicRequest = classicRequest

	var classicScores = await DataHandler.MakeClassicRequest(classicRequest);
	//if (classicRequest.orderBy == "updatedAt") classicRequest.usernameQuery = true; //makes so the levels appear in the HTML table

	await AddClassicScores(classicScores, classicRequest.usernameQuery);
}

function AddRequestAsParameter(request: ClassicRequest | CustomRequest, InjectPlatform?: string | undefined): void {

	var path: string = window.location.protocol + "//" + window.location.host + window.location.pathname + '?';

	if (request instanceof ClassicRequest) {
		path += `platform=${InjectPlatform != undefined ? InjectPlatform : request.platform}&`;
		path += `level=${request.level}&`;
		path += `amount=${request.amount}&`;
		path += `skip=${request.skip}&`;
		path += `orderBy=${request.orderBy}&`;
		path += `orderByDesc=${request.orderByDesc}&`;
		path += `username=${request.username}&`;
		path += `usernameQuery=${request.usernameQuery}`;
	}
	else {
		path += `platform=Custom&`;
		path += `start=${request.start}&`;
		path += `end=${request.end}&`;
		path += `level=${request.level}`;
	}

	window.history.replaceState({ path: path }, '', path);
}

async function CheckParametersUponStart(): Promise<void> {

	if (window.location.search == "") return;

	var urlParams = new URLSearchParams(window.location.search);

	var platform = urlParams.get('platform') as Platform;
	if (platform == undefined) return;

	HandlePlatformSelect(platform);
	if (platform.startsWith("Weekly")) {
		await SwitchClassicSelectionMenu(true);
	}

	if (platform == Platform.Custom) {
		var customRequest = new CustomRequest();

		customRequest.start = parseInt(urlParams.get('start'));
		customRequest.end 	= parseInt(urlParams.get('end'));
		customRequest.level = urlParams.get('level');

		UpdateUIOptions(customRequest);
		FetchScores(platform, customRequest);
		return;
	}
	else {
		var classicRequest = new ClassicRequest();

		classicRequest.platform 	 = platform;
		classicRequest.level 		 = urlParams.get('level');
		classicRequest.amount 		 = parseInt(urlParams.get('amount'));
		classicRequest.skip 		 = parseInt(urlParams.get('skip'));
		classicRequest.orderBy 		 = urlParams.get('orderBy');
		classicRequest.orderByDesc 	 = (urlParams.get('orderByDesc') == "true");
		classicRequest.username 	 = urlParams.get('username');
		classicRequest.usernameQuery = (urlParams.get('usernameQuery') == "true");

		UpdateUIOptions(classicRequest);
		FetchScores(platform, classicRequest);
		return;
	}
}

function UpdateUIOptions(request: ClassicRequest | CustomRequest): void {

	if (request instanceof ClassicRequest) {
		document.getElementById('platform')["value"] 			= request.platform;
		document.getElementById('classicLevel')["value"] 		= request.level;
		document.getElementById('classicAmount')["value"]		= request.amount;
		document.getElementById('classicSkip')["value"] 		= request.skip;
		document.getElementById('orderBy')["value"] 			= request.orderBy;
		document.getElementById('orderByDescending')["checked"] = (request.orderByDesc == true);
		document.getElementById('usernameQuery')["value"] 		= request.username;
	}
	else {
		const amount = request.end - request.start + 1;
		const skip = request.start - 1;

		document.getElementById('customAmount')["value"] 		= amount;
		document.getElementById('customSkip')["value"] 			= skip;
		document.getElementById('customlevel')["value"] 		= request.level;
	}
}

function RegisterEventListeners(): void {
    var platformSelect = document.getElementById('platform') as HTMLSelectElement;
    platformSelect.addEventListener('change', function () { HandlePlatformSelect(this.value); });

	var fetchButton = document.getElementById('fetchButton') as HTMLButtonElement;
	fetchButton.addEventListener('click', function () { FetchScores(platformSelect.value); });
}

async function AddClassicScores(scores: scores[], usernameQuery?: boolean, AddMedalIcon: boolean = true): Promise<void> {
	if (usernameQuery && AddMedalIcon) AddMedalIcon = false; //makes so the medal icon doesn't appear when the usernameQuery is true, overflows the table otherwise
	const startRowIndex: number = AddMedalIcon ? 1 : 0;
	
	var leaderboardRows = document.getElementById('LB_Table') as HTMLTableElement;
	leaderboardRows.innerHTML = "";
	
	leaderboardRows.className = "LB_Table";

	var topRow = leaderboardRows.insertRow(-1);
	topRow.className = "LB_Table_Top";

	if(AddMedalIcon) topRow.insertCell(startRowIndex+ (-1)); //for the medal icon
	var rank = topRow.insertCell(startRowIndex+0);
	if (usernameQuery) rank.innerHTML = "Level";
	else rank.innerHTML = "Rank";

	rank.className = "LB_Table_RankTH";

	topRow.insertCell(startRowIndex+1).innerHTML = "Time";
	topRow.insertCell(startRowIndex+2).innerHTML = "Username";
	topRow.insertCell(startRowIndex+3).innerHTML = "Platform";
	topRow.insertCell(startRowIndex+4).innerHTML = "Date";

	var lookup: { [key: string]: string } = await GetClassicLevelsLookup();

	var iteration: number = 0;
	scores.forEach((score) => {
		iteration++;

		var row = leaderboardRows.insertRow(-1);
		row.className = "LB_Table_Row";

		if (iteration % 2 == 0) row.classList.add("LB_Table_Row_Even");

		if (AddMedalIcon) var medal = row.insertCell(startRowIndex+ (-1));
		var rank     = row.insertCell(startRowIndex+0);
		var time     = row.insertCell(startRowIndex+1);
		var username = row.insertCell(startRowIndex+2);
		var platform = row.insertCell(startRowIndex+3);
		var date     = row.insertCell(startRowIndex+4);

		if (AddMedalIcon) {
			const medalIcon: HTMLImageElement = GetMedalIcon(score.time, score.level)
			medalIcon.className = "LB_Table_Medal";
			medal.appendChild(medalIcon);
		}

		rank.className = "LB_Table_RankTH";

		if (usernameQuery) {
			rank.innerHTML = lookup[score.level];
		}
		else rank.innerHTML = (score.rank != undefined ? score.rank.toString() : iteration.toString());

		time.innerHTML = FormatTime(score.time);
		username.innerHTML = FormatUsername(score.username);
		platform.innerHTML = FormatPlatform(score.platform.toString());
		date.innerHTML = score.timestamp.toString().substring(0, 10);
	});
}

function AddCustomScores(customScores: custom_scores[]): void {
	var leaderboardRows = document.getElementById('LB_Table') as HTMLTableElement;
	leaderboardRows.innerHTML = "";

	leaderboardRows.className = "LB_Table";

	var topRow = leaderboardRows.insertRow(-1);
	topRow.className = "LB_Table_Top";

	topRow.insertCell(0).innerHTML = "Rank";
	topRow.insertCell(1).innerHTML = "Time";
	topRow.insertCell(2).innerHTML = "Username";

	var iteration: number = 0;
	customScores.forEach((score) => {
		iteration++;

		var row = leaderboardRows.insertRow(-1);
		row.className = "LB_Table_Row";

		if (iteration % 2 == 0) row.classList.add("LB_Table_Row_Even");

		var rank 	 = row.insertCell(0);
		var time 	 = row.insertCell(1);
		var username = row.insertCell(2);

		rank.innerHTML = score.GlobalRank.toString();
		time.innerHTML = FormatTime(score.time);
		username.innerHTML = FormatUsername(score.user);
	});
}

var silverTimes: { [key: string]: number}
var goldTimes: { [key: string]: number}
var diamondTimes: { [key: string]: number}

const bronzeIcon: HTMLImageElement  = document.createElement("img");
const silverIcon: HTMLImageElement	= document.createElement("img");
const goldIcon: HTMLImageElement 	= document.createElement("img");
const diamondIcon: HTMLImageElement = document.createElement("img");

async function LoadMedalTimes(): Promise<void> {
	silverTimes = await GetMedalTimes("silverTimes"); 
	goldTimes = await GetMedalTimes("goldTimes"); 
	diamondTimes = await GetMedalTimes("diamondTimes"); 

	bronzeIcon.src = import.meta.env.VITE_MEDAL_URL_BRONZE;
	silverIcon.src = import.meta.env.VITE_MEDAL_URL_SILVER;
	goldIcon.src = import.meta.env.VITE_MEDAL_URL_GOLD;
	diamondIcon.src = import.meta.env.VITE_MEDAL_URL_DIAMOND;
}

function GetMedalIcon(time: number, level: string): HTMLImageElement {
	if (time < diamondTimes[level]) return diamondIcon.cloneNode(true) as HTMLImageElement;
	else if (time < goldTimes[level]) return goldIcon.cloneNode(true) as HTMLImageElement;
	else if (time < silverTimes[level]) return silverIcon.cloneNode(true) as HTMLImageElement;
	else return bronzeIcon.cloneNode(true) as HTMLImageElement;
}
export function FormatUsername(username: string): string {
	var username: string = username.substring(0, UsernameMaxLength);
	if (username.length == UsernameMaxLength) {
		username += "...";
	}

	return username;
}

export function FormatPlatform(platform: string): string {
	if (!(platform in Platform)) {
		return "Shhh";
	}

	return platform;
}

export async function CheckServerStatus(): Promise<void> {
	var serverOnline: boolean = await Ping(import.meta.env.VITE_BACKEND_IP);

	if (!serverOnline) {

		var offlineMessage = document.getElementById('offlineMessage') as HTMLDivElement;
		offlineMessage.style.display = "inline-block";

		var retryheading = document.getElementById('retryingErrorHeading') as HTMLHeadingElement;

		const pingEvery: number = 15;
		var secondsElapsed: number = 0;
		var pingInterval: any = setInterval(async function () {

			secondsElapsed++;

			if (secondsElapsed % pingEvery == 0) {
				serverOnline = await Ping(import.meta.env.VITE_BACKEND_IP);
				if (serverOnline) {
					offlineMessage.style.display = "none";
					clearInterval(pingInterval);

					Main();
				}
			}

			var remainingSeconds: number = pingEvery - (secondsElapsed % pingEvery);
			retryheading.innerHTML = `Retrying in ${remainingSeconds} seconds...`;
		}, 1000);
	}
	else {
		Main();
	}
}