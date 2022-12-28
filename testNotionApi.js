const { NOTION_KEY, NOTION_DATABASE_ID } = require('./env/config.js');

const dotenv = require("dotenv");
dotenv.config();

var request = require("request");
var options = {
    method: "POST",
    url: `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
    headers: {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-02-22",
    },
    body: JSON.stringify({
        page_size: 10,
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

    }),
};
request(options, function (error, response) {
    if (error) throw new Error(error);
    // console.log(response.body);

    let data = JSON.parse(response.body);
    let results = data.results;

    // console.log(results);

    for (let i = 0; i < results.length; i++) {
        let page = results[i];

        console.log(page.properties['Task name'].title[0].plain_text);
        console.log(page.url);

    }

});
