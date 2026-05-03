// ─── Firebase Config ────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBsF6job0buTlXVxu4NZF0BkD4_u_acSbo",
  authDomain: "parking-smart-6ef82.firebaseapp.com",
  projectId: "parking-smart-6ef82",
  storageBucket: "parking-smart-6ef82.firebasestorage.app",
  messagingSenderId: "381494004880",
  appId: "1:381494004880:web:eb8bf82c77e82996941c15"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ─── State ──────────────────────────────────────────────
let currentUser = null;
let userRole = 'user';
let allSpots = [];
let allBookings = [];
let allUsers = [];
let unsubSpots = null;
let unsubBookings = null;

// ─── Auth ───────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  document.getElementById('loginBtnText').textContent = 'Signing in...';
  loginError.textContent = '';

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const userDoc = await db.collection('users').doc(cred.user.uid).get();
    
    if (!userDoc.exists || !['admin', 'superadmin'].includes(userDoc.data().role)) {
      loginError.textContent = 'Access denied. Admin or Super Admin role required.';
      await auth.signOut();
      document.getElementById('loginBtnText').textContent = 'Sign In';
      return;
    }
  } catch (error) {
    loginError.textContent = error.message;
    document.getElementById('loginBtnText').textContent = 'Sign In';
  }
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && ['admin', 'superadmin'].includes(userDoc.data().role)) {
      currentUser = user;
      userRole = userDoc.data().role;
      showDashboard();
    }
  } else {
    currentUser = null;
    userRole = 'user';
    showAuth();
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  if (unsubSpots) unsubSpots();
  if (unsubBookings) unsubBookings();
  auth.signOut();
});

function showAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginBtnText').textContent = 'Sign In';
}

function showDashboard() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userRole').textContent = userRole;
  
  // Show super admin items
  if (userRole === 'superadmin') {
    document.querySelectorAll('.superadmin-only').forEach(el => el.style.display = 'flex');
  }
  
  initData();
}

// ─── Navigation ─────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    
    document.getElementById('pageTitle').textContent = item.textContent.trim();
  });
});

document.getElementById('refreshBtn').addEventListener('click', initData);

// ─── Data Loading ───────────────────────────────────────
function initData() {
  loadSpots();
  loadBookings();
  if (userRole === 'superadmin') loadUsers();
  updateTimestamp();
}

function updateTimestamp() {
  document.getElementById('lastUpdated').textContent = 
    'Updated: ' + new Date().toLocaleTimeString('en-IN');
}

// ─── Parking Spots ──────────────────────────────────────
function loadSpots() {
  if (unsubSpots) unsubSpots();

  let spotsQuery = db.collection('parkingSpots');
  
  // Admins only see their managed spots
  if (userRole === 'admin') {
    spotsQuery = spotsQuery.where('managedBy', '==', currentUser.email);
  }

  unsubSpots = spotsQuery.onSnapshot(snapshot => {
    allSpots = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('totalSpots').textContent = allSpots.length;
    renderSpotsTable();
    renderManageSpotsTable();
  });
}

function renderSpotsTable() {
  const tbody = document.getElementById('spotsTableBody');
  tbody.innerHTML = allSpots.map(spot => `
    <tr>
      <td><strong>${spot.name}</strong></td>
      <td>${spot.area || '-'}</td>
      <td><strong style="color:${spot.availableSlots > 5 ? '#16a34a' : spot.availableSlots > 0 ? '#ea580c' : '#dc2626'}">${spot.availableSlots}</strong></td>
      <td>${spot.totalSlots}</td>
      <td>₹${spot.pricePerHour}</td>
      <td>${spot.isOpen === false ? '<span class="status-badge status-cancelled">Closed</span>' : '<span class="status-badge status-active">Open</span>'}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${spot.isOpen !== false ? 'checked' : ''} onchange="toggleSpot('${spot.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </td>
    </tr>
  `).join('');
}

