const express = require("express"); 
const path = require('path');
const fetch = require("node-fetch");

const PORT = 3000;

const app = express();

app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/templates'));

app.get("/", (request, response) => { // Main page
  response.render("index");
});

app.get("/join", (request, response) => { 
  response.render("join");
});

app.get("/filmography", (request, response) => { 
  response.render("filmography");
});

app.get("/some-like-it-hot", (request, response) => { 
  response.render("some");
});

app.get("/the-apartment", (request, response) => { 
  response.render("apartment");
});

app.get("/ace-in-the-hole", (request, response) => { 
  response.render("ace");
});

app.get("/the-lost-weekend", (request, response) => { 
  response.render("weekend");
});

app.get("/sunset-boulevard", (request, response) => { 
  response.render("sunset");
});

app.post("/process", express.urlencoded({ extended: true }), async (request, response) => { 

  await addPetition(request.body);

  response.redirect("/petition");
});

app.get("/petition", express.urlencoded({ extended: true }), async (request, response) => { 

  const persons = await retrievePetitionList();

  let table = "<table border='1'><tr><th>Name</th><th>Comments</th></tr>";

  persons.forEach(person => {
    table+="<tr>";
    table+=`<td>${person["name"]}</td><td>${person["comments"]}</td>`
    table+="</tr>";
  });

  table+= "</table>";

  response.render("petitionList", { table });
});

app.listen(PORT, () => { 
  console.log(`Web server started and running at http://localhost:${PORT}`);
  
  process.stdin.setEncoding("utf8");
  process.stdout.write("Stop to shutdown the server: "); 
  process.stdin.on('readable', () => {  
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
      const command = dataInput.trim();
      if (command === "stop") {
        console.log("Shutting down the server"); 
        process.exit(0);  
      } else {
        console.log(`Invalid command: ${command}`);
      }
      process.stdout.write("Stop to shutdown the server: "); 
      process.stdin.resume(); // Allows the code to process next request
    }
  });
});

require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");
const databaseName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.yegeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

async function addPetition(petition) {
  petition.email = petition.email.toLowerCase();
  try {
    await client.connect();
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // check for existing petition with the same email
    const existing = await collection.findOne({ email: petition.email });
    if (existing) {
      return {
        inserted: false,
        message: `An petition with email "${petition.email}" already exists.`,
      };
    }

    // if none exists, insert new one
    const result = await collection.insertOne(petition);
    if (result.insertedCount === 1) {
      return {
        inserted: true,
        message: `Petition submitted successfully (id: ${result.insertedId}).`,
      };
    } else {
      return {
        inserted: false,
        message: "Failed to insert petition for an unknown reason",
      };
    }
  } catch (err) {
    return {
      inserted: false,
      message: "An error occurred while submitting your petition",
    };
  } finally {
    await client.close();
  }
}

async function retrievePetitionList() {
  let result; 

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    let filter = { };
    const cursor = collection.find(filter);

    result = await cursor.toArray();
 } catch (e) {
    console.error(e);
 } finally {
    await client.close();
 }

  return result;
}

// API Requirement
app.get("/api/filmography", async (req, res) => {
  const personId = 7212;
  const apiKey = process.env.TMDB_KEY;
  const url = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const directed = data.crew
      .filter(f => f.job === "Director")
      .map(film => ({
        title: film.title,
        year: film.release_date ? film.release_date.slice(0, 4) : "N/A",
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    res.json(directed);
  } catch (err) {
    console.error("TMDb fetch error:", err);
    res.status(500).json({ error: "Failed to fetch filmography." });
  }
});


