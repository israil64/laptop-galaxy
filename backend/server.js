const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. DATABASE CONNECTION (YOUR DB)
// ==========================================
// I added "/laptop_db" to the URL so it creates a specific folder for your data
const MONGO_URI = "mongodb+srv://israilsara786_db_user:UB8Aeini14qEEnHN@cluster0.ziozl2o.mongodb.net/laptop_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ==========================================
// 2. DATA MODELS
// ==========================================

const UserSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const LaptopSchema = new mongoose.Schema({
    brand: String,
    model: String,
    price: Number,
    originalPrice: Number,
    status: String, 
    processor: String,
    ram: String,
    storage: String,
    image: String
});
const Laptop = mongoose.model('Laptop', LaptopSchema);

const ReviewSchema = new mongoose.Schema({
    name: String,
    role: String,
    rating: Number,
    text: String,
    approved: { type: Boolean, default: false },
    date: { type: String, default: () => new Date().toLocaleDateString() }
});
const Review = mongoose.model('Review', ReviewSchema);

const MessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    message: String,
    date: { type: String, default: () => new Date().toLocaleDateString() }
});
const Message = mongoose.model('Message', MessageSchema);


// ==========================================
// 3. API ROUTES
// ==========================================

// --- AUTH ---
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Signup successful" });
    } catch (e) { res.status(500).json({ message: "Server Error" }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        res.json({
            message: "Login successful",
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (e) { res.status(500).json({ message: "Server Error" }); }
});

// --- INVENTORY ---
app.get('/api/laptops', async (req, res) => {
    try {
        const laptops = await Laptop.find();
        const formatted = laptops.map(l => ({ id: l._id, ...l._doc }));
        res.json(formatted);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/laptops', async (req, res) => {
    try {
        const newLaptop = new Laptop(req.body);
        await newLaptop.save();
        res.json({ message: "Added", laptop: newLaptop });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/laptops/:id', async (req, res) => {
    try {
        await Laptop.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: "Updated" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.delete('/api/laptops/:id', async (req, res) => {
    try {
        await Laptop.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// --- REVIEWS ---
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        const formatted = reviews.map(r => ({ id: r._id, ...r._doc }));
        res.json(formatted);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = new Review(req.body);
        await newReview.save();
        res.json({ message: "Review Submitted" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/reviews/:id', async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { approved: req.body.approved });
        res.json({ message: "Status Updated" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// --- MESSAGES ---
app.post('/api/contact', async (req, res) => {
    try {
        const newMessage = new Message(req.body);
        await newMessage.save();
        res.json({ message: "Message Sent" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        const formatted = messages.map(m => ({ id: m._id, ...m._doc }));
        res.json(formatted);
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on Port ${PORT}`);
});