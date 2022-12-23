// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: download;
// share-sheet-inputs: url;
/********************************************
 *                                          *
 *         Import Script from Gist          *
 *                                          *
 * This script imports files from a Github  *
 *                  Gist.                   *
 *                                          *
 *  Just run it from the action extension   *
 *  while viewing the Gist in your browser  *
 *  of choice or copy its URL and run this  *
 *                 script.                  *
 *  It will download all files (up to 300,  *
 *  then Github's API forces you to clone   *
 *   the Gist) and import them either in    *
 *     Scriptable's iCloud folder or in     *
 * Scriptable's local documents folder. (It *
 * will ask, if there are more than 5 files *
 *                to import)                *
 * If there is already a file with the same *
 * name, and they have different contents,  *
 *   it will ask if you want to overwrite   *
 *    them (it says which files will be     *
 *  overridden). You can override or skip   *
 *  them or cancel the import altogether.   *
 * After the import is done, it sends you a *
 *   notification, which will be deleted    *
 *          after about 2 seconds           *
 *                                          *
 *  To download from private Gists or view  *
 *  your own  Gists, you need to configure  *
 * an OAuth App on GitHub. If you have done *
 *   that already for the Script "Create    *
 *                  Gist"                   *
 * (https://talk.automators.fm/t/4743), you *
 *  don't need to do it again, because the  *
 *       same user data will be used.       *
 *                                          *
 *   Follow the instructions on the link    *
 *     below to create your OAuth App.      *
 *                                          *
 * When you are asked to put in a redirect  *
 * URL, you should put the URL for running  *
 * this script in Scriptable. Assuming the  *
 *  name of this script is "Import Script   *
 *         from Gist", the URL is           *
scriptable:///run?scriptName=Import%20Script%20from%20Gist
 * This URL needs to match the script name, *
 * like in the example. If you have already *
 *  registered your app and authenticated   *
 * with the "Create Gist" script, but then  *
 *    removed the credentials with this     *
 *  script, you have to log in again with   *
 *  the "Create Gist" script, otherwise it  *
 *     will give you an error like "The     *
 *  redirect URI has to match the callback  *
 *                  URI".                   *
 *                                          *
https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/
 *                                          *
 * Now that you have an app, make sure that *
 *    you don't have a Gist URL in your     *
 *    clipboard and run this script. The    *
 *  script will prompt you to enter a Gist  *
 * URL, but select "User Account" and "Log  *
 * in". You will be asked for the client ID *
 * and client secret you got after creating *
 *            the app on GitHub.            *
 *                                          *
 *  Made by @schl3ck in May 2019 (Reddit,   *
 *             Automators Talk)             *
 *                                          *
 *               Version 1.1                *
 *        (Changelog at the bottom)         *
 *                                          *
 ********************************************/


// This script will search for moment.js in your Scriptable scripts and in lib/moment.js. If it can't find it, it won't use it. If you will never install moment.js you can disable it here.
let useMoment = true;


// Do not change anything below this line, unless you know what you do!


// Keychain key for the GitHub OAuth App client ID
let CLIENT_ID_KEY = "github.gists.clientId"
// Keychain key for the GitHub OAuth App client secret
let CLIENT_SECRET_KEY = "github.gists.clientSecret"
// Keychain key for the access token
let ACCESS_TOKEN_KEY = "github.gists.accessToken"


// This is the base URL for all API calls
let apiURL = "https://api.github.com/gists";

let regex = /^https?:\/\/gist\.github\.com\//;
// prefer saving to iCloud, but if it wasn't enabled, fall back to local
let fm;
try {
	fm = FileManager.iCloud();
} catch (ex) {
	fm = FileManager.local();
}
let userGistCache;
let moment;

// Check for any URL parameters (script was called by URL scheme)
let params = args.queryParameters
if (params.error_description) {
	// Received error during OAuth flow.
	let error = decodeURIComponent(params.error_description.replace(/\+/g, " "));
	let a = new Alert();
	a.title = "OAuth error";
	a.message = error;
	a.addCancelAction("OK");
	await a.presentAlert();
} else if (params.code != null) {
	// Exchange code to an access token and continue normally
	await exchangeCode(params.code)
} else if (params.id) {
	await presentSingleGist(params.id);
	Script.complete();
	return;
} else if (params.url) {
	await presentSingleGist(getIdFromUrl(params.url));
	Script.complete();
	return;
}

