import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, runTransaction, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LayoutDashboard, Building2, ClipboardList, Users, PlusCircle, LogOut, Car, Zap } from 'lucide-react';

const Dashboard = ({ user, role }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let qSpots = collection(db, 'parkingSpots');
    if (role === 'admin') {
      qSpots = query(qSpots, where('managedBy', '==', user.email));
    }
    const unsubSpots = onSnapshot(qSpots, (snap) => {
      setSpots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const qBookings = query(collection(db, 'bookings'), where('bookedAt', '>=', sevenDaysAgo), orderBy('bookedAt', 'desc'));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSpots();
      unsubBookings();
    };
  }, [role, user.email]);

  useEffect(() => {
    if (role === 'superadmin') {
      getDocs(collection(db, 'users')).then(snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [role]);

  const handleLogout = () => auth.signOut();

  const toggleSpot = async (id, isOpen) => {
    await updateDoc(doc(db, 'parkingSpots', id), { isOpen });
  };

  const adjustSlots = async (id, delta) => {
    const spotRef = doc(db, 'parkingSpots', id);
    await runTransaction(db, async (tx) => {
      const d = await tx.get(spotRef);
      const current = d.data().availableSlots;
      const total = d.data().totalSlots;
      const newVal = Math.max(0, Math.min(total, current + delta));
      tx.update(spotRef, { availableSlots: newVal });
    });
  };

  const updateUserRole = async (id, newRole) => {
    await updateDoc(doc(db, 'users', id), { role: newRole });
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    alert('Role updated to ' + newRole);
  };

  const displayBookings = role === 'admin' 
    ? bookings.filter(b => spots.some(s => s.id === b.spotId || s.name === b.spotName))
    : bookings;

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <Overview spots={spots} bookings={displayBookings} role={role} />;
      case 'spots': return <Spots spots={spots} toggleSpot={toggleSpot} adjustSlots={adjustSlots} />;
      case 'bookings': return <Bookings bookings={displayBookings} />;
      case 'users': return role === 'superadmin' ? <UsersTable users={users} updateRole={updateUserRole} /> : null;
      case 'addspot': return role === 'superadmin' ? <AddSpot /> : null;
      default: return <Overview spots={spots} bookings={displayBookings} role={role} />;
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Car size={20} color="#00d2ff" />
          <h2>Smart Parking</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
            <span className="nav-icon"><LayoutDashboard size={18}/></span> Overview
          </a>
          <a href="#" className={`nav-item ${activeTab === 'spots' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('spots'); }}>
            <span className="nav-icon"><Building2 size={18}/></span> Parking Spots
          </a>
          <a href="#" className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('bookings'); }}>
            <span className="nav-icon"><ClipboardList size={18}/></span> Bookings
          </a>
          {role === 'superadmin' && (
            <>
              <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>
                <span className="nav-icon"><Users size={18}/></span> Users
              </a>
              <a href="#" className={`nav-item ${activeTab === 'addspot' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('addspot'); }}>
                <span className="nav-icon"><PlusCircle size={18}/></span> Add Spot
              </a>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">{role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="main-header">
          <h1 style={{ textTransform: 'capitalize' }}>{activeTab.replace('addspot', 'Add Spot')}</h1>
          <div className="header-actions">
            <span className="last-updated">Live updates enabled</span>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

// Subcomponents

const Overview = ({ spots, bookings, role }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (val) => val?.toDate ? val.toDate() : new Date(val);

  const todaysBookings = bookings.filter(b => b.bookedAt && parseDate(b.bookedAt) >= today);
  const activeBookings = todaysBookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
  const revenue = todaysBookings.filter(b => b.status === 'completed' && b.totalAmount).reduce((sum, b) => sum + b.totalAmount, 0);

  // Chart Logic (Last 7 days revenue)
  const chartData = [];
  let maxRev = 1;
  if (role === 'superadmin') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      
      const dayRev = bookings
        .filter(b => b.status === 'completed' && b.bookedAt && parseDate(b.bookedAt) >= start && parseDate(b.bookedAt) <= end)
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      if (dayRev > maxRev) maxRev = dayRev;
      chartData.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayRev });
    }
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Total Spots</span>
            <span className="stat-value">{spots.length}</span>
          </div>
          <div className="stat-icon"><Building2 size={32} /></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Bookings Today</span>
            <span className="stat-value">{todaysBookings.length}</span>
          </div>
          <div className="stat-icon"><ClipboardList size={32} /></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Revenue Today</span>
            <span className="stat-value">₹{revenue}</span>
          </div>
          <div className="stat-icon"><span style={{fontSize: '32px', fontWeight: 'bold'}}>₹</span></div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-info">
            <span className="stat-label">Active Now</span>
            <span className="stat-value">{activeBookings}</span>
          </div>
          <div className="stat-icon"><Zap size={32} /></div>
        </div>
      </div>

      {role === 'superadmin' && (
        <div className="card glass-panel" style={{ marginBottom: '32px' }}>
          <h3>Last 7 Days Revenue</h3>
          <div className="chart-container">
            {chartData.map((d, i) => {
              const heightPercent = Math.max((d.value / maxRev) * 100, 4);
              return (
                <div key={i} className="chart-bar-wrapper">
                  <span className="chart-value">₹{d.value}</span>
                  <div className="chart-bar" style={{ height: `${heightPercent}%` }}></div>
                  <span className="chart-label">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card glass-panel">
        <h3>Parking Spots Status</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Spot Name</th><th>Area</th><th>Available</th><th>Total</th><th>Rate</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {spots.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.area || '-'}</td>
                  <td><strong style={{color: s.availableSlots > 5 ? '#4ade80' : s.availableSlots > 0 ? '#fb923c' : '#ef4444'}}>{s.availableSlots}</strong></td>
                  <td>{s.totalSlots}</td>
                  <td>₹{s.pricePerHour}</td>
                  <td>{s.isOpen === false ? <span className="status-badge status-cancelled">Closed</span> : <span className="status-badge status-active">Open</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Spots = ({ spots, toggleSpot, adjustSlots }) => (
  <div className="card glass-panel">
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Available</th><th>Status Toggle</th><th>Adjust Slots</th>
          </tr>
        </thead>
        <tbody>
          {spots.map(s => (
            <tr key={s.id}>
              <td><code>{s.id.slice(0,6)}</code></td>
              <td>{s.name}</td>
              <td>{s.availableSlots} / {s.totalSlots}</td>
              <td>
                <label className="toggle">
                  <input type="checkbox" checked={s.isOpen !== false} onChange={(e) => toggleSpot(s.id, e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </td>
              <td>
                <div className="slot-controls">
                  <button className="btn-icon" onClick={() => adjustSlots(s.id, -1)}>−</button>
                  <button className="btn-icon" onClick={() => adjustSlots(s.id, 1)}>+</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ImmersiveBookingCard = ({ booking }) => {
  const [elapsed, setElapsed] = useState(0);

  let bookedAtStr = 'Unknown Time';
  let startTime = null;
  if (booking.bookedAt) {
    const dateObj = booking.bookedAt.toDate ? booking.bookedAt.toDate() : new Date(booking.bookedAt);
    startTime = dateObj.getTime();
    bookedAtStr = dateObj.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  useEffect(() => {
    if ((booking.status !== 'active' && booking.status !== 'confirmed') || !startTime) return;
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.status, startTime]);

  const mins = elapsed / 60;
  const currentFare = Math.max(booking.pricePerHour || 0, Math.ceil(mins) * (booking.pricePerHour || 0));

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const v = booking.vehicle || {};
  const isActive = booking.status === 'active' || booking.status === 'confirmed';

  return (
    <div className="immersive-card">
      <div className="ic-header">
        <div>
          <h4>{booking.spotName}</h4>
          <span className="ic-date">{bookedAtStr}</span>
        </div>
        <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
      </div>

      <div className="ic-body">
        <div className="ic-section ic-user">
          <h5>Owner Info</h5>
          <p><strong>{booking.ownerName || 'Unknown Owner'}</strong></p>
          <p>{booking.ownerPhone || 'No phone'}</p>
          <p className="ic-small">{booking.userId?.slice(0,8)}</p>
        </div>

        <div className="ic-section ic-vehicle">
          <h5>Vehicle Info</h5>
          <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
            {v.photoUrl ? (
              <img src={v.photoUrl} alt="Vehicle" className="ic-vehicle-img" />
            ) : (
              <div className="ic-vehicle-img-placeholder"><Car size={24} color="#64748b"/></div>
            )}
            <div>
              <p><strong>{v.make} {v.model}</strong></p>
              <p className="ic-plate">{v.plateNumber || 'No Plate'}</p>
              <p className="ic-small">{v.type || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="ic-footer">
        {isActive ? (
          <>
            <div className="ic-timer">
              <span className="ic-label">Elapsed Time</span>
              <span className="ic-time-value">{formatTimer(elapsed)}</span>
            </div>
            <div className="ic-fare">
              <span className="ic-label">Live Fare</span>
              <span className="ic-fare-value">₹{currentFare}</span>
            </div>
          </>
        ) : (
          <>
            <div className="ic-timer">
              <span className="ic-label">Rate</span>
              <span className="ic-time-value">₹{booking.pricePerHour}/hr</span>
            </div>
            <div className="ic-fare">
              <span className="ic-label">Total Paid</span>
              <span className="ic-fare-value">₹{booking.totalAmount || '-'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Bookings = ({ bookings }) => {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="card glass-panel" style={{background: 'transparent', boxShadow: 'none'}}>
      <div className="card-header-row" style={{background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '16px', marginBottom: '20px'}}>
        <h3 style={{margin: 0}}>Today's Bookings ({filtered.length})</h3>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      <div className="immersive-grid">
        {filtered.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px', width: '100%', color: '#94a3b8'}}>No bookings found.</div>
        ) : (
          filtered.map(b => <ImmersiveBookingCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
};

const UsersTable = ({ users, updateRole }) => (
  <div className="card glass-panel">
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr><th>Email</th><th>Role</th><th>Joined</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>
                <select className="filter-select" value={u.role || 'user'} onChange={(e) => updateRole(u.id, e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </td>
              <td>{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AddSpot = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supportedVehicles = [];
    if (formData.get('supportCar')) supportedVehicles.push('Car');
    if (formData.get('supportBike')) supportedVehicles.push('Bike');
    if (formData.get('supportTruck')) supportedVehicles.push('Truck');

    if (supportedVehicles.length === 0) {
      alert('Please select at least one supported vehicle type.');
      return;
    }

    try {
      await addDoc(collection(db, 'parkingSpots'), {
        name: formData.get('name'),
        area: formData.get('area'),
        address: formData.get('address'),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude')),
        totalSlots: parseInt(formData.get('totalSlots')),
        availableSlots: parseInt(formData.get('availableSlots')),
        pricePerHour: parseInt(formData.get('pricePerHour')),
        type: formData.get('type'),
        timings: formData.get('timings'),
        managedBy: formData.get('managedBy'),
        facilities: formData.get('facilities').split(',').map(f => f.trim()),
        supportedVehicles,
        isOpen: true,
      });
      alert('Spot added successfully!');
      e.target.reset();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="card glass-panel form-card">
      <form onSubmit={handleSubmit} className="spot-form">
        <div className="form-row">
          <div className="form-group"><label>Name</label><input name="name" required /></div>
          <div className="form-group"><label>Area</label><input name="area" required /></div>
        </div>
        <div className="form-group"><label>Address</label><input name="address" required /></div>
        <div className="form-row">
          <div className="form-group"><label>Latitude</label><input type="number" step="any" name="latitude" required /></div>
          <div className="form-group"><label>Longitude</label><input type="number" step="any" name="longitude" required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Total Slots</label><input type="number" name="totalSlots" required /></div>
          <div className="form-group"><label>Available Slots</label><input type="number" name="availableSlots" required /></div>
          <div className="form-group"><label>Price/Hr (₹)</label><input type="number" name="pricePerHour" required /></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select name="type">
              <option>Multi-Level</option><option>Open-Air</option><option>Underground</option>
            </select>
          </div>
          <div className="form-group"><label>Timings</label><input name="timings" defaultValue="24/7" /></div>
          <div className="form-group"><label>Managed By (Admin Email)</label><input name="managedBy" required /></div>
        </div>
        <div className="form-group"><label>Facilities (comma-separated)</label><input name="facilities" defaultValue="CCTV, EV Charging" /></div>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label>Supported Vehicles</label>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
              <input type="checkbox" name="supportCar" defaultChecked style={{ width: 'auto' }} /> Car
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
              <input type="checkbox" name="supportBike" defaultChecked style={{ width: 'auto' }} /> Bike
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
              <input type="checkbox" name="supportTruck" style={{ width: 'auto' }} /> Truck
            </label>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Parking Spot</button>
      </form>
    </div>
  );
};

export default Dashboard;
