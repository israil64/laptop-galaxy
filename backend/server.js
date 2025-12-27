const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Tool to read files
const path = require('path');
const bcrypt = require('bcryptjs'); // Import at the top

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Helper: Read Users
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// --- AUTH ROUTES ---

// 1. SIGNUP
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const users = await readUsers();

    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password (encrypt it)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now(),
        username,
        email,
        password: hashedPassword,
        role: 'user' // Default role
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ message: "Signup successful! Please login." });
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const users = await readUsers();

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Return User Info (Excluding password)
    res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email }
    });
});

// Path to your database file
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

// Middleware (Allows the frontend to talk to this server)

app.use(cors({
    origin: '*', // For now, allow ALL to ensure it works. 
    // (We will lock this to your specific domain later)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly allow DELETE
    allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// --- HELPER FUNCTIONS (Read & Write Data) ---
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return []; // If file doesn't exist, return empty list
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- ROUTES (The Commands) ---

// 1. GET: Get all laptops (Used by website & admin)
app.get('/api/laptops', async (req, res) => {
    const laptops = await readData();
    res.json(laptops);
});

// 2. POST: Add a new laptop
app.post('/api/laptops', async (req, res) => {
    const laptops = await readData();
    const newLaptop = {
        id: Date.now(), // Creates a unique ID automatically
        ...req.body
    };
    laptops.push(newLaptop);
    await writeData(laptops);
    res.json({ message: "Laptop Added!", laptop: newLaptop });
});

// 3. PUT: Edit an existing laptop (Price, Stock, etc)
app.put('/api/laptops/:id', async (req, res) => {
    let laptops = await readData();
    const id = parseInt(req.params.id);

    // Find the laptop and update it
    const index = laptops.findIndex(l => l.id === id);
    if (index !== -1) {
        laptops[index] = { ...laptops[index], ...req.body };
        await writeData(laptops);
        res.json({ message: "Laptop Updated!" });
    } else {
        res.status(404).json({ message: "Laptop not found" });
    }
});

// 4. DELETE: Remove a laptop
app.delete('/api/laptops/:id', async (req, res) => {
    let laptops = await readData();
    const id = parseInt(req.params.id);

    // Keep only laptops that DO NOT match the ID
    const newLaptops = laptops.filter(l => l.id !== id);
    await writeData(newLaptops);
    res.json({ message: "Laptop Deleted!" });
});

// ==========================================
// NEW FEATURE: REVIEWS MANAGEMENT
// ==========================================

const REVIEW_FILE = path.join(__dirname, 'data', 'reviews.json');

async function readReviews() {
    try {
        const data = await fs.readFile(REVIEW_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// 1. GET: Get all reviews
app.get('/api/reviews', async (req, res) => {
    const reviews = await readReviews();
    res.json(reviews);
});

// 2. POST: Add a new review (from Customer)
app.post('/api/reviews', async (req, res) => {
    const reviews = await readReviews();
    const newReview = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        approved: false, // By default, reviews are HIDDEN until admin approves
        ...req.body
    };
    reviews.push(newReview);
    await fs.writeFile(REVIEW_FILE, JSON.stringify(reviews, null, 2));
    res.json({ message: "Review Submitted! Pending Approval." });
});

// 3. PUT: Approve/Hide a review (Admin only)
app.put('/api/reviews/:id', async (req, res) => {
    const reviews = await readReviews();
    const id = parseInt(req.params.id);
    const index = reviews.findIndex(r => r.id === id);

    if (index !== -1) {
        // Toggle the 'approved' status
        reviews[index].approved = req.body.approved;
        await fs.writeFile(REVIEW_FILE, JSON.stringify(reviews, null, 2));
        res.json({ message: "Review Status Updated" });
    } else {
        res.status(404).json({ message: "Review not found" });
    }
});

// 4. DELETE: Delete a review
app.delete('/api/reviews/:id', async (req, res) => {
    let reviews = await readReviews();
    const id = parseInt(req.params.id);
    reviews = reviews.filter(r => r.id !== id);
    await fs.writeFile(REVIEW_FILE, JSON.stringify(reviews, null, 2));
    res.json({ message: "Review Deleted" });
});


// Start the Manager
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});


// ==========================================
// NEW FEATURE: CONTACT MESSAGES
// ==========================================

const MSG_FILE = path.join(__dirname, 'data', 'messages.json');

// Helper: Read Messages
async function readMessages() {
    try {
        const data = await fs.readFile(MSG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// 1. POST: Receive a new message from the website
app.post('/api/contact', async (req, res) => {
    const messages = await readMessages();
    const newMessage = {
        id: Date.now(),
        date: new Date().toLocaleDateString(), // Saves today's date
        ...req.body // name, email, message
    };
    messages.push(newMessage);
    await fs.writeFile(MSG_FILE, JSON.stringify(messages, null, 2));
    res.json({ message: "Message Received!" });
});

// 2. GET: Show all messages to Admin
app.get('/api/messages', async (req, res) => {
    const messages = await readMessages();
    res.json(messages);
});

// 3. DELETE: Delete a message
app.delete('/api/messages/:id', async (req, res) => {
    let messages = await readMessages();
    const id = parseInt(req.params.id);
    messages = messages.filter(m => m.id !== id);
    await fs.writeFile(MSG_FILE, JSON.stringify(messages, null, 2));
    res.json({ message: "Message Deleted" });
});