let gistUrl;
// check if we got an URL via the share sheet
if (config.runsInActionExtension && args.urls && args.urls.length) {
	// get the first one that is a Gist URL
	gistUrl = args.urls.find((u) => regex.test(u)) || "";
} 

if (gistUrl) {
	await presentSingleGist(getIdFromUrl(gistUrl));
} else {
	// we got no Gist URL
	if (Keychain.contains(ACCESS_TOKEN_KEY)) {
		await presentMainMenu(config.runsInActionExtension ? "No Gist URL found" : null);
	} else {
		await askGistUrl(false);
	}
}

Script.complete();
return;



async function presentMainMenu(message) {
	let loggedIn = Keychain.contains(ACCESS_TOKEN_KEY);
	let inShareSheet = config.runsInActionExtension;
	
	// display message, if in share sheet
	let a = new Alert();
	if (message)
		a.title = message;
	a.addCancelAction("Quit");
	a.addAction("Enter URL");
	a.addAction("Show User Gists");
	a.addAction("User Settings");
	
	switch(await a.presentSheet()) {
		case -1: return;
		case 0: 
			await askGistUrl(false, presentMainMenu);
			break;
		case 1:
			await presentUserGists(presentMainMenu);
			break;
		case 2:
			await presentUserSettings(presentMainMenu);
			break;
	}
}


async function presentUserSettings(prevFunc) {
	let hasKey = Keychain.contains(CLIENT_ID_KEY);
	let loggedIn = Keychain.contains(ACCESS_TOKEN_KEY);
	let a = new Alert();
	// because we only get an index of the selected option, save what that option does
	let options = [];
	if (loggedIn) {
		a.title = "Logged in";
		a.message = "You can download from private Gists!\n\nIf you want, you can logout, but this won't be confirmed! You can also remove the app credentials (this will also log you out).";
		a.addAction("Logout");
		a.addDestructiveAction("Remove credentials");
		options = ["logout", "delete"];
	} else if (hasKey) {
		a.title = "Not logged in";
		a.message = "You cannot download from private Gists.\n\nIf you want, you can remove the OAuth credentials or log in.";
		a.addAction("Log in");
		a.addDestructiveAction("Remove credentials");
		options = ["login", "delete"];
	} else {
		a.title = "No credentials found";
		a.message = "You cannot download from private Gists.\n\nIf you want, you can add the OAuth credentials and log in.";
		a.addAction("Add credentials");
		a.addAction("Log in");
		options = ["add", "login"];
	}
	a.addCancelAction(prevFunc ? "Back" : "Quit");
	
	let res = await a.presentSheet();
	if (res === -1) return prevFunc && prevFunc();
	switch (options[res]) {
		case "delete":
			removeCredentials(true);
			break;
		case "add":
			await addCredentials();
			break;
		case "logout":
			removeCredentials(false)
			break;
		case "login":
			if (!hasKey)
				await addCredentials();
			await authorize();
			break;
	}
	return;
	
}

async function presentUserGists(prevFunc) {
	if (!userGistCache) {
		let req = apiRequest("");
		userGistCache = await req.loadJSON();
	}
	
	let a = new Alert();
	a.title = `${userGistCache.length} Gists found`;
	a.addCancelAction(prevFunc ? "Back" : "Quit");
	a.addAction("Reload");
	userGistCache.forEach((g) => {
		let str = "";
		str += g.public ? "🌍 " : "🔒 ";
		str += Object.keys(g.files).join(", ");
		a.addAction(str);
	});
	
	let res = await a.presentSheet();
	if (res === -1) return prevFunc && prevFunc();
	if (res === 0) {
		userGistCache = null;
		await presentUserGists(prevFunc);
		return;
	}
	await presentSingleGist(userGistCache[res - 1].id, () => presentUserGists(prevFunc));
}

