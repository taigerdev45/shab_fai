const { db } = require("./config/firebase");

async function initDB() {
  const pricingRef = db.collection("settings").doc("pricing");
  const doc = await pricingRef.get();

  if (!doc.exists) {
    await pricingRef.set({
      "2.4GHz": 2000,
      "5GHz": 5000,
      lastUpdated: new Date(),
    });
    console.log("Pricing initialized.");
  } else {
    console.log("Pricing already exists.");
  }
}

initDB().catch(console.error);