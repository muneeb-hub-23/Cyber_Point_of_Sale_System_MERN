const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.post('/', (req, res) => {
    const backendScript = path.join(__dirname, 'update_backend.bat');
    const frontendScript = path.join(__dirname, 'update_frontend.bat');
    const buildScript = path.join(__dirname, 'make_build.bat');
    const statusFilePath = path.join(__dirname, 'fixed/status');

    // Set response as JSON
    res.setHeader('Content-Type', 'application/json');

    // Helper function to execute a script
    const executeScript = (scriptPath, scriptName) => {
        return new Promise((resolve, reject) => {
            exec(scriptPath, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing ${scriptName}: ${error.message}`);
                    return reject(`Error executing ${scriptName}: ${error.message}`);
                }
                if (stderr) {
                    console.warn(`${scriptName} stderr: ${stderr}`);
                }
                console.log(`${scriptName} output: ${stdout}`);
                resolve(stdout);
            });
        });
    };

    // Read the status file
    const readStatusFile = () => {
        if (fs.existsSync(statusFilePath)) {
            return fs.readFileSync(statusFilePath, 'utf8').trim() === 'true';
        }
        return false;
    };

    // Write to the status file
    const writeStatusFile = (value) => {
        fs.writeFileSync(statusFilePath, value ? 'true' : 'false', 'utf8');
    };

    // Check the current status of backend update
    const isBackendUpdated = readStatusFile();

    const updateFrontendAndBuild = async () => {
        try {
            const frontendOutput = await executeScript(frontendScript, 'Frontend Update');
            const buildOutput = await executeScript(buildScript, 'Build Creation');
            writeStatusFile(false); // Reset the status
            res.json({
                success: true,
                steps: [
                    { step: 'Frontend Update', output: frontendOutput },
                    { step: 'Build Creation', output: buildOutput },
                ],
            });
        } catch (error) {
            res.json({ success: false, message: error });
        }
    };

    if (!isBackendUpdated) {
        // Update backend first
        executeScript(backendScript, 'Backend Update')
            .then((backendOutput) => {
                writeStatusFile(true); // Mark backend as updated
                return updateFrontendAndBuild();
            })
            .catch((error) => {
                res.json({ success: false, message: error });
            });
    } else {
        // Skip backend and proceed with frontend and build
        updateFrontendAndBuild();
    }
});

module.exports = router;
