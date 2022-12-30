// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

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
        properties: {
            "Task name": {
                title: [
                    {
                        text: {
                            content: "Hello"
                        }
                    }
                ]
            }
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

    // ROW

    let row = widget.addStack()
    row.layoutHorizontally()
    row.setPadding(5, 15, 5, 15)
    row.url = "https://www.notion.so/" + NOTION_DATABASE_ID

    // LEFT COLUMN

    let left_column = row.addStack()
    left_column.layoutVertically()

    // add My Tasks header
    let header = left_column.addStack()
    let headerText = header.addText("My Tasks")
    headerText.font = Font.boldSystemFont(18)
    headerText.textColor = Color.white()

    left_column.addSpacer(75)

    // add plus button
    let plus = left_column.addStack()
    plus.bottomAlignContent()
    let plusSymbol = SFSymbol.named("doc.badge.plus")
    let plusImage = plus.addImage(plusSymbol.image)
    plusImage.centerAlignImage()
    plusImage.imageSize = new Size(40, 40)
    plusImage.tintColor = Color.white()
    // set the url to a returned request to make a new page in the database
    // TODO: currently this creates a new page every time the widget is refreshed
    //plusImage.url = await createNewPage();

    // END LEFT COLUMN 

    row.addSpacer(16)

    // RIGHT COLUMN

    let right_column = row.addStack()
    right_column.layoutVertically()
    right_column.setPadding(6, 0, 0, 0)

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
        row, left_column, header, plus,
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

async function main(debug) {
    let widget = await createWidget(debug);

    if (config.runsInWidget) {
        Script.setWidget(widget)
    } else {
        widget.presentMedium()
    }
}

module.exports = {
    main
}
