const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Environment configuration
require("dotenv").config();

// Mongoose Model for Produit
const ProduitSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: { type: String, required: true },
    prix: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
});
const Produit = mongoose.model("Produit", ProduitSchema);

// Express application setup
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/produit-service");

// Authentication Middleware
const isAuthenticated = (req, res, next) => 
    jwt.verify(req.headers.authorization?.split(" ")[1] || "", process.env.JWT_SECRET || "secret", 
        (err, user) => err ? res.sendStatus(401) : (req.user = user, next()));


// Route to add a produit
app.post("/produit/ajouter", isAuthenticated, async (req, res) => {
    const newProduit = new Produit(req.body);
    await newProduit.save();
    res.status(201).json(newProduit);
});

// Route to buy produits (fetch by ids)
app.post("/produit/acheter", async (req, res) => {
    const produits = await Produit.find({ _id: { $in: req.body.ids } });
    res.json(produits);
});

// Start server
app.listen(4000, () => {console.log('Product-Service running on port 4000')});
