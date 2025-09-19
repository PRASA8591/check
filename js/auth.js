import { db } from "./firebaseConfig.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // Look up user in Firestore
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      loginError.textContent = "Login failed — user not found";
      return;
    }

    let userData;
    querySnapshot.forEach((doc) => {
      userData = doc.data();
    });

    if (userData.password !== password) {
      loginError.textContent = "Login failed — wrong password";
      return;
    }

    // Save session
    localStorage.setItem("loggedInUser", JSON.stringify({
      username: userData.username,
      role: userData.role
    }));

    // Redirect
    if (userData.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    console.error("Login error:", error);
    loginError.textContent = "Error during login";
  }
});
