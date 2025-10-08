// app.mjs - Consolidated Backend Server (Routing + Model Logic)

import express from 'express';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Loads environment variables from .env
import { cveSamples } from './samples.mjs'; // <-- Import sample data from root

// --- SETUP ---
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Correctly map the public folder path
const PUBLIC_PATH = path.join(__dirname, 'src', 'public');

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse form data (for /register)
app.use(express.json()); // To parse JSON payloads (for API calls)
app.use(express.static(PUBLIC_PATH)); // Serve static files (auth.html, cve.html, etc.)

// --- MONGODB CONNECTION & SEEDING ---
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;
const COLLECTION_NAME = 'vulnerabilities';

/**
 * Inserts sample data into MongoDB if the collection is empty.
 */
async function seedDatabase() {
    try {
        const collection = db.collection(COLLECTION_NAME);
        const count = await collection.countDocuments();

        if (count === 0) {
            // Data insertion uses the sample data directly
            await collection.insertMany(cveSamples);
            console.log(`[SEEDING] Successfully inserted ${cveSamples.length} sample vulnerabilities.`);
        } else {
            console.log(`[SEEDED] Collection is not empty (${count} items found). Skipping seeding.`);
        }
    } catch (e) {
        console.error("[SEEDING] Error seeding database:", e);
    }
}

async function connectToMongo() {
    try {
        await client.connect();
        db = client.db("cve_database"); 
        console.log("Connected successfully to MongoDB cluster");
        // Run the seed function immediately after successful connection
        await seedDatabase();
    } catch (e) {
        console.error("Could not connect to MongoDB:", e);
        // Exit process on connection failure
        process.exit(1);
    }
}
connectToMongo();

// Helper function to validate vulnerability data (Model Logic)
const validateVulnerability = (data) => {
    const { name, severity, description } = data;
    if (!name || !severity || !description) {
        return null;
    }
    return {
        name: name.trim(),
        severity: parseFloat(severity),
        description: description.trim(),
        status: data.status || 'Pending',
        dateLogged: data.dateLogged || new Date(),
    };
};

// --- FRONTEND ROUTE HANDLERS ---

// 1. Serve auth.html as the entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'auth.html'));
});

// 2. Handle Registration Submission
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send("All fields are required.");
    }

    try {
        const users = db.collection("users");
        
        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            // Redirect back with an error flag, which auth.html handles
            return res.redirect('/?error=UserExists'); 
        }

        const newUser = { username, password, email, registrationDate: new Date() };
        await users.insertOne(newUser);

        console.log(`[AUTH] User registered: ${username}`);
        
        // Redirect to the main application page
        res.redirect('/cve.html');

    } catch (e) {
        console.error("Registration error:", e);
        res.status(500).send("Internal Server Error during registration.");
    }
});

// 3. Serve the main CVE application page
app.get('/cve.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'cve.html'));
});

// --- RESTful API ENDPOINTS (CRUD Logic) ---

// GET: /api/vulnerabilities - Read all vulnerabilities
app.get('/api/vulnerabilities', async (req, res) => {
    try {
        // Fetch and sort by newest first
        const vulnerabilities = await db.collection(COLLECTION_NAME).find().sort({ dateLogged: -1 }).toArray();
        console.log(`[API-READ] Successfully retrieved ${vulnerabilities.length} vulnerabilities.`);
        res.status(200).json(vulnerabilities);
    } catch (e) {
        console.error("GET error:", e);
        res.status(500).send({ message: 'Failed to retrieve vulnerabilities.' });
    }
});

// POST: /api/vulnerabilities - Create a new vulnerability
app.post('/api/vulnerabilities', async (req, res) => {
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }

    try {
        const result = await db.collection(COLLECTION_NAME).insertOne(validatedData);
        console.log(`[API-CREATE] New vulnerability logged with ID: ${result.insertedId}`);
        // Return the full object with the new MongoDB ID
        res.status(201).json({ _id: result.insertedId, ...validatedData });
    } catch (e) {
        console.error("POST error:", e);
        res.status(500).send({ message: 'Failed to create vulnerability.' });
    }
});

// PUT: /api/vulnerabilities/:id - Update an existing vulnerability
app.put('/api/vulnerabilities/:id', async (req, res) => {
    const id = req.params.id;
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }
    
    // Ensure we don't accidentally update the date logged on update
    delete validatedData.dateLogged; 

    try {
        const _id = new ObjectId(id);
        const result = await db.collection(COLLECTION_NAME).updateOne(
            { _id },
            { $set: validatedData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: "Vulnerability not found." });
        }
        console.log(`[API-UPDATE] Vulnerability ID ${id} updated.`);
        res.status(200).send({ message: "Vulnerability updated successfully." });

    } catch (e) {
        console.error("PUT error:", e); 
        res.status(400).send({ message: "Invalid ID format or server error." });
    }
});

// DELETE: /api/vulnerabilities/:id - Delete a vulnerability
app.delete('/api/vulnerabilities/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const _id = new ObjectId(id);
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Vulnerability not found." });
        }
        console.log(`[API-DELETE] Vulnerability ID ${id} deleted.`);
        // 204 No Content response for successful deletion
        res.status(204).send(); 
        
    } catch (e) {
        console.error("DELETE error:", e);
        res.status(400).send({ message: "Invalid ID format or server error." });
    }
});

// --- Default 404 Route Handler ---
app.use((req, res) => {
    res.status(404).send("404: Route Not Found");
});

// --- SERVER START ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
