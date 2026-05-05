const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const SUPER_ADMIN_EMAIL = 'admin@smartparking.com';
const SUPER_ADMIN_PASSWORD = 'Admin@123';

async function createSuperAdmin() {
  try {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
      console.log('User already exists in Auth. Updating password...');
      await auth.updateUser(userRecord.uid, { password: SUPER_ADMIN_PASSWORD });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        console.log('Creating new Auth user...');
        userRecord = await auth.createUser({
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
          displayName: 'Super Admin',
        });
      } else {
        throw error;
      }
    }

    // Set role in Firestore
    console.log('Setting superadmin role in Firestore...');
    await db.collection('users').doc(userRecord.uid).set({
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Super Admin',
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('\n✅ Super Admin created successfully!');
    console.log('-----------------------------------');
    console.log(`Email:    ${SUPER_ADMIN_EMAIL}`);
    console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('-----------------------------------');
    console.log('You can now log into the React PWA with these credentials.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating super admin:', err);
    process.exit(1);
  }
}

createSuperAdmin();