function renderManageSpotsTable() {
  const tbody = document.getElementById('manageSpotsBody');
  tbody.innerHTML = allSpots.map(spot => `
    <tr>
      <td><code>${spot.id}</code></td>
      <td>${spot.name}</td>
      <td>${spot.area || '-'}</td>
      <td><span class="slot-value" id="slot-${spot.id}">${spot.availableSlots}</span></td>
      <td>₹${spot.pricePerHour}</td>
      <td>${spot.isOpen === false ? '<span class="status-badge status-cancelled">Closed</span>' : '<span class="status-badge status-active">Open</span>'}</td>
      <td>
        <div class="slot-controls">
          <button class="btn-icon" onclick="adjustSlots('${spot.id}', -1)">−</button>
          <span class="slot-value">${spot.availableSlots}</span>
          <button class="btn-icon" onclick="adjustSlots('${spot.id}', 1)">+</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Spot Actions ───────────────────────────────────────
window.toggleSpot = async (spotId, isOpen) => {
  try {
    await db.collection('parkingSpots').doc(spotId).update({ isOpen });
  } catch (e) {
    console.error('Error toggling spot:', e);
    alert('Failed to update spot status');
  }
};

window.adjustSlots = async (spotId, delta) => {
  try {
    const spotRef = db.collection('parkingSpots').doc(spotId);
    await db.runTransaction(async tx => {
      const doc = await tx.get(spotRef);
      const current = doc.data().availableSlots;
      const total = doc.data().totalSlots;
      const newVal = Math.max(0, Math.min(total, current + delta));
      tx.update(spotRef, { availableSlots: newVal });
    });
  } catch (e) {
    console.error('Error adjusting slots:', e);
    alert('Failed to adjust slots');
  }
};

// ─── Bookings ───────────────────────────────────────────
function loadBookings() {
  if (unsubBookings) unsubBookings();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let bookingsQuery = db.collection('bookings')
    .where('bookedAt', '>=', today)
    .orderBy('bookedAt', 'desc');

  unsubBookings = bookingsQuery.onSnapshot(snapshot => {
    allBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    document.getElementById('todayBookings').textContent = allBookings.length;
    document.getElementById('activeBookings').textContent = 
      allBookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
    
    const revenue = allBookings
      .filter(b => b.status === 'completed' && b.totalAmount)
      .reduce((sum, b) => sum + b.totalAmount, 0);
    document.getElementById('todayRevenue').textContent = `₹${revenue}`;
    
    renderBookingsTable();
    renderRevenueChart();
  });
}

function renderBookingsTable() {
  const filter = document.getElementById('bookingFilter').value;
  const filtered = filter === 'all' ? allBookings : allBookings.filter(b => b.status === filter);
  
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = filtered.length === 0 
    ? '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">No bookings found</td></tr>'
    : filtered.map(b => {
      const time = b.bookedAt?.toDate ? b.bookedAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';
      return `
        <tr>
          <td><code>#${b.id.slice(-8).toUpperCase()}</code></td>
          <td>${b.userEmail || b.userId?.slice(0, 8) || '-'}</td>
          <td>${b.spotName}</td>
          <td>${time}</td>
          <td>${b.totalAmount ? '₹' + b.totalAmount : '-'}</td>
          <td><span class="status-badge status-${b.status}">${b.status}</span></td>
        </tr>
      `;
    }).join('');
}

document.getElementById('bookingFilter').addEventListener('change', renderBookingsTable);

// ─── Revenue Chart ──────────────────────────────────────
async function renderRevenueChart() {
  const container = document.getElementById('revenueChart');
  const days = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    try {
      const snap = await db.collection('bookings')
        .where('bookedAt', '>=', date)
        .where('bookedAt', '<', nextDay)
        .where('status', '==', 'completed')
        .get();
      
      const rev = snap.docs.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
      days.push({
        label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        value: rev,
      });
    } catch (e) {
      days.push({ label: date.toLocaleDateString('en-IN', { weekday: 'short' }), value: 0 });
    }
  }

  const max = Math.max(...days.map(d => d.value), 1);
  
  container.innerHTML = days.map(d => {
    const height = Math.max(4, (d.value / max) * 160);
    return `
      <div class="chart-bar-wrapper">
        <span class="chart-value">${d.value > 0 ? '₹' + d.value : '-'}</span>
        <div class="chart-bar" style="height:${height}px;flex-shrink:0;margin-top:auto;"></div>
        <span class="chart-label">${d.label}</span>
      </div>
    `;
  }).join('');
}

// ─── Users (Super Admin) ────────────────────────────────
async function loadUsers() {
  try {
    const snap = await db.collection('users').get();
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderUsersTable();
  } catch (e) {
    console.error('Error loading users:', e);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = allUsers.map(u => {
    const joined = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('en-IN') : '-';
    return `
      <tr>
        <td>${u.email}</td>
        <td>${u.displayName || '-'}</td>
        <td>
          <select class="filter-select" onchange="updateUserRole('${u.id}', this.value)" style="font-size:12px;padding:4px 8px;">
            <option value="user" ${u.role === 'user' || !u.role ? 'selected' : ''}>User</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
          </select>
        </td>
        <td>${joined}</td>
        <td>-</td>
      </tr>
    `;
  }).join('');
}

window.updateUserRole = async (userId, role) => {
  try {
    await db.collection('users').doc(userId).update({ role });
    alert(`Role updated to "${role}" successfully`);
  } catch (e) {
    console.error('Error updating role:', e);
    alert('Failed to update role');
  }
};

// ─── Add Spot (Super Admin) ─────────────────────────────
document.getElementById('addSpotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('addSpotMsg');

  try {
    const data = {
      name: document.getElementById('spotName').value,
      area: document.getElementById('spotArea').value,
      address: document.getElementById('spotAddress').value,
      latitude: parseFloat(document.getElementById('spotLat').value),
      longitude: parseFloat(document.getElementById('spotLng').value),
      totalSlots: parseInt(document.getElementById('spotTotal').value),
      availableSlots: parseInt(document.getElementById('spotAvailable').value),
      pricePerHour: parseInt(document.getElementById('spotPrice').value),
      type: document.getElementById('spotType').value,
      timings: document.getElementById('spotTimings').value,
      managedBy: document.getElementById('spotManagedBy').value,
      facilities: document.getElementById('spotFacilities').value.split(',').map(f => f.trim()).filter(Boolean),
      isOpen: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('parkingSpots').add(data);
    msg.textContent = `✅ Spot added successfully (ID: ${docRef.id})`;
    e.target.reset();
    document.getElementById('spotTimings').value = '24/7';
    document.getElementById('spotFacilities').value = 'CCTV, EV Charging';
  } catch (error) {
    msg.textContent = '';
    alert('Error adding spot: ' + error.message);
  }
});
