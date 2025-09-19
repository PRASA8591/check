import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const popup = document.getElementById("popup");

function showPopup(msg, type="success") {
  popup.textContent = msg;
  popup.style.background = type==="error" ? "#ef4444" : "#16a34a";
  popup.style.display = "block";
  setTimeout(()=>popup.style.display="none",2000);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showPopup("Please fill all fields", "error");
    return;
  }

  try {
    const ref = doc(db, "users", username);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      showPopup("User not found ❌", "error");
      return;
    }

    const user = snap.data();
    if (user.password !== password) {
      showPopup("Incorrect password ❌", "error");
      return;
    }

    // Save session
    localStorage.setItem("loggedInUser", JSON.stringify({ username, role: user.role }));

    showPopup("Login successful ✅");

    setTimeout(() => {
      if (user.role === "admin") {
        window.location.replace("admin.html");
      } else {
        window.location.replace("dashboard.html");
      }
    }, 1000);

  } catch (err) {
    console.error(err);
    showPopup("Login failed ❌", "error");
  }
});
