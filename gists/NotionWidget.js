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
    filter: {
            "property": "Tags",
            "multi_select": {
                contains: "WORK",
            },
    },
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

let page1 = results[0];
let message = page1.properties['Task name'].title[0].plain_text;

let param = config.widgetParameter
if (param != null && param.length > 0) {
    message = param
}

const widget = new ListWidget()

widget.url = page1.url

widget.addSpacer(4)

widget.setPadding(10, 10, 10, 10)

let row = widget.addStack()
row.layoutHorizontally()

let column = row.addStack()
column.layoutVertically()

column.addText(message)
column.addText("Version: development")

let currentTime = new Date().toLocaleTimeString('de-DE', { hour: "numeric", minute: "numeric" })

column.addText(currentTime)

if (config.runsInWidget) {
    Script.setWidget(widget)
} else {
    widget.presentSmall()
}