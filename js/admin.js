// admin.js
import { db } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Elements */
const addUserForm = document.getElementById('addUserForm');
const usersList = document.getElementById('usersList');
const logoutBtn = document.getElementById('logoutBtn');
const popup = document.getElementById('popup');
const selectUser = document.getElementById('selectUser');
const checkAttendanceBtn = document.getElementById('checkAttendanceBtn');
const attendanceSection = document.getElementById('attendanceSection');
const attendanceBody = document.getElementById('attendanceBody');
const totalHoursEl = document.getElementById('totalHours');
const selectedUserEl = document.getElementById('selectedUser');
const selectedMonthEl = document.getElementById('selectedMonth');
const selectedYearEl = document.getElementById('selectedYear');

const editModal = document.getElementById('editModal');
const editUsername = document.getElementById('editUsername');
const editPassword = document.getElementById('editPassword');
const editRole = document.getElementById('editRole');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmText = document.getElementById('confirmText');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let currentEditId = null;
let currentDeleteId = null;
let currentDeleteUsername = null;

/* session guard (module-level too) */
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
if (!loggedInUser || loggedInUser.role !== 'admin') {
  window.location.replace('index.html');
}

/* popup helper */
function showPopup(message, type = 'success') {
  popup.textContent = message;
  popup.style.background = type === 'error' ? '#ef4444' : '#16a34a';
  popup.style.display = 'block';
  setTimeout(() => { popup.style.display = 'none'; }, 2000);
}

/* Logout */
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'index.html';
});

/* Load users — sorted alphabetically */
async function loadUsers() {
  usersList.innerHTML = '';
  selectUser.innerHTML = '';
  const snap = await getDocs(collection(db, 'users'));
  // collect docs then sort by username
  const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  docs.sort((a,b) => (a.data.username || '').toLowerCase().localeCompare((b.data.username || '').toLowerCase()));

  for (const d of docs) {
    const user = d.data;
    const tr = document.createElement('tr');

    const usernameTd = document.createElement('td');
    usernameTd.textContent = user.username || '';

    const roleTd = document.createElement('td');
    roleTd.textContent = user.role || 'user';

    const actionsTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(d.id, user));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.textContent = 'Delete';
    delBtn.style.background = '#ef4444';
    delBtn.addEventListener('click', () => openDeleteModal(d.id, user.username || ''));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);

    tr.appendChild(usernameTd);
    tr.appendChild(roleTd);
    tr.appendChild(actionsTd);
    usersList.appendChild(tr);

    // dropdown option
    const opt = document.createElement('option');
    opt.value = user.username || '';
    opt.textContent = user.username || '';
    selectUser.appendChild(opt);
  }
}

/* Add user */
addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const role = document.getElementById('newRole').value;
  if (!username) { showPopup('Username required', 'error'); return; }

  try {
    await addDoc(collection(db, 'users'), { username, password, role });
    addUserForm.reset();
    await loadUsers();
    showPopup(`User "${username}" created ✅`);
  } catch (err) {
    console.error('Add user error', err);
    showPopup('Error creating user ❌', 'error');
  }
});

/* ---------- Edit modal ---------- */
function openEditModal(id, user) {
  currentEditId = id;
  editUsername.value = user.username || '';
  editPassword.value = user.password || '';
  editRole.value = user.role || 'user';
  editModal.style.display = 'flex';
  editModal.setAttribute('aria-hidden', 'false');
}
cancelEditBtn.addEventListener('click', () => {
  currentEditId = null;
  editModal.style.display = 'none';
  editModal.setAttribute('aria-hidden', 'true');
});
saveEditBtn.addEventListener('click', async () => {
  if (!currentEditId) return;
  const u = editUsername.value.trim();
  const p = editPassword.value;
  const r = editRole.value;
  try {
    await updateDoc(doc(db, 'users', currentEditId), { username: u, password: p, role: r });
    editModal.style.display = 'none';
    currentEditId = null;
    await loadUsers();
    showPopup(`User "${u}" edited ✅`);
  } catch (err) {
    console.error('Edit error', err);
    showPopup('Error editing user ❌', 'error');
  }
});

/* ---------- Delete modal ---------- */
function openDeleteModal(id, username) {
  currentDeleteId = id;
  currentDeleteUsername = username;
  confirmText.textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
  confirmModal.style.display = 'flex';
  confirmModal.setAttribute('aria-hidden', 'false');
}
confirmNo.addEventListener('click', () => {
  currentDeleteId = null;
  confirmModal.style.display = 'none';
  confirmModal.setAttribute('aria-hidden', 'true');
});
confirmYes.addEventListener('click', async () => {
  if (!currentDeleteId) return;
  try {
    await deleteDoc(doc(db, 'users', currentDeleteId));
    confirmModal.style.display = 'none';
    const uname = currentDeleteUsername || '';
    currentDeleteId = null;
    currentDeleteUsername = null;
    await loadUsers();
    showPopup(`User "${uname}" deleted ❌`, 'error');
  } catch (err) {
    console.error('Delete error', err);
    showPopup('Error deleting user ❌', 'error');
  }
});

/* ---------- Attendance viewer ---------- */
checkAttendanceBtn.addEventListener('click', async () => {
  const username = selectUser.value;
  const year = document.getElementById('year').value;
  const month = document.getElementById('month').value;
  if (!username) { showPopup('Choose a user first', 'error'); return; }

  const docId = `${username}_${year}_${month}`;
  const attRef = doc(db, 'attendance', docId);
  const attSnap = await getDoc(attRef);
  attendanceBody.innerHTML = '';
  let total = 0;

  if (attSnap.exists()) {
    const data = attSnap.data();
    // ensure dates sorted ascending
    const dates = Object.keys(data).sort((a,b) => a.localeCompare(b));
    for (const date of dates) {
      const r = data[date] || {};
      const tr = document.createElement('tr');
      const hours = parseFloat(r.hours || 0) || 0;
      total += hours;

      tr.innerHTML = `
        <td>${date}</td>
        <td>${r.inTime || ''}</td>
        <td>${r.outDate || ''}</td>
        <td>${r.outTime || ''}</td>
        <td>${hours.toFixed(2)}</td>
      `;
      attendanceBody.appendChild(tr);
    }
  } else {
    showPopup(`No attendance found for ${username}`, 'error');
  }

  selectedUserEl.textContent = username;
  selectedMonthEl.textContent = document.getElementById('month').options[month-1].text;
  selectedYearEl.textContent = year;
  totalHoursEl.textContent = total.toFixed(2);
  attendanceSection.style.display = 'block';
});

/* initial load */
loadUsers().catch(err => console.error(err));
