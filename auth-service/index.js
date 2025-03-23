const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Schema definition for Utilisateur
const UtilisateurSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mot_passe: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Model creation
const Utilisateur = mongoose.model("Utilisateur", UtilisateurSchema);

dotenv.config();
const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/auth-service");

// Registration endpoint
app.post("/auth/register", async (req, res) => {
    const { nom, email, mot_passe } = req.body;
    if (await Utilisateur.findOne({ email })) {
        return res.status(400).send("Utilisateur existe");
    }
    const newUser = new Utilisateur({ 
        nom,email,mot_passe: await bcrypt.hash(mot_passe, 10) 
    });
    await newUser.save();
    res.status(201).json(newUser);
});

// Login endpoint
app.post("/auth/login", async (req, res) => {
    const { email, mot_passe } = req.body;
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur || !(await bcrypt.compare(mot_passe, utilisateur.mot_passe))) {
        return res.status(401).send("Email ou mot de passe incorrect");
    }
    const token = jwt.sign(
        { id: utilisateur._id, email: utilisateur.email, nom: utilisateur.nom },
        process.env.JWT_SECRET || "secret", 
        { expiresIn: "1h" }
    );
    res.send(token);
});

// Starting the server
app.listen(4002, () => {console.log("Auth-Service running on port 4002")});
