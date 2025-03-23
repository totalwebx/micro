const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Environment configuration
require("dotenv").config();

// Mongoose Model for Commande
const CommandeSchema = new mongoose.Schema({
    ids: [{ type: String, required: true }], 
    email: { type: String, required: true },
    prix_total: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});
const Commande = mongoose.model("Commande", CommandeSchema);

// Express application setup
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/commande-service");

// Authentication Middleware
const isAuthenticated = (req, res, next) => 
    jwt.verify(req.headers.authorization?.split(" ")[1] || "", process.env.JWT_SECRET || "secret", 
        (err, user) => err ? res.sendStatus(401) : (req.user = user, next()));


// Helper function to calculate total price
function prixTotal(produits) {
    return produits.reduce((total, produit) => total + produit.prix, 0);
}

// Route to add a commande
app.post("/commande/ajouter", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const { data: produits } = await axios.post("http://localhost:4000/produit/acheter", { ids });

    const savedCommande = await new Commande({
        ids,
        email: req.user.email,
        prix_total: prixTotal(produits)
    }).save();

    res.status(201).json(savedCommande);
});

// Start server
app.listen(4001, () => { console.log('Commande-Service running on 4001')});
