// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

let message = 'Helloooo Woooooorld!'
let param = config.widgetParameter
if (param != null && param.length > 0) {
    message = param
}

const widget = new ListWidget()

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