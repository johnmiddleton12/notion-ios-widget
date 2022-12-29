// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

const debug = false

const updateSelf = async () => {
    // call the KeepGistsUpdated script to update this script
    const keepGistsUpdated = importModule('KeepGistsUpdated');
    await keepGistsUpdated.downloadGist(keepGistsUpdated.gistID);
}

const createNewPage = async () => {
    let req = new Request(`https://api.notion.com/v1/pages`);
    req.method = "POST";
    req.headers = {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-02-22",
    }
    req.body = JSON.stringify({
        parent: {
            database_id: NOTION_DATABASE_ID,
        },
    })
    let data = await req.loadJSON();
    return data.url;
};

const fetchPages = async () => {
    let baseURI = "https://api.notion.com/v1/databases/";
    let queryURI = baseURI + NOTION_DATABASE_ID + "/query";
    let req = new Request(queryURI);
    req.method = "POST";
    req.headers = {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-02-22",
    };
    req.body = JSON.stringify({
        page_size: 4,
        // sort by created time and only show uncompleted tasks
        filter: {
            property: "Status",
            status: {
                does_not_equal: "Done",
            },
        },
        sorts: [
            {
                timestamp: "created_time",
                direction: "descending",
            },
        ],
    });
    let data = await req.loadJSON();
    let results = data.results;
    return results;
};

const createWidget = async () => {

    let pages = await fetchPages();
    let messages = pages.map((page) => {
        return page.properties['Task name'].title[0].plain_text;
    });
    let urls = pages.map((page) => {
        return page.url;
    });

    // MAIN WIDGET

    const widget = new ListWidget()
    widget.setPadding(0, 0, 0, 0)

    // ROW

    let row = widget.addStack()
    row.layoutHorizontally()
    row.setPadding(35, 17, 35, 17)

    // LEFT COLUMN

    let left_column = row.addStack()
    left_column.layoutVertically()
    if (debug) {
        left_column.borderWidth = 1
        left_column.borderColor = Color.white()
    }
    //left_column.setPadding(0, 0, 0, 0)

    //row.addSpacer(16)

    // add My Tasks header
    let header = left_column.addStack()
    let headerText = header.addText("My Tasks")
    headerText.font = Font.boldSystemFont(18)
    headerText.textColor = Color.white()
    header.addSpacer(20)

    left_column.addSpacer(80)

    // add plus button
    let plus = left_column.addStack()
    let plusSymbol = SFSymbol.named("doc.badge.plus")
    let plusImage = plus.addImage(plusSymbol.image)
    plusImage.centerAlignImage()
    plusImage.imageSize = new Size(30, 30)
    plusImage.tintColor = Color.white()
    // set the url to a returned request to make a new page in the database
    plusImage.url = await createNewPage();
    plus.addSpacer(20)

    // END LEFT COLUMN 

    // RIGHT COLUMN

    let right_column = row.addStack()
    right_column.layoutVertically()
    right_column.setPadding(4, 0, 0, 0)

    if (debug) {
        right_column.borderWidth = 1
        right_column.borderColor = Color.white()
    }

    // add tasks 
    for (let i = 0; i < messages.length; i++) {
        // set message to first 30 characters, add ellipsis if longer
        let message = messages[i].length > 26 ? messages[i].substring(0, 26) + "..." : messages[i]
        let url = urls[i]

        let task = right_column.addStack()
        let text = task.addText(message)
        task.addSpacer(20)
        text.url = url
        text.font = Font.systemFont(14)
        text.lineLimit = 1
        text.textColor = Color.white()

        if (i < messages.length - 1) {
            right_column.addSpacer(16)
        }

    }

    // END RIGHT COLUMN

    // END ROW

    return widget
}

async function main() {

    // update if the time is 0:00, 6:00, 12:00, or 18:00
    // this is to avoid hitting the GitHub API rate limit
    // or if the script is run manually
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();

    if (hour % 6 == 0 && minute == 0 || config.runsInApp) {
        //await updateSelf();
    }

    let widget = await createWidget();

    if (config.runsInWidget) {
        Script.setWidget(widget)
    } else {
        widget.presentMedium()
    }
}

await main();
