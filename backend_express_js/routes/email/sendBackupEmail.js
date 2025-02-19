const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const collectData = require('./collectData'); // Assuming this function generates the data you want to save

// Create a transporter object using SMTP transport for sending email
const sendEmailWithAttachment = async (filePath, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'muneebbaig200@gmail.com', // Your Gmail address
            pass: 'zlns azos tswi tpkp', // Use an app-specific password if needed
        },
    });

    // Define email options with attachment
    const mailOptions = {
        from: 'muneebbaig200@gmail.com',
        to: 'muneebbaig200@gmail.com', // The recipient email address
        subject: 'Backup Email', // Email subject
        text: message, // Plain text message body
        attachments: [
            {
                filename: path.basename(filePath), // Extract the filename from the file path
                path: filePath, // Path to the file to be attached
            },
        ],
    };

    return transporter.sendMail(mailOptions); // Send email with attachment
};

// Function to save backup data to a file
const saveBackupToFile = (data) => {
    const backupFolder = path.join(__dirname, '../../database_files');

    // Ensure the backup folder exists, create it if it doesn't
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    // Generate a filename with the current date and time
    const currentDateTime = new Date().toISOString().replace(/:/g, '-'); // Make the filename file-safe
    const fileName = `backup_${currentDateTime}.txt`; // You can adjust the extension based on your needs
    const filePath = path.join(backupFolder, fileName);

    // Write the data to the file
    fs.writeFileSync(filePath, data);

    return filePath; // Return the file path for the attachment
};

// Route to handle backup creation and email sending
router.get('/', async (req, res) => {
    try {
        // Collect the backup data (e.g., database data, configuration, etc.)
        const token = await collectData();

        // Save the data to a backup file
        const filePath = saveBackupToFile(token);

        // Send email with the backup file attached
        const emailInfo = await sendEmailWithAttachment(filePath, 'Please find the attached backup.');

        res.json({
            success: true,
            message: 'Backup sent to your email.',
            info: emailInfo,
        });
    } catch (error) {
        console.error('Error while sending email:', error);
        res.json({
            success: false,
            message: 'Backup not sent.',
            error: error.message,
        });
    }
});

module.exports = router;
