// app.mjs - Consolidated Backend Server (Routing + Model Logic)
// ... (No changes needed, the logic is already correct for PUT/DELETE)
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { initialCveData } from './samples.mjs'; 

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_PATH = path.join(__dirname,'public');

// --- IN-MEMORY DATA STORE & COUNTER ---
let vulnerabilitiesData = [...initialCveData]; 
let nextId = vulnerabilitiesData.length > 0 ? Math.max(...vulnerabilitiesData.map(v => v._id)) + 1 : 1; 

// Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(express.static(PUBLIC_PATH)); 

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
        dateLogged: data.dateLogged || new Date().toISOString(), 
    };
};

// --- FRONTEND ROUTE HANDLERS ---
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'auth.html'));
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send("All fields are required.");
    }
    console.log(`Simulated User registered: ${username}`);
    res.redirect('/cve.html');
});

app.get('/cve.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'cve.html'));
});

// --- RESTful API ENDPOINTS (CRUD Logic) ---

// GET: /api/vulnerabilities - Read all vulnerabilities
app.get('/api/vulnerabilities', async (req, res) => {
    const sortedData = [...vulnerabilitiesData].sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged));
    res.status(200).json(sortedData);
});

// POST: /api/vulnerabilities - Create a new vulnerability
app.post('/api/vulnerabilities', async (req, res) => {
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }

    const newVulnerability = { _id: nextId++, ...validatedData }; 
    vulnerabilitiesData.push(newVulnerability);

    res.status(201).json(newVulnerability);
});

// PUT: /api/vulnerabilities/:id - Update an existing vulnerability
app.put('/api/vulnerabilities/:id', async (req, res) => {
    const id = parseInt(req.params.id); 
    const validatedData = validateVulnerability(req.body);

    if (!validatedData) {
        return res.status(400).send({ message: "Invalid data submitted." });
    }
    
    delete validatedData.dateLogged; // Prevent overwriting the creation date

    const index = vulnerabilitiesData.findIndex(v => v._id === id);

    if (index === -1) {
        return res.status(404).send({ message: "Vulnerability not found." });
    }
    
    vulnerabilitiesData[index] = {
        ...vulnerabilitiesData[index], 
        ...validatedData             
    };

    res.status(200).send({ message: "Vulnerability updated successfully." });
});

// DELETE: /api/vulnerabilities/:id - Delete a vulnerability
app.delete('/api/vulnerabilities/:id', async (req, res) => {
    const id = parseInt(req.params.id); 

    const initialLength = vulnerabilitiesData.length;
    vulnerabilitiesData = vulnerabilitiesData.filter(v => v._id !== id);

    if (vulnerabilitiesData.length === initialLength) {
        return res.status(404).send({ message: "Vulnerability not found." });
    }
    
    res.status(204).send(); // 204 No Content for successful deletion
});


// --- SERVER START ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});