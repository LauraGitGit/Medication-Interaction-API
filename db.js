const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017");

let medication; //data collection
let users; //users collection

// Connect to database
async function connect() {
  await client.connect();
  console.log("Connected to database");
  const db = client.db("medication-interaction"); //Database name
  medication = db.collection("medication"); // Collection name
  users = db.collection("users");
}

//create a new user
async function createUser(userData) {
  await connect();
  const userCollection = users;

  //Create user document
  const documentsToInsert = {
    email: userData.email,
    passwordHash: userData.passwordHash,
    isVerified: false,
    createdAt: new Date().toString(),
  };

  const result = await userCollection.insertOne(documentsToInsert);
  return result.insertedId;
}

// find user by email
async function findUserByEmail(email) {
  await connect();
  const userCollection = users;
  const user = await userCollection.findOne({ email: email });
  return user;
}

//create one medication at a time
async function createMedication(medsData) {
  await connect();
  const medicationCollection = medication;

  // create a new document to insert into the medication database
  const documentToInsert = {
    name: medsData.name,
    interactions: medsData.interactions,
    source: medsData.source || "manual",
    createdAt: new Date().toString(),
  };

  const result = await medicationCollection.insertOne(documentToInsert);
  return result.insertedId;
}

// create several medications at once
async function createMedicationsBulk(medsArray) {
  await connect();
  const medicationCollection = medication;

  const documentsToInsert = medsArray.map((medsData) => ({
    name: medsData.name,
    interactions: medsData.interactions,
    source: medsData.source || "manual",
    createdAt: new Date().toISOString(),
  }));

  const result = await medicationCollection.insertMany(documentsToInsert);
  return result.insertedIds;
}

// Count the total number of medications
async function countMedications() {
  await connect();
  const medicationCollection = medication;
  const count = await medicationCollection.countDocuments({});
  return count;
}

//Search for a medication by name
async function searchMedication(name) {
  await connect();
  const medicationCollection = medication;
  const result = await medicationCollection.findOne({ name: name });
  return result;
}

// Delete a medication by id
async function deleteMedicationById(id) {
  await connect();
  const medicationCollection = medication;
  const result = await medicationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  return result;
}

module.exports = {
  connect,
  createMedication,
  countMedications,
  searchMedication,
  createMedicationsBulk,
  createUser,
  findUserByEmail,
  deleteMedicationById,
};