async function presentSingleGist(gistID, prevFunc) {
	let gist = await apiRequest(gistID).loadJSON();
	
	if (gist.message === "Not Found") {
		let a = new Alert();
		a.title = "Gist not found";
		a.message = "Gist ID: " + gistID;
		a.addCancelAction(prevFunc ? "Back" : "Quit");
		await a.presentAlert();
		return prevFunc && prevFunc();
	}
	
	let a = new Alert();
	a.title = gist.public ? "🌍 public" : "🔒 private";
	let files = Object.keys(gist.files);
	files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	a.message = `Created: ${await formatDate(gist.created_at)}
Updated: ${await formatDate(gist.updated_at)}
Description: ${gist.description}
${files.length} file${files.length !== 1 ? "s" : ""}:
${files.join(", ")}`;
	a.addAction("View");
	a.addAction("Download");
	a.addAction("Refresh");
	a.addCancelAction(prevFunc ? "Back" : "Quit");
	
	switch(await a.presentSheet()) {
		case -1: return prevFunc && prevFunc();
		case 0:
			await WebView.loadURL(gist.html_url);
			await presentSingleGist(gistID, prevFunc);
			break;
		case 1:
			await downloadGist(gistID);
			break;
		case 2:
			await presentSingleGist(gistID, prevFunc);
			break;
	}
}

async function formatDate(date) {
	let res;
	date = new Date(date);
	if (useMoment) {
		if (!moment) {
			for (let path of ["", "lib"]) {
				path += "/moment.js";
				let fullPath = fm.documentsDirectory() + "/" + path;
				if (fm.fileExists(fullPath)) {
					await fm.downloadFileFromiCloud(fullPath);
					moment = importModule(path);
					break;
				}
			}
		}
	} 
	res = date.toLocaleDateString() + " " + date.toLocaleTimeString();
	if (useMoment && moment) {
		res += " " + moment(date).fromNow();
	}
	return res;
}

async function addCredentials() {
	a = new Alert();
	a.title = "OAuth app credentials";
	a.message = "Please enter the client ID and client secret";
	a.addTextField("Client ID");
	a.addTextField("Client Secret");
	a.addCancelAction("Cancel");
	a.addAction("Continue");
	
	if (await a.presentAlert() === 0) {
		let id = a.textFieldValue(0);
		let secret = a.textFieldValue(1);
		Keychain.set(CLIENT_ID_KEY, id);
		Keychain.set(CLIENT_SECRET_KEY, secret);
		// remove the access token, because it isn't valid anymore if the secret has changed
		if (Keychain.contains(ACCESS_TOKEN_KEY))
			Keychain.remove(ACCESS_TOKEN_KEY);
	}
}

async function authorize() {
  let clientId = Keychain.get(CLIENT_ID_KEY)
  let redirectURL = "scriptable:///run?scriptName=" + Script.name()
  let scope = "gist"
  let baseURL = "https://github.com/login/oauth/authorize"
  let url = baseURL 
    + "?client_id=" + encodeURIComponent(clientId)
    + "&redirect_uri=" + encodeURIComponent(redirectURL)
    + "&scope=" + scope
  Safari.openInApp(url);
}

/**
 * Exchanges an OAuth code to an access token using the GitHub API and stores the access token in the keychain.
 * @param {string} code
*/
async function exchangeCode(code) {
  let clientId = Keychain.get(CLIENT_ID_KEY)
  let clientSecret = Keychain.get(CLIENT_SECRET_KEY)
  let baseURL = "https://github.com/login/oauth/access_token"
  let url = baseURL 
    + "?client_id=" + encodeURIComponent(clientId)
    + "&client_secret=" + encodeURIComponent(clientSecret)
    + "&code=" + encodeURIComponent(code)
  let req = new Request(url)
  req.method = "POST"
  req.headers = {
    "Accept": "application/json"
  }
  let res = await req.loadJSON()
  let accessToken = res.access_token
  Keychain.set(ACCESS_TOKEN_KEY, accessToken)
}

/**
 * Removes all stored credentials.
 */
function removeCredentials(all) {
	if (all) {
		Keychain.remove(CLIENT_ID_KEY)
		Keychain.remove(CLIENT_SECRET_KEY)
	}
	Keychain.remove(ACCESS_TOKEN_KEY)
}

