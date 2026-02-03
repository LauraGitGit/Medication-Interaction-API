const express = require("express");
const {
  connect,
  createMedication,
  countMedications,
  searchMedication,
  createMedicationsBulk,
  createUser,
  findUserByEmail,
  deleteMedicationById,
} = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "super-secret-key";

const app = express();
app.use(express.json());

connect();

// Register a new user
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    //check if user already exsists
    const exsistingUser = await findUserByEmail(email);
    if (exsistingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    //Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    //create user
    const userId = await createUser({ email, passwordHash });

    res.status(201).json({
      //created
      message: "User registered successfully",
      userId: userId,
      email: email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// login an exisiting user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400) //bad request
        .json({ message: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" }); //unauthorized
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "10m", //Token valid for 10 mins fow now for testing purpose.
      },
    );

    res.status(200).json({
      message: "Login sucessful",
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized or invalid header" });
  }

  const token = authHeader.split(" ")[1]; //get the part after 'Bearer '

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired, please log in again",
        expiredAt: error.expiredAt,
      });
    }
    return res.status(401).json({ message: "Unauthorized or invalid token" });
  }
}

//create a new medication
app.post("/medication", authMiddleware, async (req, res) => {
  try {
    const id = await createMedication(req.body);
    const name = req.body.name;
    res
      .status(201)
      .json({ message: "Medication created successfully", id, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating medication" });
  }
});

//create several medications at once (max 10 per request)
app.post("/medications", authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of medications" });
    }
    if (body.length > 10) {
      return res
        .status(429)
        .json({ message: "Maximum number of medications exceeded (max 10)" });
    }
    const insertedIds = await createMedicationsBulk(body);
    const insertedNames = body.map((medication) => medication.name);
    const count = Object.keys(insertedIds).length;
    res.status(201).json({
      message: "Medications created successfully",
      count,
      ids: insertedIds,
      names: insertedNames,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500) //internal server error
      .json({ message: "Error creating medications", error: error.message });
  }
});

//total number of medications
app.get("/medication/count", async (req, res) => {
  const totalAmount = await countMedications();
  res.send(`Total number of medications: ${totalAmount}`);
});

//search for a medication by name
app.get("/medication/search/:name", async (req, res) => {
  const name = req.params.name;
  const medication = await searchMedication(name);

  if (!medication) {
    res.status(404).json({ message: "Medication name not found" }); //not found
  } else {
    res.status(200).json(medication); //success
  }
});

// delete a medication by id
app.delete("/medication/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteMedicationById(id);
    if (!id) {
      return res.status(404).json({ message: "Medication not found" });
    }
    res.status(200).json({ message: "Medication deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting medication" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
