const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

const cors = require("cors");

var cron = require("node-cron");
var CronJob = require("cron").CronJob;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

var serviceAccount = require("./config/serviceaccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hotblock-48cbf.firebaseio.com",
});

const db = admin.firestore();

const plans = [];

app.get("/plans", (req, res) => {
  plans.push(req.query);
  res.send(plans);
});

app.get("/", (req, res) => {
  const {
    blockindex,
    deposit_amount,
    userid,
    depositid,
    duration,
    rate,
  } = req.query;
  const newdp = parseInt(deposit_amount);
  const newrate = parseInt(rate);
  const rt_amount = (newrate / 100) * newdp + newdp;
  const newduration = parseInt(duration);
  var job = new CronJob(
    `* * */${newduration} * * *`,
    () => {
      db.doc(`users/${userid}`)
        .collection("deposits")
        .doc(depositid)
        .update({
          complete: true,
          return_amount: rt_amount,
        })
        .then(() => {
          return db
            .doc(`users/${userid}`)
            .collection("notification")
            .add({
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              amount: rt_amount,
              type: "investment",
            })
            .then((dt) => {
              stopTask();
              return dt;
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
      console.log("updated");
    },
    null,
    true,
    "America/Los_Angeles"
  );

  function stopTask() {
    return job.stop();
  }

  job.start();
  res.send(req.query);
});

exports.app = functions.https.onRequest(app);

/*  fetch("https://hotblockexpressapi.herokuapp.com/ipn", {
        method: "post",
        body: JSON.stringify(req.query),
        headers: { "Content-Type": "application/json" },
      })
        .then((data) => {
          return data.json();
        })
        .then((json) => {
          console.log(json);
          stopTask();
          return json;
        })
        .catch((err) => console.log(err)); */
