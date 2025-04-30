const express = require("express"); 
const path = require('path');

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