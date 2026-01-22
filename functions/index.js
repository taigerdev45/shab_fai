const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware to verify Admin token
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data().role === "admin") {
      req.user = decodedToken;
      next();
    } else {
      res.status(403).send("Forbidden: Admin access required");
    }
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
};

// Generate PDF Receipt
app.post("/generate-receipt", async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).send("Subscription ID is required");

  try {
    const subDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subDoc.exists) return res.status(404).send("Subscription not found");

    const data = subDoc.data();
    
    // Create PDF
    const doc = new PDFDocument();
    const fileName = `receipt_${subscriptionId}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const stream = fs.createWriteStream(tempFilePath);

    doc.pipe(stream);

    // PDF Content
    doc.fontSize(25).text("REÇU D'ABONNEMENT SHABAFAI", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`ID Subscription: ${subscriptionId}`);
    doc.moveDown();
    doc.text(`Nom: ${data.fullName}`);
    doc.text(`Téléphone: ${data.phone}`);
    doc.text(`Adresse MAC: ${data.macAddress}`);
    doc.text(`Réseau: ${data.networkType}`);
    doc.moveDown();
    doc.text(`Paiement: ${data.paymentMethod}`);
    doc.text(`Référence: ${data.transactionRef}`);
    doc.text(`Montant: ${data.price} CFA`);
    doc.moveDown();
    // Safe date handling
    const startDate = data.startDate ? new Date(data.startDate.seconds * 1000) : new Date();
    const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : new Date();
    doc.text(`Période: Du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`);
    
    doc.end();

    stream.on("finish", async () => {
      // Upload to Firebase Storage
      const bucket = storage.bucket();
      const uploadPath = `receipts/${fileName}`;
      
      await bucket.upload(tempFilePath, {
        destination: uploadPath,
        metadata: { contentType: "application/pdf" }
      });

      // Make file public or get signed URL
      const file = bucket.file(uploadPath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      });

      // Update Firestore with PDF URL
      await db.collection("subscriptions").doc(subscriptionId).update({
        pdfUrl: url
      });

      // Cleanup local file
      fs.unlinkSync(tempFilePath);
      
      res.json({ success: true, url });
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).send(error.message);
  }
});

// Admin validation logic moved to function for security
app.post("/admin/validate-subscription", verifyAdmin, async (req, res) => {
    // ... logic similar to your existing backend ...
    // For now, we keep it simple as the client calls this endpoint
    res.json({ success: true, message: "Endpoint ready for deployment" });
});

exports.api = functions.https.onRequest(app);