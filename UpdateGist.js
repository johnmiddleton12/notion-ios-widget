// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: download;
// share-sheet-inputs: url;

let gistID = "818d8e8a49c121f5fdadb658930916a7";

await downloadGist(gistID);

async function downloadGist(gistID) {
	// Get the data in the Gist
	let req = apiRequest(gistID);
	let res = await req.loadJSON();
	
	let files = Object.values(res.files);
	
	// await QuickLook.present(files);
	
	if (files.length > 5) {
		// more than 5 files? ask the user
		let a = new Alert();
		a.title = res.truncated ? "Too many files" : "More than 5 files";
		a.message = `There are more than ${res.truncated ? 300 : 5} files in this gist. ${res.truncated ? "Only the first 300 files can be imported." : ""}
	
	Do you want to continue?`;
		a.addCancelAction("Quit");
		a.addAction("Continue");
		
		if (await a.presentAlert() === -1) return;
	}
	
	// Get the content of each file
	let contents = await Promise.all(files.map((file) => {
		// if it is truncated, request its contents
		if (file.truncated) {
			return new Request(file.raw_url).loadString();
		}
		// otherwise just return them
		return Promise.resolve(file.content);
	}));
	// update the content in the files array
	contents.forEach((c, i) => (files[i].content = c));
	
	// await QuickLook.present(files);
	
	// Check for files that are already there, but only with different content
	let duplicates = files.filter((f) => {
		f.path = fm.joinPath(fm.documentsDirectory(), f.filename);
		return fm.fileExists(f.path) && fm.readString(f.path) !== f.content;
	});
	
	if (duplicates.length) {
		// we have some files with changed content
		let a = new Alert();
		a.title = duplicates.length + " files are already there";
		a.message = "These files are:\n\n" + duplicates.map(f => f.filename).join("\n");
		
		a.addCancelAction("Cancel whole import");
		a.addDestructiveAction("Override");
		a.addAction("Skip");
		
		switch (await a.presentSheet()) {
			case -1: return;
			case 0: break;
			case 1:
				files = files.filter(f => !duplicates.includes(f));
				break;
		}
	}
	
	// save them to disk
	files.forEach((file) => {
		fm.writeString(file.path, file.content);
	});
	
	// notify the user
	let n = new Notification();
	n.title = Script.name();
	n.body = `\nImported ${files.length} files`;
	n.sound = null;
	n.schedule();
	
	// This is just to add some delay, before we remove the notification again
	let wv = new WebView();
	let end = Date.now() + 2000;
	await wv.loadHTML("<body></body>");
	await wv.evaluateJavaScript(`let diff = ${end} - Date.now();
	diff > 0 ? setTimeout(completion, diff) : completion()`, true);
	
	Notification.removeDelivered([n.identifier]);
}
