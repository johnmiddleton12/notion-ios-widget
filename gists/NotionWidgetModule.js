// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

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

const createWidget = async (debug) => {

    let pages = await fetchPages();
    let messages = pages.map((page) => {
        return page.properties['Task name'].title[0].plain_text;
    });
    let urls = pages.map((page) => {
        return page.url;
    });

    // MAIN WIDGET

    const widget = new ListWidget()
    widget.backgroundColor = new Color("#1f2024")
    widget.setPadding(0, 0, 0, 0)
    widget.url = "https://www.notion.so/" + NOTION_DATABASE_ID

    // ROW

    let row = widget.addStack()
    row.layoutHorizontally()
    row.setPadding(14, 0 + 20, 10, 15 + 20)
    row.url = "https://www.notion.so/" + NOTION_DATABASE_ID

    // LEFT COLUMN

    let left_column = row.addStack()
    left_column.layoutVertically()

    // add My Tasks header
    let header = left_column.addStack()
    let headerText = header.addText("My Tasks")
    headerText.font = Font.systemFont(18)
    headerText.textColor = Color.white()

    left_column.addSpacer(60)

    // add plus button
    let plus = left_column.addStack()
    plus.bottomAlignContent()
    let plusSymbol = SFSymbol.named("square.and.pencil")
    let plusImage = plus.addImage(plusSymbol.image)
    plusImage.centerAlignImage()
    plusImage.imageSize = new Size(40, 40)
    plusImage.tintColor = Color.white()
    // set the url to run the CreateNewNotionPage.js script
    plusImage.url = "scriptable:///run/CreateNewNotionPage"

    // END LEFT COLUMN 

    row.addSpacer(21)

    // RIGHT COLUMN

    let right_column = row.addStack()
    right_column.layoutVertically()
    right_column.setPadding(3, 0, 0, 10)

    // add tasks 
    let tasks = []
    for (let i = 0; i < messages.length; i++) {
        // set message to first 30 characters, add ellipsis if longer
        let message = messages[i].length > 26 ? messages[i].substring(0, 26) + "..." : messages[i]
        let url = urls[i]

        let task = right_column.addStack()
        tasks.push(task)
        let text = task.addText(message)
        text.url = url
        text.font = Font.systemFont(14)
        text.lineLimit = 1
        text.textColor = Color.white()

        if (i < messages.length - 1) {
            right_column.addSpacer(16)
        }

    }

    // END RIGHT COLUMN

    row.addSpacer()

    // END ROW

    stacks = [
        widget,
        row,
        left_column, header, plus,
        right_column, ...tasks
    ]

    if (debug) {
        stacks.forEach((stack) => {
            stack.borderWidth = 1
            stack.borderColor = Color.white()
        })
    }

    return widget
}

async function main() {
    
    const debug = false

    let widget = await createWidget(debug);

    // only present the widget in a medium size
    if (config.runsInWidget) {
        if (config.widgetFamily === "medium") {
            Script.setWidget(widget)
        } else {
            let smallWidget = new ListWidget()
            smallWidget.setPadding(15, 15, 15, 15)
            let text = smallWidget.addText("Please use the medium widget size.")
            text.font = Font.systemFont(14)
            text.textColor = Color.white()
            Script.setWidget(smallWidget)
        }
    } else {
        widget.presentMedium()
    }
}

module.exports = {
    main
}
