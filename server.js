const express = require('express');
const cors = require('cors');
const sha256 = require("crypto-js/sha256");

const app = express();
app.use(cors());
app.use(express.json());

let balance = 1000;

app.post('/rolling', (req,res)=>{
    const {betAmount} = req.body;

    if(betAmount <=0 || betAmount > balance){
        return res.status(400).json({error: "Invalid bet Amount"})
    }

    // Generate a favourly dice roll
    const roll = Math.floor(Math.random()*6) + 1;
    const hash = sha256(roll.toString()).toString();

    let win = roll >= 4;
    balance += win ? betAmount : -betAmount;

    res.json({roll, hash, balance, win})
})

app.listen(4000, ()=>{
    console.log("http://localhost:4000")
})