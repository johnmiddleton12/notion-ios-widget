const updateGists = async () => {
    // run KeepGistsUpdated.js to update the script
    const keepGistsUpdated = importModule('KeepGistsUpdatedModule.js');
    await keepGistsUpdated.downloadGist(keepGistsUpdated.gistID);
}

await updateGists();
