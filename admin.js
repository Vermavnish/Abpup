// admin.js – Admin dashboard logic with Firebase Realtime Database // --------------------------------------------------------------- // NOTE: This file is loaded with <script src="admin.js" type="module"></script> // It expects that the HTML already contains elements with the IDs referenced below. // Wherever the HTML originally had free‑text <input>, replace them with <select> // (keeping the same IDs) so the script can inject options dynamically. // ---------------------------------------------------------------

// 1️⃣ Firebase INITIALISATION import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js"; import { getAnalytics }   from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js"; import { getDatabase, ref, child, get, push, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyDw5IKZIiMvlvS1L8ofg6cKKMtXrVeN6zQ", authDomain: "avni-c6af6.firebaseapp.com", databaseURL: "https://avni-c6af6-default-rtdb.firebaseio.com", projectId: "avni-c6af6", storageBucket: "avni-c6af6.appspot.com", messagingSenderId: "158260273585", appId: "1:158260273585:web:06f310e48a87f404815d90", measurementId: "G-ZBNE463P71" };

const app       = initializeApp(firebaseConfig); const analytics = getAnalytics(app); const db        = getDatabase(app);

// 2️⃣ DOM REFERENCES -------------------------------------------------------- // Batch creation const batchNameInput = document.getElementById("batchName"); const createBatchBtn = document.querySelector("button[onclick='createBatch()']");

// Subject‑level const subjectBatchSel = document.getElementById("subjectBatch"); // <select> const subjectNameInput = document.getElementById("subjectName"); const addSubjectBtn    = document.querySelector("button[onclick='addSubject()']");

// Chapter‑level const chapterBatchSel   = document.getElementById("chapterBatch"); // <select> const chapterSubjectSel = document.getElementById("chapterSubject"); // <select> const chapterNameInput  = document.getElementById("chapterName"); const addChapterBtn     = document.querySelector("button[onclick='addChapter()']");

// Content‑level const contentBatchSel   = document.getElementById("contentBatch");  // <select> const contentSubjectSel = document.getElementById("contentSubject"); // <select> const contentChapterSel = document.getElementById("contentChapter"); // <select> const contentTitleInput = document.getElementById("contentTitle"); const contentUrlInput   = document.getElementById("contentUrl"); const contentTypeSel    = document.getElementById("contentType"); const addContentBtn     = document.querySelector("button[onclick='addContent()']");

// Student assignment const studentEmailInput = document.getElementById("studentEmail"); const assignBatchSel    = document.getElementById("assignBatch");   // <select> const assignBatchBtn    = document.querySelector("button[onclick='assignBatch()']");

// 3️⃣ HELPER FUNCTIONS ----------------------------------------------------- const OPTION_PLACEHOLDER = "-- Select --";

function clearSelect(sel) { sel.innerHTML = ""; sel.appendChild(new Option(OPTION_PLACEHOLDER, "")); }

