import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Elements */
const logoutBtn = document.getElementById('logoutBtn');
const welcome = document.getElementById('welcome');
const yearInput = document.getElementById('year');
const monthSelect = document.getElementById('month');
const attendanceBody = document.getElementById('attendanceBody');
const totalHoursEl = document.getElementById('totalHours');
const popup = document.getElementById('popup');
const monthTitle = document.getElementById('monthTitle');

const user = JSON.parse(localStorage.getItem("loggedInUser"));
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* popup */
function showPopup(msg, type="success"){
  popup.textContent = msg;
  popup.style.background = type==="error" ? "#ef4444" : "#16a34a";
  popup.style.display = "block";
  setTimeout(()=>popup.style.display="none",2000);
}

/* logout */
logoutBtn.addEventListener("click", ()=>{
  localStorage.removeItem("loggedInUser");
  window.location.replace("index.html");
});

/* init */
welcome.textContent = `Welcome, ${user.username}`;

/* Load attendance */
async function loadAttendance(){
  const year = yearInput.value;
  const month = monthSelect.value;
  monthTitle.textContent = `${monthNames[month-1]} ${year}`;

  const docId = `${user.username}_${year}_${month}`;
  const ref = doc(db,"attendance",docId);
  const snap = await getDoc(ref);
  let data = snap.exists() ? snap.data() : {};

  // build dates
  const days = new Date(year, month, 0).getDate();
  attendanceBody.innerHTML = "";
  let total=0;

  for(let d=1; d<=days; d++){
    const date = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const row = data[date] || {};

    const tr=document.createElement("tr");

    // date
    const dateTd=document.createElement("td"); dateTd.textContent=date; tr.appendChild(dateTd);

    // inTime
    const inTd=document.createElement("td");
    const inInput=document.createElement("input");
    inInput.type="time"; inInput.value=row.inTime||"";
    inInput.addEventListener("change",()=>save(date,"inTime",inInput.value));
    inTd.appendChild(inInput); tr.appendChild(inTd);

    // outDate
    const odTd=document.createElement("td");
    const odInput=document.createElement("input");
    odInput.type="date"; odInput.value=row.outDate||date;
    odInput.addEventListener("change",()=>save(date,"outDate",odInput.value));
    odTd.appendChild(odInput); tr.appendChild(odTd);

    // outTime
    const otTd=document.createElement("td");
    const otInput=document.createElement("input");
    otInput.type="time"; otInput.value=row.outTime||"";
    otInput.addEventListener("change",()=>save(date,"outTime",otInput.value));
    otTd.appendChild(otInput); tr.appendChild(otTd);

    // hours
    const hrsTd=document.createElement("td");
    const hours=calcHours(row.inTime,row.outTime,row.outDate,date);
    hrsTd.textContent=hours.toFixed(2);
    tr.appendChild(hrsTd);

    attendanceBody.appendChild(tr);
    total+=hours;
  }
  totalHoursEl.textContent=total.toFixed(2);
}

/* save field change */
async function save(date, field, value){
  const year=yearInput.value;
  const month=monthSelect.value;
  const docId=`${user.username}_${year}_${month}`;
  const ref=doc(db,"attendance",docId);

  // ensure doc exists
  await setDoc(ref, {}, {merge:true});

  const snap=await getDoc(ref);
  let current=snap.exists()? snap.data():{};
  if(!current[date]) current[date]={ outDate:date };

  current[date][field]=value;

  // recalc hours
  const h=calcHours(current[date].inTime,current[date].outTime,current[date].outDate,date);
  current[date].hours=h;

  await updateDoc(ref,{ [date]: current[date] });
  showPopup("Attendance saved ✅");
  
  // update only affected row instead of full reload (faster)
  loadAttendance();
}

/* calc hours */
function calcHours(inTime,outTime,outDate,inDate){
  if(!inTime||!outTime) return 0;
  const start=new Date(`${inDate}T${inTime}`);
  const end=new Date(`${outDate||inDate}T${outTime}`);
  let diff=(end-start)/1000/3600;
  return diff>0?diff:0;
}

/* events */
yearInput.addEventListener("change",loadAttendance);
monthSelect.addEventListener("change",loadAttendance);

/* init load */
loadAttendance();
