const PASSWORD = "lunchboss";
const applicantCSV = "https://docs.google.com/spreadsheets/d/1X0oWxxP0XuxRnw32x7vfp10U5UuZYj_KHi5rY1xftDk/gviz/tq?tqx=out:csv";
const staffCSV = "https://docs.google.com/spreadsheets/d/1nLCJ5UUyMnXx5urkTBqc3n-08U7vr2o69POWtNQvkuM/gviz/tq?tqx=out:csv";

let applicants = [];
let staffMap = {};

function normalize(str) {
  return str.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loginBtn").addEventListener("click", function () {
    const pw = document.getElementById("adminPass").value;
    if (pw === PASSWORD) {
      alert("로그인 성공!");
      document.getElementById("login").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  });
});

async function loadAllData() {
  console.log("🔍 신청자+직원정보 불러오기 시작");
  const [applicantText, staffText] = await Promise.all([
    fetch(applicantCSV).then(res => res.text()),
    fetch(staffCSV).then(res => res.text())
  ]);

  const applicantRows = applicantText.trim().split("\n").map(row => row.split(","));
  const staffRows = staffText.trim().split("\n").map(row => row.split(","));

  const applicantNames = applicantRows.slice(1)
    .map(r => r.length >= 2 ? normalize(r[1]) : null)
    .filter(name => name);

  staffMap = {};
  staffRows.slice(1).forEach(r => {
    const rawName = r[2].trim();
    const nameKey = normalize(rawName);
    staffMap[nameKey] = {
      name: normalize(rawName),
      service: normalize(r[0]),
      department: normalize(r[1]),
      gender: normalize(r[3])
    };
  });

  applicants = applicantNames.map(name => staffMap[normalize(name)]).filter(x => x !== undefined);
  console.log("✅ 불러온 신청자 수:", applicants.length);
  console.log("📦 현재 신청자:", applicants.map(a => a.name));
console.log("📦 전체 신청자 raw:", JSON.stringify(applicants));
  drawTable(applicants);
}

function drawTable(data) {
  let html = "<table><tr><th>이름</th><th>서비스</th><th>부서</th><th>성별</th></tr>";
  data.forEach(p => {
    html += `<tr><td>${p.name}</td><td>${p.service}</td><td>${p.department}</td><td>${p.gender}</td></tr>`;
  });
  html += "</table>";
  document.getElementById("tableWrap").innerHTML = html;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function assignTeams() {
  const teamSize = parseInt(document.getElementById("teamSize").value);
  if (isNaN(teamSize) || teamSize < 1) {
    alert("올바른 조당 인원 수를 입력해주세요!");
    return;
  }

  const males = applicants.filter(p => p.gender === "M");
  const females = applicants.filter(p => p.gender === "W");
  const all = shuffle([...males, ...females]);

  const teams = [];
  const used = new Set();

  while (all.length > 0) {
    let team = [];
    let usedDept = new Set();
    let usedService = new Set();

    for (let i = 0; i < all.length && team.length < teamSize; i++) {
      const p = all[i];
      const key = normalize(p.name);
      if (
        !used.has(key) &&
        !usedDept.has(p.department) &&
        !usedService.has(p.service)
      ) {
        team.push(p);
        used.add(key);
        usedDept.add(p.department);
        usedService.add(p.service);
      }
    }

    
    if (team.length < teamSize && all.length > 0) {
      console.log("⚠️ 조건 충족 인원 부족 → 조건 무시하고 강제 배정 시작");

      for (let i = 0; i < all.length && team.length < teamSize; i++) {
        const p = all[i];
        const key = normalize(p.name);
        if (!used.has(key)) {
          team.push(p);
          used.add(key);
        }
      }
    }

    if (team.length > 0) {
      console.log("✅ 편성된 팀:", team.map(p => p.name)); console.log("🧩 조당 인원:", team.length); console.log("팀 구성 인원 수:", team.length);
      teams.push(team);
      all.splice(0, team.length);
    } else {
      break;
    }
  }

  let html = "<h2>조 편성 결과</h2>";
  teams.forEach((t, idx) => {
    html += `<div class="team-box"><strong>조 ${idx + 1}</strong><ul>`;
    t.forEach(p => {
      html += `<li>${p.name} (${p.department}, ${p.gender}, ${p.service})</li>`;
    });
    html += "</ul></div>";
  });
  document.getElementById("teams").innerHTML = html;
}