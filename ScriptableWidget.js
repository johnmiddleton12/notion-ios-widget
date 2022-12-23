// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

//@ts-check

/**
 * Create the widget
 * @param {{widgetParameter: string, debug: string}} config widget configuration
 */
async function createWidget(config) {
    const log = config.debug ? console.log.bind(console) : function () {};
    log(JSON.stringify(config, null, 2))

    let message = 'Hello World!'
    let param = config.widgetParameter
    if (param != null && param.length > 0) {
        message = param
    }

    // @ts-ignore
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

    return widget
}

module.exports = {
    createWidget
}