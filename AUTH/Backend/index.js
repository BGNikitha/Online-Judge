const express = require("express");
const app = express();
const { DBConnection } = require("./database/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

DBConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/register", async (req, res) => {
  try {
    //get all the data from frontend
    const { firstname, lastname, email, password } = req.body;

    //check that all the data should exist
    if (!firstname || !lastname || !email || !password) {
      let message = "Please enter ";
      if (!firstname) message += "first name, ";
      if (!lastname) message += "last name, ";
      if (!email) message += "email, ";
      if (!password) message += "password, ";
      message = message.slice(0, -2); // Remove the trailing comma and space
      return res.status(400).send(message);
    }

    // more validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send("Please enter a valid email address");
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(password)) {
      return res.status(400).send("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character that is not alphanumeric");
    }

    //check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists with the same email");
    }

    //hashing/encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //save the user in db
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    //generate a token for user and send it to the backend
    const token = jwt.sign({ id: user._id, email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    user.token = token;
    user.password = undefined;
    res.status(200).json({ message: 'You have successfully registered!', user });
  } catch (error) {
    console.log(error);
  }
});

app.post("/SignIn", async (req, res) => {
 try {
   // get all the data from the frontend
   const { email, password } = req.body;

   // check that all the data should exists
   if (!email || !password) {
     let message = "Please enter ";
     if (!email && !password) {
       message += "email and password";
     } else if (!email) {
       message += "email";
     } else {
       message += "password";
     }
     return res.status(400).send(message);
   }
 
   // more validations
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     return res.status(400).send("Please enter a valid email address");
   }
 
   if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(password)) {
     return res.status(400).send("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character that is not alphanumeric");
   }
 
   //find the user in the db
   const user = await User.findOne({ email });
   if (!user) {
     return res.status(404).send("User not found");
   }
 
   // checking password matches or not
   const enteredPassword = await bcrypt.compare(password,user.password);
   if(!enteredPassword){
     return res.status(404).send("Incorrect password");
   }
 
   //generate a token for user and send it to the backend
   const token = jwt.sign({ id: user._id}, process.env.SECRET_KEY, {
     expiresIn: "1h",
   });
   user.token = token;
   user.password = undefined;
 
   //store token in cookies with options
  const options = {
   expires : new Date(Date.now() + 1 * 24 *60 * 60 * 1000),
   httpOnly: true, //only maipulate by server not by your cliet/frontend
  };
 
  //send the token
  res.status(200).cookie("token",token,options).json({
   message: "You have successfully logged in!",
   success: true,
   token,
  });
 
 } catch (error) {
  console.log(error);
 }

});


app.listen(process.env.PORT, () => {
  console.log("Server listening on port ${process.env.PORT}!");
});

