// Import required modules
const connectDB = require('./db');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv'); // Added dotenv import
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email from .env
        pass: process.env.EMAIL_PASS // Password from .env
    }
});

// Function to generate e-ticket PDF
async function generateETicket(bookingDetails) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 300]); // Set page size

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();

    // Add content to the PDF
    page.drawText('E-Ticket', {
        x: 50,
        y: height - 50,
        size: 24,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Booking ID: ${bookingDetails.bookingId}`, {
        x: 50,
        y: height - 100,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Name: ${bookingDetails.name}`, {
        x: 50,
        y: height - 130,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Dates: ${bookingDetails.dates}`, {
        x: 50,
        y: height - 160,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Price: $${bookingDetails.price}`, {
        x: 50,
        y: height - 190,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    // Save the PDF and return it as a byte array
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// Test endpoint to check if the server is running
app.get('/test', (req, res) => {
    res.send('Server is running!');
});

// Endpoint to send booking confirmation email
app.post('/send-booking-email', async (req, res) => {
    try {
        const { email, name, bookingId, dates, price, cancellationPolicy } = req.body;

        // Validate request body
        if (!email || !name || !bookingId || !dates || price === undefined || !cancellationPolicy) {
            return res.status(400).json({ error: 'Missing required fields in the request body.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }

        // Generate the e-ticket PDF
        const pdfBytes = await generateETicket({ bookingId, name, dates, price });

        // Email options with e-ticket attachment
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Booking Confirmation',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h1 { font-size: 24px; color: #333; }
                        p { font-size: 16px; color: #555; }
                        ul { list-style-type: none; padding: 0; }
                        li { margin-bottom: 10px; }
                        @media (max-width: 600px) {
                            h1 { font-size: 20px; }
                            p { font-size: 14px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Booking Confirmation</h1>
                        <p>Your booking has been confirmed. Below are the details:</p>
                        <ul>
                            <li><strong>Booking ID:</strong> ${bookingId}</li>
                            <li><strong>Dates:</strong> ${dates}</li>
                            <li><strong>Price:</strong> $${price}</li>
                            <li><strong>Cancellation Policy:</strong> ${cancellationPolicy}</li>
                        </ul>
                        <p>Thank you for choosing us!</p>
                        <p>Support Contact: support@nullclass.com</p>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'e-ticket.pdf',
                    content: Buffer.from(pdfBytes), // Attach the PDF
                },
            ],
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Error sending email: ' + error.message });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ message: 'Email sent successfully' });
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// Function to start the server
const startServer = (port) => {
    const portNumber = Number(port);

    // Validate the port number
    if (isNaN(portNumber) || portNumber < 0 || portNumber >= 65536) {
        console.error('Invalid port number:', portNumber);
        process.exit(1);
    }

    const server = app.listen(portNumber, () => {
        console.log(`Server running on http://localhost:${portNumber}`);
    });

    // Handle port conflicts
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${portNumber} is already in use. Trying another port...`);
            startServer(portNumber + 1); // Try the next port
        } else {
            console.error('Server error:', error);
        }
    });
};

// Start the server
let PORT = process.env.PORT || 40001;
startServer(PORT);

// Endpoint to handle booking cancellation
app.post('/cancel-booking', (req, res) => {
    const { bookingId, price, cancellationTime } = req.body;

    // Validate request body
    if (!bookingId || !price || cancellationTime === undefined) {
        return res.status(400).json({ error: 'Missing required fields in the request body.' });
    }

    // Calculate refund amount based on cancellation policy
    const refundPercentage = (cancellationTime < 24) ? 0.5 : 0; // 50% refund if <24h
    const refundAmount = price * refundPercentage;

    // Simulate refund processing
    setTimeout(() => {
        res.status(200).json({
            message: `Refund of $${refundAmount} initiated. It will be processed within 5-7 business days.`,
            refundAmount,
        });
    }, 2000); // Simulate a 2-second delay
});
// Endpoint to calculate loyalty points and update tier
app.post('/calculate-points', (req, res) => {
    const { userId, bookingAmount } = req.body;

    // Validate request body
    if (!userId || !bookingAmount) {
        return res.status(400).json({ error: 'Missing required fields in the request body.' });
    }

    // Calculate points (100 points per $100 spent)
    const pointsEarned = Math.floor(bookingAmount / 100) * 100;

    // Simulate updating user's points and tier in the database
    const user = {
        userId,
        points: pointsEarned,
        tier: calculateTier(pointsEarned), // Calculate tier based on points
    };

    // Check points expiry
    const expiryReminder = checkPointsExpiry(user);

    // Add tier benefits
    const tierBenefits = {
        Silver: '10% off on your next booking!',
        Gold: '20% off on your next booking!',
        Platinum: '30% off on your next booking!',
    };

    // Return the updated user data
    res.status(200).json({
        message: 'Points calculated successfully.',
        user,
        expiryReminder,
        tierBenefits: tierBenefits[user.tier],
    });
});

// Function to calculate tier based on points
function calculateTier(points) {
    if (points >= 1000) return 'Platinum';
    if (points >= 500) return 'Gold';
    return 'Silver';
}

// Function to check points expiry
function checkPointsExpiry(user) {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); // Points expire in 6 months

    if (user.points > 0 && new Date() > expiryDate) {
        return `Your ${user.points} points will expire on ${expiryDate.toDateString()}.`;
    }
    return null;
}

// Endpoint to fetch points history
app.get('/points-history', (req, res) => {
    const userId = req.query.userId;

    // Validate userId
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in query parameters.' });
    }

    // Simulate points history (replace with database query in production)
    const pointsHistory = [
        { date: '2023-10-01', points: 100, description: 'Booking #123' },
        { date: '2023-10-05', points: 200, description: 'Booking #124' },
        { date: '2023-10-10', points: 300, description: 'Booking #125' },
    ];

    // Return the points history
    res.status(200).json({ pointsHistory });
});