// Function for Download E-Ticket
function downloadETicket() {
    alert("E-Ticket downloaded successfully!");
}

// Function for Cancel Booking
function cancelBooking() {
    const reason = document.getElementById('reason').value;
    if (!reason) {
        alert("Please select a reason for cancellation.");
        return;
    }

    const bookingId = "123456"; // Replace with dynamic booking ID
    const price = 500; // Replace with dynamic price
    const cancellationTime = 12; // Replace with actual cancellation time in hours

    fetch('http://localhost:40001/cancel-booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, price, cancellationTime }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const refundStatus = document.getElementById('refund-status');
        refundStatus.textContent = data.message;
        refundStatus.style.color = "green";
    })
    .catch(error => {
        console.error('Error:', error);
        const refundStatus = document.getElementById('refund-status');
        refundStatus.textContent = "Failed to process cancellation. Please try again.";
        refundStatus.style.color = "red";
    });
}

// Function for Redeem Points
function redeemPoints() {
    const userId = "123"; // Replace with dynamic user ID
    const bookingAmount = 500; // Replace with dynamic booking amount

    fetch('http://localhost:40001/calculate-points', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, bookingAmount }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const pointsEarned = document.getElementById('points-earned');
        const currentTier = document.getElementById('current-tier');
        const exclusiveDeals = document.getElementById('exclusive-deals');
    
        pointsEarned.textContent = data.user.points;
        currentTier.textContent = data.user.tier;
        exclusiveDeals.textContent = data.tierBenefits;
    
        if (data.expiryReminder) {
            alert(data.expiryReminder);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to redeem points. Please try again.');
    });
}

// Function for Calculate Points
function calculatePoints() {
    const amount = document.getElementById('amount').value;
    if (!amount || amount < 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const points = Math.floor(amount) * 100; // 100 points per $100
    const pointsResult = document.getElementById('points-result');
    pointsResult.textContent = `You will earn ${points} points!`;
    pointsResult.style.color = "green";
}

// Form Submission for Booking
document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const date = document.getElementById('date').value;
    const price = document.getElementById('price').value;

    const bookingId = "123456";
    const cancellationPolicy = "50% refund if canceled within 24 hours.";

    const requestBody = {
        email: email,
        bookingId: bookingId,
        dates: date,
        price: parseInt(price),
        cancellationPolicy: cancellationPolicy,
        name: name
    };

    console.log("requestBody:", requestBody);

    fetch('https://internship-backend-1-jcgd.onrender.com/send-booking-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        const bookingStatus = document.getElementById('booking-status');
        bookingStatus.textContent = `Booking confirmed for ${name} on ${date}. Confirmation sent to ${email}.`;
        bookingStatus.style.color = "green";
    })
    .catch(error => {
        console.error('Error:', error);
        const bookingStatus = document.getElementById('booking-status');
        bookingStatus.textContent = "Failed to send booking confirmation. Please try again.";
        bookingStatus.style.color = "red";
    });
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle.querySelector('i');

darkModeToggle.addEventListener('click', function () {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
});

function fetchPointsHistory() {
    const userId = "123"; // Replace with dynamic user ID

    fetch(`http://localhost:40001/points-history?userId=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const pointsHistoryList = document.getElementById('points-history-list');
            pointsHistoryList.innerHTML = ''; // Clear previous content

            data.pointsHistory.forEach(entry => {
                const listItem = document.createElement('li');
                listItem.textContent = `${entry.date}: ${entry.points} points - ${entry.description}`;
                pointsHistoryList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching points history:', error);
            alert('Failed to fetch points history. Please try again.');
        });
}

// Call the function when the page loads
fetchPointsHistory();