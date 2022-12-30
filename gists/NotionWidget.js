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

    // Get the file named "NotionWidget.js"
    let file = files.find(f => f.filename == "NotionWidgetModule.js");

    // Get the contents of the file
    let contents = await file.content;
    let path = fm.joinPath(fm.documentsDirectory(), file.filename);
    if (file.truncated) {
        contents = await new Request(file.raw_url).loadString();
    }

    // Save the file 
    fm.writeString(path, contents);
}

async function main() {

    // if NotionWidget.js doesn't exist, or debug is on, download it
    // also download it if the file is older than 1 day
    let fm = FileManager.iCloud();
    let path = fm.joinPath(fm.documentsDirectory(), "NotionWidgetModule.js");

    try {
        if (!fm.fileExists(path) || config.runsInApp || (Date.now() - fm.modificationDate(path)) > 86400000) {
            console.log("Downloading NotionWidgetModule.js");
            await downloadNotionWidget();
        }
    } catch (ex) {
        
        console.log("Error downloading NotionWidgetModule.js");

        if (!fm.fileExists(path)) {
            // display error message in widget
            let widget = new ListWidget();
            widget.addText("Error: NotionWidgetModule.js not found");
            Script.setWidget(widget);
            Script.complete();
        } 
    } 

    // run NotionWidget.js
    const notionWidget = importModule('NotionWidgetModule.js');
    await notionWidget.main();

}

await main();