function apiRequest(url) {
	let u = apiURL;
	if (url) u += "/" + url;
	let req = new Request(u);
	if (Keychain.contains(ACCESS_TOKEN_KEY)) {
		// we are authorized
		req.headers = {
			Authorization: "token " + Keychain.get(ACCESS_TOKEN_KEY)
		};
	}
	return req;
}

async function downloadGist(gistID) {
	// Get the data in the Gist
	let req = apiRequest(gistID);
	let res = await req.loadJSON();
	
	let files = Object.values(res.files);
	
	// await QuickLook.present(files);
	
	if (files.length > 5) {
		// more than 5 files? ask the user
		let a = new Alert();
		a.title = res.truncated ? "Too many files" : "More than 5 files";
		a.message = `There are more than ${res.truncated ? 300 : 5} files in this gist. ${res.truncated ? "Only the first 300 files can be imported." : ""}
	
	Do you want to continue?`;
		a.addCancelAction("Quit");
		a.addAction("Continue");
		
		if (await a.presentAlert() === -1) return;
	}
	
	// Get the content of each file
	let contents = await Promise.all(files.map((file) => {
		// if it is truncated, request its contents
		if (file.truncated) {
			return new Request(file.raw_url).loadString();
		}
		// otherwise just return them
		return Promise.resolve(file.content);
	}));
	// update the content in the files array
	contents.forEach((c, i) => (files[i].content = c));
	
	// await QuickLook.present(files);
	
	// Check for files that are already there, but only with different content
	let duplicates = files.filter((f) => {
		f.path = fm.joinPath(fm.documentsDirectory(), f.filename);
		return fm.fileExists(f.path) && fm.readString(f.path) !== f.content;
	});
	
	if (duplicates.length) {
		// we have some files with changed content
		let a = new Alert();
		a.title = duplicates.length + " files are already there";
		a.message = "These files are:\n\n" + duplicates.map(f => f.filename).join("\n");
		
		a.addCancelAction("Cancel whole import");
		a.addDestructiveAction("Override");
		a.addAction("Skip");
		
		switch (await a.presentSheet()) {
			case -1: return;
			case 0: break;
			case 1:
				files = files.filter(f => !duplicates.includes(f));
				break;
		}
	}
	
	// save them to disk
	files.forEach((file) => {
		fm.writeString(file.path, file.content);
	});
	
	// notify the user
	let n = new Notification();
	n.title = Script.name();
	n.body = `\nImported ${files.length} files`;
	n.sound = null;
	n.schedule();
	
	// This is just to add some delay, before we remove the notification again
	let wv = new WebView();
	let end = Date.now() + 2000;
	await wv.loadHTML("<body></body>");
	await wv.evaluateJavaScript(`let diff = ${end} - Date.now();
	diff > 0 ? setTimeout(completion, diff) : completion()`, true);
	
	Notification.removeDelivered([n.identifier]);
}

/**
 * Asks for a Gist URL and returns it
 */
async function askGistUrl(nothingFound, prevFunc) {
	let gistID = Pasteboard.pasteString() || "";
	gistID = regex.test(gistID) ? gistID : "";
	let a = new Alert();
	a.title = nothingFound ? "No Gist URL found" : "Gist URL";
	a.message = "Please enter a Gist url";
	a.addTextField("Gist URL", gistID);
	a.addCancelAction(prevFunc ? "Back" : "Quit");
	a.addAction("Continue");
	a.addAction(Keychain.contains(ACCESS_TOKEN_KEY) ? "Main Menu" : "User Account");
	
	let res = await a.presentAlert();
	switch(res) {
		case -1: return prevFunc && prevFunc();
		case 0:
			gistID = a.textFieldValue(0);
			// has the user entered a Gist URL?
			if (regex.test(gistID))
				await presentSingleGist(getIdFromUrl(gistID), () => askGistUrl(false, prevFunc));
			else await askGistUrl(true, prevFunc);
			break;
		case 1:
			if (Keychain.contains(ACCESS_TOKEN_KEY))
				await presentMainMenu();
			else
				await presentUserSettings();
	}
}

function getIdFromUrl(url) {
	// Get Gist ID from the URL
	return url.split("/").pop();
}

/*

2020-03-01 - v1.1
Download from private Gists
List your own Gists and download them

2019-05-19 - v1.0
Initial release






*/
