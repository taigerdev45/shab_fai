const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { db, admin, storage } = require("./config/firebase");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health check
app.get("/", (req, res) => {
  res.send("ShabaFAI API is running");
});

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
app.post("/api/generate-receipt", async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).send("Subscription ID is required");

  try {
    const subDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subDoc.exists) return res.status(404).send("Subscription not found");

    const data = subDoc.data();
    
    // Create PDF
    const doc = new PDFDocument();
    const fileName = `receipt_${subscriptionId}.pdf`;
    const filePath = path.join(__dirname, fileName);
    const stream = fs.createWriteStream(filePath);

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
    doc.text(`Période: Du ${new Date(data.startDate.seconds * 1000).toLocaleDateString()} au ${new Date(data.endDate.seconds * 1000).toLocaleDateString()}`);
    
    doc.end();

    stream.on("finish", async () => {
      // Upload to Firebase Storage
      const bucket = storage.bucket();
      const uploadPath = `receipts/${fileName}`;
      await bucket.upload(filePath, {
        destination: uploadPath,
        metadata: { contentType: "application/pdf" }
      });

      // Get Download URL
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
      fs.unlinkSync(filePath);

      res.json({ url });
    });

  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin: Validate Subscription
app.post("/api/admin/validate-subscription", verifyAdmin, async (req, res) => {
  const { subscriptionId, action } = req.body; // action: 'APPROVE' or 'REJECT'
  
  try {
    const subRef = db.collection("subscriptions").doc(subscriptionId);
    const subDoc = await subRef.get();
    
    if (!subDoc.exists) return res.status(404).send("Subscription not found");

    if (action === "APPROVE") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 6); // 6 days duration

      await subRef.update({
        status: "ACTIF",
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        endDate: admin.firestore.Timestamp.fromDate(endDate),
      });

      // Trigger PDF generation (internal call or separate function)
      // For simplicity, we'll return success and let the frontend call PDF gen or do it here
    } else {
      await subRef.update({ status: "REJETE" });
    }

    res.send("Subscription updated successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});