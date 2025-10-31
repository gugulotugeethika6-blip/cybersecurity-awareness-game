const API = "http://127.0.0.1:5000/api";
let token = localStorage.getItem("token") || null;

// ===================== AUTH =====================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  document.getElementById("auth-message").innerText = data.message || data.error;
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("challenge-section").style.display = "block";
    loadChallenges();
  } else {
    document.getElementById("auth-message").innerText = data.error;
  }
}

// ===================== CHALLENGES =====================
async function loadChallenges() {
  const res = await fetch(`${API}/challenges`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const list = document.getElementById("challenges");
  list.innerHTML = "";
  data.forEach((c) => {
    const li = document.createElement("li");
    li.innerText = `${c.title} (${c.difficulty})`;
    li.onclick = () => loadChallenge(c.id);
    list.appendChild(li);
  });
}

async function loadChallenge(id) {
  const res = await fetch(`${API}/challenges/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const c = await res.json();
  const detail = document.getElementById("challenge-detail");
  detail.innerHTML = `
    <h3>${c.title}</h3>
    <p>${c.question}</p>
    ${c.options
      .map(
        (opt, i) =>
          `<button onclick="submitAttempt(${c.id}, ${i})">${opt}</button>`
      )
      .join("<br>")}
  `;
}

async function submitAttempt(challengeId, selectedOption) {
  const res = await fetch(`${API}/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ challengeId, selectedOption }),
  });
  const data = await res.json();
  document.getElementById("result").innerText = data.message;
}

// ===================== LEADERBOARD =====================
async function loadLeaderboard() {
  const res = await fetch(`${API}/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const list = document.getElementById("leaderboard");
  list.innerHTML = "<h3>Leaderboard</h3>";
  data.forEach((u) => {
    const li = document.createElement("li");
    li.innerText = `${u.email} - ${u.points} pts`;
    list.appendChild(li);
  });
}