function normaliseKey(text) { // Firebase RTDB keys cannot contain . # $ [ ] return text.replace(/[.#$]/g, "_"); }

function emailKey(email) { return normaliseKey(email.toLowerCase()); }

function toast(msg, isError = false) { alert(${isError ? "❌" : "✅"} ${msg}); // Simple placeholder – replace with nicer UI if desired }

// 4️⃣ LOADERS -------------------------------------------------------------- async function loadBatchesAndPopulate() { const snapshot = await get(ref(db, "batches")); const data = snapshot.exists() ? snapshot.val() : {};

const selects = [subjectBatchSel, chapterBatchSel, contentBatchSel, assignBatchSel]; selects.forEach(clearSelect);

Object.keys(data).forEach(batchName => { selects.forEach(sel => sel.appendChild(new Option(batchName, batchName))); });

// Trigger downstream loading when a selection already exists if (subjectBatchSel.value) loadSubjectsAndPopulate(subjectBatchSel.value); if (chapterBatchSel.value && chapterSubjectSel.value) loadChaptersAndPopulate(chapterBatchSel.value, chapterSubjectSel.value); }

async function loadSubjectsAndPopulate(batchName) { clearSelect(chapterSubjectSel); clearSelect(contentSubjectSel); const snapshot = await get(ref(db, batches/${normaliseKey(batchName)}/subjects)); const data = snapshot.exists() ? snapshot.val() : {}; Object.keys(data).forEach(subName => { [chapterSubjectSel, contentSubjectSel].forEach(sel => sel.appendChild(new Option(subName, subName))); });

// Refresh chapters if subject already chosen if (chapterSubjectSel.value) loadChaptersAndPopulate(batchName, chapterSubjectSel.value); }

async function loadChaptersAndPopulate(batchName, subjectName) { clearSelect(contentChapterSel); const snapshot = await get(ref(db, batches/${normaliseKey(batchName)}/subjects/${normaliseKey(subjectName)}/chapters)); const data = snapshot.exists() ? snapshot.val() : {}; Object.keys(data).forEach(chapName => { contentChapterSel.appendChild(new Option(chapName, chapName)); }); }

// 5️⃣ CRUD OPERATIONS ------------------------------------------------------- async function createBatch() { const name = batchNameInput.value.trim(); if (!name) return toast("Batch name required", true);

await set(ref(db, batches/${normaliseKey(name)}), { createdAt: Date.now() }); batchNameInput.value = ""; toast(Batch '${name}' created); loadBatchesAndPopulate(); }

async function addSubject() { const batch = subjectBatchSel.value; const subject = subjectNameInput.value.trim(); if (!batch || !subject) return toast("Select batch & subject name", true);

await set(ref(db, batches/${normaliseKey(batch)}/subjects/${normaliseKey(subject)}), { createdAt: Date.now() }); subjectNameInput.value = ""; toast(Subject '${subject}' added to '${batch}'); loadSubjectsAndPopulate(batch); }

async function addChapter() { const batch   = chapterBatchSel.value; const subject = chapterSubjectSel.value; const chapter = chapterNameInput.value.trim(); if (!batch || !subject || !chapter) return toast("Select batch, subject & chapter", true);

await set(ref(db, batches/${normaliseKey(batch)}/subjects/${normaliseKey(subject)}/chapters/${normaliseKey(chapter)}), { createdAt: Date.now() }); chapterNameInput.value = ""; toast(Chapter '${chapter}' added to '${subject}' in '${batch}'); loadChaptersAndPopulate(batch, subject); }

async function addContent() { const batch   = contentBatchSel.value; const subject = contentSubjectSel.value; const chapter = contentChapterSel.value; const title   = contentTitleInput.value.trim(); const url     = contentUrlInput.value.trim(); const type    = contentTypeSel.value;

if (!batch || !subject || !chapter || !title || !url) return toast("Please fill all fields", true);

const listRef = ref(db, batches/${normaliseKey(batch)}/subjects/${normaliseKey(subject)}/chapters/${normaliseKey(chapter)}/content); await push(listRef, { title, url, type, createdAt: Date.now() });

contentTitleInput.value = ""; contentUrlInput.value   = ""; toast(${type.toUpperCase()} '${title}' added to '${chapter}'); }

async function assignBatch() { const email = studentEmailInput.value.trim(); const batch = assignBatchSel.value; if (!email || !batch) return toast("Student email & batch required", true);

await set(ref(db, students/${emailKey(email)}/batches/${normaliseKey(batch)}), true); studentEmailInput.value = ""; toast(Batch '${batch}' assigned to ${email}); }

// 6️⃣ EVENT LISTENERS ------------------------------------------------------ createBatchBtn.addEventListener("click",   createBatch); addSubjectBtn.addEventListener("click",    addSubject); addChapterBtn.addEventListener("click",    addChapter); addContentBtn.addEventListener("click",    addContent); assignBatchBtn.addEventListener("click",   assignBatch);

subjectBatchSel.addEventListener("change", e => loadSubjectsAndPopulate(e.target.value)); chapterBatchSel.addEventListener("change", e => loadSubjectsAndPopulate(e.target.value)); contentBatchSel.addEventListener("change", e => loadSubjectsAndPopulate(e.target.value)); chapterSubjectSel.addEventListener("change", () => loadChaptersAndPopulate(chapterBatchSel.value, chapterSubjectSel.value)); contentSubjectSel.addEventListener("change", () => loadChaptersAndPopulate(contentBatchSel.value, contentSubjectSel.value));

// 7️⃣ INITIAL BOOTSTRAP ---------------------------------------------------- loadBatchesAndPopulate();

// Optional: Keep selects live‑updated (listener on /batches root) onValue(ref(db, "batches"), loadBatchesAndPopulate);

