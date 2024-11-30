const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const emailjs = require('emailjs-com'); // EmailJS

const app = express();
const port = 80; // Usa la porta 80 per HTTP

const DATABASE_FILE = 'database.json';

// Funzione per caricare i dati dal file JSON
function loadDatabase() {
  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
}

// Funzione per salvare i dati nel file JSON
function saveDatabase(data) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
}

app.use(bodyParser.json());
app.use(express.static('public'));

// Recupera i siti più cliccati
app.get('/get-top-sites', (req, res) => {
  const data = loadDatabase();
  const sortedSites = data.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  res.json(sortedSites);
});

// Incrementa i clic per un sito specifico
app.post('/increment-click', (req, res) => {
  const { url } = req.body;
  const data = loadDatabase();
  const site = data.find(site => site.url === url);
  if (site) {
    site.clicks += 1;
    saveDatabase(data);
    res.status(200).json({ message: 'Click incrementato' });
  } else {
    res.status(404).json({ error: 'Sito non trovato' });
  }
});

// Cerca siti
app.post('/search-sites', (req, res) => {
  const { query } = req.body;
  const data = loadDatabase();
  const results = data.filter(site => site.name.toLowerCase().includes(query.toLowerCase()));
  res.json(results);
});

// Registra un nuovo sito e invia una notifica via email
app.post('/register-site', (req, res) => {
  const { site_name, site_url, site_description, username, email } = req.body;

  if (!site_name || !site_url || !site_description || !username || !email) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }

  const data = loadDatabase();
  data.push({
    name: site_name,
    url: site_url,
    description: site_description,
    clicks: 0
  });
  saveDatabase(data);

  // Configura i parametri per EmailJS
  const templateParams = {
    site_name: site_name,
    site_url: site_url,
    site_description: site_description,
    username: username,
    email: email
  };

  emailjs.send("service_4rekc7l", "YOUR_TEMPLATE_ID", templateParams)
    .then(response => {
      console.log("Email inviata con successo:", response);
      res.status(200).json({ message: 'Sito registrato con successo e email inviata!' });
    })
    .catch(error => {
      console.error("Errore nell'invio dell'email:", error);
      res.status(500).json({ error: 'Sito registrato ma errore nell\'invio dell\'email' });
    });
});

// Servire i file HTML
app.get('/registra-sito', (req, res) => {
  res.sendFile(__dirname + '/public/RegistraSito/RegSito.html', (err) => {
    if (err) {
      console.error('Errore nel servire il file RegSito.html:', err);
      res.status(500).send('Errore nel servire il file');
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home/home.html');
});

// Avvio del server
app.listen(port, () => {
  console.log(`Server in esecuzione su http://mitrix.giize.com/ su porta:${port}`);
});
