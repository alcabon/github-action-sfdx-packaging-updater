const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
// Get the folder parameter value
const folder = core.getInput('folder');

async function run() {
    try {

        let newpath = path.join(process.cwd(), folder);
        process.chdir(newpath);  
        console.log(`The value of the folder parameter is: ${folder}`);
        console.log("The path is: ",newpath);
        
        let sfdxJson = require(newpath + '/sfdx-project.json');
        
        // Reading the content of the README file
        let readmeContent = fs.readFileSync(newpath + '/README.md', 'utf8');

        // We need all package directories
        const packageDirectories = sfdxJson.packageDirectories;

        packageDirectories.forEach((dir) => {
            const package = dir.package;
            const packageKey = package + '@';
            const packageVersionKeys = [];
            const packageVersionIds = [];
            Object.keys(sfdxJson.packageAliases).forEach((packageVersion) => {
                if (packageVersion.startsWith(packageKey)) {
                    packageVersionKeys.push(packageVersion);
                    packageVersionIds.push(
                        sfdxJson.packageAliases[packageVersion]
                    );
                }
            });

            // Only update package version if there's a new release
            if (packageVersionIds.length > 1) {
                const newPackageVersionId =
                    packageVersionIds[packageVersionIds.length - 1];
                // Lets pop things so that we know what to delete
                packageVersionKeys.pop();
                packageVersionIds.pop();
                // Removing all no longer needed package version keys
                packageVersionKeys.forEach((version) => {
                    delete sfdxJson.packageAliases[version];
                });
                // And we need now all IDs to replace them in the README
                packageVersionIds.forEach((id) => {
                    // If you want to use Regex to identify package version id => /04t(.*)\)/
                    readmeContent = readmeContent.replace(
                        id,
                        newPackageVersionId
                    );
                });
            }
        });
        console.log('sfdx-project.json path:' + newpath + '/sfdx-project.json');
        let json_sfdx_project = JSON.stringify(sfdxJson, null, 4).concat('\n');
        console.log('sfdx-project.json content:' + json_sfdx_project);
        // Writing back potential changes to the sfdx-project.json file...
        fs.writeFileSync(
            newpath + '/sfdx-project.json',
            json_sfdx_project ,
            'utf8'
        );
        console.log('readmeContent:' + readmeContent);
        // And finally we're updating the README.
        fs.writeFileSync(newpath + '/README.md', readmeContent, 'utf8');

        core.setOutput('isSuccess', true);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
