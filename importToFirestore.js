/**
 * Mumbai Parking Spots — Firestore Seed Script
 * 
 * SETUP:
 *   1. Place this file in your project root (same folder as package.json)
 *   2. npm install firebase-admin csv-parse
 *   3. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 *      Save it as serviceAccountKey.json in the same folder as this file
 *   4. node importToFirestore.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// ─── CONFIGURE THIS ───────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = "./serviceAccountKey.json";
const CSV_PATH = "./mumbai_parking_spots.csv";   // put the CSV in same folder
const COLLECTION_NAME = "parkingSpots";          // must match your app's collection
// ──────────────────────────────────────────────────────────────────

// Init Firebase Admin
const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

async function importParking() {
  console.log("📂 Reading CSV...");
  const raw = fs.readFileSync(path.resolve(CSV_PATH), "utf8");

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`✅ Found ${records.length} parking spots. Uploading to Firestore...\n`);

  const batch = db.batch();
  let count = 0;

  for (const row of records) {
    // Use the ID from CSV (P001, P002...) as Firestore document ID
    const docRef = db.collection(COLLECTION_NAME).doc(row["ID"]);

    const data = {
      id: row["ID"],
      name: row["Name"],
      area: row["Area / Locality"],
      address: row["Address"],
      type: row["Type"],
      latitude: parseFloat(row["Latitude"]),
      longitude: parseFloat(row["Longitude"]),
      totalSlots: parseInt(row["Total Slots"]),
      availableSlots: parseInt(row["Available Slots"]),
      pricePerHour: parseInt(row["Price/Hr (₹)"]),
      facilities: row["Facilities"]
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      timings: row["Timings"],
      managedBy: row["Managed By"],
      notes: row["Notes"] || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(docRef, data);
    count++;

    // Firestore batch limit is 500 — commit and start new batch if needed
    if (count % 499 === 0) {
      await batch.commit();
      console.log(`  ↳ Committed batch of 499`);
    }
  }

  // Commit remaining
  await batch.commit();

  console.log(`\n🎉 Done! ${count} parking spots imported to Firestore.`);
  console.log(`   Collection: "${COLLECTION_NAME}"`);
  console.log(`   Check your Firebase Console to verify ✅`);
  process.exit(0);
}

importParking().catch((err) => {
  console.error("❌ Import failed:", err.message);
  process.exit(1);
});