// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const downloadNotionWidget = async () => {

    const gistID = "c15ecdc2826d105c04f93aa05facc136";
    const apiURL = "https://api.github.com/gists";

    // prefer saving to iCloud, but if it wasn't enabled, fall back to local
    let fm;
    try {
        fm = FileManager.iCloud();
    } catch (ex) {
        fm = FileManager.local();
    }

    // Get the data in the Gist
    let url = apiURL + "/" + gistID;
    let req = new Request(url);
    let res = await req.loadJSON();

    let files = Object.values(res.files);

    // for each file in the gist
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        // if it's a file we want
        if (file.filename == "NotionWidgetModule.js" || file.filename == "CreateNewNotionPage.js") {
            // get the path
            let path = fm.joinPath(fm.documentsDirectory(), file.filename);
            // and the contents
            let content = await file.content;
            if (file.truncated) {
                content = await new Request(file.raw_url).loadString();
            }
            // and write it
            console.log("Writing " + file.filename);
            fm.writeString(path, content);
        }
    }

}

async function main() {

    // if NotionWidget.js doesn't exist, or debug is on, download it
    // also download it if the file is older than 1 day
    let fm = FileManager.iCloud();
    let path = fm.joinPath(fm.documentsDirectory(), "NotionWidgetModule.js");
    let path2 = fm.joinPath(fm.documentsDirectory(), "CreateNewNotionPage.js");

    try {
        if (!fm.fileExists(path) || (Date.now() - fm.modificationDate(path)) > 86400000 ||
            !fm.fileExists(path2) || (Date.now() - fm.modificationDate(path2)) > 86400000 ||
            config.runsInApp) {
            console.log("Downloading Dependencies");
            await downloadNotionWidget();
        }
    } catch (ex) {

        console.log("Error downloading NotionWidgetModule.js");

        if (!fm.fileExists(path) || !fm.fileExists(path2)) {
            // display error message in widget
            let widget = new ListWidget();
            widget.setPadding(10, 10, 10, 10);
            widget.addText("Error: Missing Dependencies");
            Script.setWidget(widget);
            Script.complete();
        } 
    } 

    // run NotionWidget.js
    const notionWidget = importModule('NotionWidgetModule.js');
    await notionWidget.main();

}

await main();
