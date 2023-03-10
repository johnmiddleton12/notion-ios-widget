# Notion iOS Tasks Widget :blue_book:

This is a widget made using the [Scriptable](https://scriptable.app/) app for iOS.

I used to use Google Tasks to keep track of things, but now use Notion - however, they don't have any usable widgets. This is built as a better replacement to the Google Tasks widget, to be used with the Notion app.

It displays the 4 most recently added items in a database, along with providing a button to add a new item in that database. Each item links to its corresponding page in the Notion database.

### Scriptable Widget, using Notion Database

![Notion Widget Screenshot](/images/WidgetScreenshot.png "Notion Widget Screenshot")

### Google Tasks Widget

![Google Tasks Widget Screenshot](/images/GoogleTasksWidgetScreenshot.png "Google Tasks Widget Screenshot")

## Usage

### Scriptable Setup

First we will setup the widget script and allow it be easily updated.

1. Install the Scriptable App to your iOS device
2. Navigate to this [Gist](https://gist.github.com/johnmiddleton12/c15ecdc2826d105c04f93aa05facc136) on your iOS device
3. Go to the Raw view of "NotionWidget.js"
4. Select All and Copy
5. Navigate to Scriptable, create a new script, and paste the code from "NotionWidget.js"
6. This will give you the NotionWidget script, which will automatically download the latest version every day when put in a Widget. Additionally, running the NotionWidget script in the Scriptable App will manually download the latest version.
### Notion API Setup
Next we need to set up the Notion API key and Database IDs

1. Follow this tutorial - [Link](https://developers.notion.com/docs/create-a-notion-integration) to set up an integration with Notion, and retrieve a **Notion API key** and a **Notion Database ID**
2. Navigate to the Files app on your iOS device, and navigate to the folder where Scriptable scripts are stored
3. Create a folder called `env/`
4. In that folder, create a file called `config.js` and paste the following code, replacing insert here with the values you got from Notion
```javascript
const NOTION_KEY = "INSERT HERE"
const NOTION_DATABASE_ID = "INSERT HERE"

module.exports = {NOTION_KEY, NOTION_DATABASE_ID}
```
### Final Setup

1. Add a **Medium** sized widget to your home screen from Scriptable
2. Hold down on the widget and choose the script NotionWidget from the list
3. Done!

## To-Do

- Add local storage for offline usage
- Prettify 
- Add small / xl widget sizes
