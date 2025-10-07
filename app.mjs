// app.mjs - Consolidated Backend Server (Routing + Model Logic)
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
// Import initial data from the samples.mjs file
import { initialCveData } from './samples.mjs'; 

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_PATH = path.join(__dirname,'public');

// --- IN-MEMORY DATA STORE & COUNTER ---
// Initialize the array with the imported sample data
let vulnerabilitiesData = [...initialCveData]; 
// Set nextId to be one more than the last ID in the sample data
let nextId = vulnerabilitiesData.length > 0 ? Math.max(...vulnerabilitiesData.map(v => v._id)) + 1 : 1; 

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse form data (for /register)
app.use(express.json()); // To parse JSON payloads (for API calls)
app.use(express.static(PUBLIC_PATH)); // Serve static files (auth.html, cve.html, etc.)

// Helper function to validate vulnerability data (Model Logic)
const validateVulnerability = (data) => {
    // Note: The client uses 'severity' as a string, parseFloat converts it
    const { name, severity, description } = data; 
    if (!name || !severity || !description) {
        return null;
    }
    return {
        name: name.trim(),
        severity: parseFloat(severity),
        description: description.trim(),
        status: data.status || 'Pending',
        // Use provided date or current date
        dateLogged: data.dateLogged || new Date().toISOString(), 
    };
};

// --- FRONTEND ROUTE HANDLERS ---

// 1. Serve auth.html as the entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'auth.html'));
});

// 2. Handle Registration Submission (Simplified)
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send("All fields are required.");
    }
    
    console.log(`Simulated User registered: ${username}`);
    res.redirect('/cve.html');
});

// 3. Serve the main CVE application page
app.get('/cve.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'cve.html'));
});

// --- RESTful API ENDPOINTS (CRUD Logic) ---

// GET: /api/vulnerabilities - Read all vulnerabilities
app.get('/api/vulnerabilities', async (req, res) => {
    // Return all data, sorted by dateLogged (descending)
    // Create a copy before sorting to avoid modifying the original array order on subsequent requests
    const sortedData = [...vulnerabilitiesData].sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged));
    res.status(200).json(sortedData);
});

// POST: /api/vulnerabilities - Create a new vulnerability
app.post('/api/vulnerabilities', async (req, res) => {
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }

    // 1. Assign a new unique ID
    const newVulnerability = { _id: nextId++, ...validatedData }; 
    // 2. Store it in memory
    vulnerabilitiesData.push(newVulnerability);

    res.status(201).json(newVulnerability);
});

// PUT: /api/vulnerabilities/:id - Update an existing vulnerability
app.put('/api/vulnerabilities/:id', async (req, res) => {
    const id = parseInt(req.params.id); // Parse ID to number
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }
    
    delete validatedData.dateLogged; // Prevent overwriting the creation date

    // Find the index of the vulnerability
    const index = vulnerabilitiesData.findIndex(v => v._id === id);

    if (index === -1) {
        return res.status(404).send({ message: "Vulnerability not found." });
    }
    
    // Update the existing object with new data
    vulnerabilitiesData[index] = {
        ...vulnerabilitiesData[index], 
        ...validatedData             
    };

    res.status(200).send({ message: "Vulnerability updated successfully." });
});

// DELETE: /api/vulnerabilities/:id - Delete a vulnerability
app.delete('/api/vulnerabilities/:id', async (req, res) => {
    const id = parseInt(req.params.id); // Parse ID to number

    const initialLength = vulnerabilitiesData.length;
    // Filter out the item with the matching ID
    vulnerabilitiesData = vulnerabilitiesData.filter(v => v._id !== id);

    if (vulnerabilitiesData.length === initialLength) {
        return res.status(404).send({ message: "Vulnerability not found." });
    }
    
    // 204 No Content response for successful deletion
    res.status(204).send(); 
});


// --- SERVER START ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});