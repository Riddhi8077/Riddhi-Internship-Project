const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email (from .env file)
        pass: process.env.EMAIL_PASS  // Your app password (from .env file)
    }
});

// Test endpoint to check if the server is running
app.get('/test', (req, res) => {
    res.send('Server is running!');
});

// Endpoint to send booking confirmation email
app.post('/send-booking-email', (req, res) => {
    const { email, name, bookingId, dates, price, cancellationPolicy } = req.body;

    // Validate request body
    if (!email || !name || !bookingId || !dates || !price || !cancellationPolicy) {
        return res.status(400).send('Missing required fields in the request body.');
    }

    // Enhanced email template
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Booking Confirmation',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h1 style="color: #4CAF50; text-align: center;">Booking Confirmation</h1>
                <p style="font-size: 16px;">Dear ${name},</p>
                <p style="font-size: 16px;">Your booking has been confirmed. Below are the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Booking ID</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${bookingId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Dates</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${dates}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Price</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${price}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Cancellation Policy</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${cancellationPolicy}</td>
                    </tr>
                </table>
                <p style="font-size: 16px;">Thank you for choosing us! If you have any questions, feel free to contact us at <a href="mailto:support@nullclass.com" style="color: #4CAF50; text-decoration: none;">support@nullclass.com</a>.</p>
                <p style="font-size: 16px; text-align: center; margin-top: 20px;">
                    <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Booking</a>
                </p>
                <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">&copy; 2024 Internship Project. All rights reserved.</p>
            </div>
        `
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending email: ' + error.message);
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Email sent successfully');
        }
    });
});

// Function to start the server
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    // Handle port conflicts
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying another port...`);
            startServer(port + 1); // Try the next port
        } else {
            console.error('Server error:', error);
        }
    });
};

// Start the server
startServer(PORT);