// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

console.log(NOTION_KEY);
console.log(NOTION_DATABASE_ID);

// create a new Request object

let baseURI = "https://api.notion.com/v1/databases/";
let queryURI = baseURI + NOTION_DATABASE_ID + "/query";

let req = new Request(queryURI);

// set the method
req.method = "POST";

// set the headers
req.headers = {
    Authorization: `Bearer ${NOTION_KEY}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-02-22",
};

// set the body
req.body = JSON.stringify({
    page_size: 4,
    /*
    filter: {
            "property": "Tags",
            "multi_select": {
                contains: "WORK",
            },
    },
    */
    // sort by time created
    sorts: [
        {
            timestamp: "created_time",
            direction: "descending",
        },
    ],
});

// send the request
let data = await req.loadJSON();
let results = data.results;

let messages = results.map((page) => {
    return page.properties['Task name'].title[0].plain_text;
});

let urls = results.map((page) => {
    return page.url;
});

const widget = new ListWidget()

//widget.addSpacer(4)

//widget.setPadding(10, 10, 10, 10)

let row = widget.addStack()
//row.layoutHorizontally()

let column = row.addStack()
column.layoutVertically()

let column2 = row.addStack()
column2.layoutVertically()
column2.centerAlignContent()

column.spacing = 4

// gray line
let line = new Rect(0, 0, 200, 4)
let lineView = new DrawContext()
lineView.opaque = false
lineView.respectScreenScale = true
lineView.size = line.size
lineView.setFillColor(Color.gray())
lineView.fillRect(line)
let lineImage = lineView.getImage()

// add tasks 
for (let i = 0; i < messages.length; i++) {
    // set message to first 30 characters, add ellipsis if longer
    let message = messages[i].length > 26 ? messages[i].substring(0, 26) + "..." : messages[i]
    let url = urls[i]

    let text = column.addText(message)
    text.url = url
    text.font = Font.boldSystemFont(14)
    text.lineLimit = 1
    //text.minimumScaleFactor = 0.5
    text.textColor = Color.white()

    // add a gray line between tasks
    let lineImageView = column.addImage(lineImage)
    lineImageView.centerAlignImage()
    lineImageView.imageSize = new Size(200, 4)

}

// add plus button
let plusSymbol = SFSymbol.named("doc.badge.plus")
let plusImage = column2.addImage(plusSymbol.image)
plusImage.centerAlignImage()
plusImage.imageSize = new Size(40, 40)
plusImage.tintColor = Color.white()

// set the url to a request to make a new page in the database
plusImage.url = "https://api.notion.com/v1/pages"


if (config.runsInWidget) {
    Script.setWidget(widget)
} else {
    widget.presentMedium()
}
