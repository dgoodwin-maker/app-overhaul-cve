// server.js
import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Used to load environment variables from .env

// --- SETUP ---
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (auth.html, cve.html, etc.)

// --- MONGODB CONNECTION ---
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB cluster");
    } catch (e) {
        console.error("Could not connect to MongoDB:", e);
        process.exit(1);
    }
}
connectToMongo();

// --- ROUTES ---

// 1. Serve auth.html as the entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// 2. Handle Registration Submission
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send("All fields are required.");
    }
    
    // NOTE: In a real app, you MUST hash the password here (e.g., using bcrypt).

    try {
        const database = client.db("cve_database"); // Replace with your database name
        const users = database.collection("users"); // Collection for users
        
        // Check if user already exists
        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            // A professional app would redirect to a failure page or display an inline error
            return res.status(409).send("Username or Email already registered.");
        }

        // Insert new user
        const newUser = { username, password, email, registrationDate: new Date() };
        await users.insertOne(newUser);

        console.log(`User registered: ${username}`);
        
        // Redirect to the main application page upon successful registration
        res.redirect('/cve.html');

    } catch (e) {
        console.error("Registration error:", e);
        res.status(500).send("Internal Server Error during registration.");
    }
});

// --- SERVER START ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});