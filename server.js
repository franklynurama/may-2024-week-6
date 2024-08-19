// server.js
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const { check, validationResult } = require("express-validator");

// Initialize
const app = express();

// Set up middleware to parse incoming data
app.use(express.static(__dirname));
app.use(express.json());
app.use(bodyParser.json());
dotenv.config();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.static('./script.js'));

// Configure session middleware
app.use(
  session({
    secret: "wrjhujki68jhsdt54rt5r6y9ywt4swdfer54h5t5e5",
    resave: false,
    saveUninitialized: false,
  })
);

// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);
});

// Define route to registratation form
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

// Display login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Define a User representation for clarity
const User = {
  tableName: "users2",
  createUser: function (newUser, callback) {
    connection.query(
      "INSERT INTO " + this.tableName + " SET ?",
      newUser,
      callback
    );
  },
  getUserByEmail: function (email, callback) {
    connection.query(
      "SELECT * FROM " + this.tableName + " WHERE email = ?",
      email,
      callback
    );
  },
  getUserByUsername: function (username, callback) {
    connection.query(
      "SELECT * FROM " + this.tableName + " WHERE username = ?",
      username,
      callback
    );
  },
};

// Registration route
app.post(
  "/api/register",
  [
    // Validate email and username fields
    check("email").isEmail(),
    check("username")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric"),

    // Custom validation to check if email and username are unique
    check("email").custom(async (value) => {
      const user = await User.getUserByEmail(value);
      if (user) {
        throw new Error("Email already exists");
      }
    }),
    check("username").custom(async (value) => {
      const user = await User.getUserByUsername(value);
      if (user) {
        throw new Error("Username already exists");
      }
    }),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create a new user object
    const newUser = {
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      full_name: req.body.full_name,
    };

    // Insert user into MySQL
    User.createUser(newUser, (error, results, fields) => {
      if (error) {
        console.error("Error inserting user: " + error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log("Inserted a new user with id " + results.insertId);
      res.status(201).json(newUser);
    });
  }
);

// Login route
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // Retrieve user from database
  connection.query(
    "SELECT * FROM users2 WHERE username = ?",
    [username],
    (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        res.status(401).send("Invalid username or password");
      } else {
        const user = results[0];
        // Compare passwords
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            // Store user in session
            req.session.user = user;
            res.send("Login successful"); //or res.status(200).json({ message : "Login successful" });
          } else {
            res.status(401).send("Invalid username or password");
          }
        });
      }
    }
  );
});

//handle authorization
const userAuthenticated = (request, response, next) => {
  if (request.session.user) {
    request.user = request.session.user;
    next();
  } else {
    response.redirect("/login");
  }
};

//Dashboard route
app.get("/dashboard", userAuthenticated, (req, res) => {
  // Assuming you have middleware to handle user authentication and store user information in req.user
  const userFullName = req.user.full_name;
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard</title>
        </head>
        <body>
            <h1>Welcome to your dashboard, <span id="user-fullname"></span>!</h1>
            
            <script>
                // Inject the user's full name into the HTML
                const userFullName = ${JSON.stringify(userFullName)};
                document.getElementById("user-fullname").textContent = userFullName;
            </script>
        </body>
        </html>
    `);
  //res.send(userFullName); // Can also use this simply
  //res.render("dashboard", { fullName: userFullName }); // Rendering cannot be done directly
});

//destroy session
app.get("/logout", userAuthenticated, (request, response) => {
  console.log("Logging you out!");
  request.session.destroy();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*//secure route
app.get("/dashboard", userAuthenticated, (request, response) => {
  response.status(200).json({ message: "You are viewing a secured route." });
});*/
