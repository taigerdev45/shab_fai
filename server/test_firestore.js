const { db } = require("./config/firebase");

async function test() {
  try {
    const collections = await db.listCollections();
    console.log("Collections found:", collections.map(c => c.id));
    process.exit(0);
  } catch (err) {
    console.error("Firestore test error:", err);
    process.exit(1);
  }
}

test();