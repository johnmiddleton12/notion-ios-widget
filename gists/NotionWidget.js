// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

const downloadNotionWidget = async () => {
    const gistID = "c15ecdc2826d105c04f93aa05facc136";

    let apiURL = "https://api.github.com/gists";

    // prefer saving to iCloud, but if it wasn't enabled, fall back to local
    let fm;
    try {
        fm = FileManager.iCloud();
    } catch (ex) {
        fm = FileManager.local();
    }

    const apiRequest = (url) => {
        let u = apiURL;
        if (url) u += "/" + url;
        let req = new Request(u);
        return req;
    }

    // Get the data in the Gist
    let req = apiRequest(gistID);
    let res = await req.loadJSON();
    
    let files = Object.values(res.files);

    // Get the file named "NotionWidget.js"
    let file = files.find(f => f.filename == "NotionWidget.js");

    let contents = await file.content;
    let path = fm.joinPath(fm.documentsDirectory(), file.filename);
    if (file.truncated) {
        contents = await new Request(file.raw_url).loadString();
    }

    console.log(contents);
    console.log(path);

    fm.writeString(path, contents);

}

async function main() {

    let debug = true;

    // if NotionWidget.js doesn't exist, or debug is on, download it
    // also download it if the file is older than 1 day
    let fm = FileManager.iCloud();
    let path = fm.joinPath(fm.documentsDirectory(), "NotionWidget.js");
    if (!fm.fileExists(path) || debug || (Date.now() - fm.modificationDate(path)) > 86400000) {
        await downloadNotionWidget();
    }

    // run NotionWidget.js
    const notionWidget = importModule('NotionWidget.js');
    await notionWidget.main(debug);

}

await main();
