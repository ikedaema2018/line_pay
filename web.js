"use strict";

// Import packages.
const express = require("express");
const app = express();

// Launch server.
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening to ${process.env.PORT || 5000}...`);
});

// Middleware configuration to serve static file.
app.use(express.static(__dirname + "/public"));

// Set ejs as template engine.
app.set("view engine", "ejs");

// Router configuration to serve web page containing pay button.
app.get("/", (req, res) => {
    console.log(pay)
    res.render(__dirname + "/index");
})

require("dotenv").config();

const uuid = require("uuid/v4");
const cache = require("memory-cache");

const line_pay = require("line-pay");
const pay = new line_pay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    isSandbox: true
});

// app.use('/pay/reserve', (req, res) => {
//     let options = {
//         productName: "チョコレート",
//         amount: 1,
//         currency: "JPY",
//         orderId: uuid(),
//         confirmUrl: process.env.LINE_PAY_CONFIRM_URL
//     }

//     pay.reserve(options).then((response) => {
//         let reservation = options;
//         reservation.transactionId = response.info.transactionId;

//         console.log(`Reservation was made. Detail is following.`);
//         console.log(reservation);

//         // Save order information
//         cache.put(reservation.transactionId, reservation);

//         res.redirect(response.info.paymentUrl.web);
//     })
// });

app.use("/pay/confirm", (req, res) => {
    if (!req.query.transactionId){
        throw new Error("Transaction Id not found.");
    }

    // Retrieve the reservation from database.
    let reservation = cache.get(req.query.transactionId);
    if (!reservation){
        throw new Error("Reservation not found.");
    }

    console.log(`Retrieved following reservation.`);
    console.log(reservation);

    let confirmation = {
        transactionId: req.query.transactionId,
        amount: reservation.amount,
        currency: reservation.currency
    }

    console.log(`Going to confirm payment with following options.`);
    console.log(confirmation);

    pay.confirm(confirmation).then((response) => {
        res.send("決済が完了しました。");
    });
})

app.use("/pay/reserve", (req, res) => {
    // このoptions部分は、本来は動的に変更される。
    let options = {
        productName: "プロテイン",
        amount: 20,
        currency: "JPY",
        orderId: uuid(),
        confirmUrl: process.env.LINE_PAY_CONFIRM_URL
    }
 
    pay.reserve(options).then((response) => {
        console.log(response);
        let reservation = options;
        reservation.transactionId = response.info.transactionId; // responseにはトランザクションIDが格納されている
 
        console.log(`Reservation was made. Detail is following.`);
        console.log(reservation);
 
        cache.put(reservation.transactionId, reservation); // トランザクションIDと承認情報を保存する
 
        res.redirect(response.info.paymentUrl.web); // LINE payのログイン画面に飛ばす。
    })
 
});

