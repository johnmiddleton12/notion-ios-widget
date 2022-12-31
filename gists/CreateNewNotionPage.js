const { NOTION_KEY, NOTION_DATABASE_ID } = importModule('/env/config.js');

const createNewPage = async (content) => {
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
                            content: content
                        }
                    }
                ]
            }
        },
    })
    let data = await req.loadJSON();
    return data.url;
};

const createAlert = async () => {
    let alert = new Alert();
    alert.title = "Add task";
    //alert.message = "New page created";
    alert.addTextField("Task name");
    alert.addAction("Add");
    alert.addAction("Add and open");
    alert.addCancelAction("Cancel");
    return alert;
}

const main = async () => {
    let alert = await createAlert();
    let response = await alert.presentAlert();
    if (response == 0) {
        let content = alert.textFieldValue(0);
        await createNewPage(content);
    } else if (response == 1) {
        let content = alert.textFieldValue(0);
        let url = await createNewPage(content);
        Safari.open(url);
    }
}

await main();
