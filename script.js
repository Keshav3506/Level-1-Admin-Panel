/********************************
 * 🔥 FIREBASE CONFIGS (8 ROOMS)
 ********************************/
const firebaseConfigs = {
  room01: {
    apiKey: "AIzaSyCAT82nvLYDfFlfoaMTw7Q_bwdhPem3j9A",
    authDomain: "quiz-room-01.firebaseapp.com",
    databaseURL: "https://quiz-room-01-default-rtdb.firebaseio.com",
    projectId: "quiz-room-01",
    storageBucket: "quiz-room-01.firebasestorage.app",
    messagingSenderId: "525506985332",
    appId: "1:525506985332:web:ed9292e1cab847fca88021"
  },
  room02: {
    apiKey: "AIzaSyBfRECuMjz1bxfAU_rrrylf8NC5d5Gds0E",
    authDomain: "quiz-room-2-8602b.firebaseapp.com",
    databaseURL: "https://quiz-room-2-8602b-default-rtdb.firebaseio.com",
    projectId: "quiz-room-2-8602b",
    storageBucket: "quiz-room-2-8602b.firebasestorage.app",
    messagingSenderId: "785421321382",
    appId: "1:785421321382:web:bebc433868e27de210e067"
  },
  room03: {
    apiKey: "AIzaSyAeZ3H3jfje9O5p8nJzPfMAPxJ-KlHLspY",
    authDomain: "quiz-room-3.firebaseapp.com",
    databaseURL: "https://quiz-room-3-default-rtdb.firebaseio.com",
    projectId: "quiz-room-3",
    storageBucket: "quiz-room-3.firebasestorage.app",
    messagingSenderId: "421976234352",
    appId: "1:421976234352:web:6021a087da0c7e02ced7b5"
  },
  room04: {
    apiKey: "AIzaSyDoSdrxANv9D6ne4FcQC_gGgtVIfz2tQjk",
    authDomain: "quiz-room-4.firebaseapp.com",
    databaseURL: "https://quiz-room-4-default-rtdb.firebaseio.com",
    projectId: "quiz-room-4",
    storageBucket: "quiz-room-4.firebasestorage.app",
    messagingSenderId: "1098381810564",
    appId: "1:1098381810564:web:1331baae96d710fa081bd1"
  },
  room05: {
    apiKey: "AIzaSyBtjeH6cqx4tuoaXqHc_PGa2-wpt4V5g28",
    authDomain: "quiz-room-05.firebaseapp.com",
    databaseURL: "https://quiz-room-05-default-rtdb.firebaseio.com",
    projectId: "quiz-room-05",
    storageBucket: "quiz-room-05.firebasestorage.app",
    messagingSenderId: "894494206201",
    appId: "1:894494206201:web:351e121fdac5ffc0dada28"
  },
  room06: {
    apiKey: "AIzaSyA9zDsNOAhzhxHMqk99BBwj8vYC5nQBuio",
    authDomain: "quiz-room-06.firebaseapp.com",
    databaseURL: "https://quiz-room-06-default-rtdb.firebaseio.com",
    projectId: "quiz-room-06",
    storageBucket: "quiz-room-06.firebasestorage.app",
    messagingSenderId: "217678549857",
    appId: "1:217678549857:web:946d2a13c23a494542ab20"
  },
  room07: {
    apiKey: "AIzaSyDsz4MqmguRW-_dtZDxniLgGawBe9QBt0o",
    authDomain: "quiz-room-7.firebaseapp.com",
    databaseURL: "https://quiz-room-7-default-rtdb.firebaseio.com",
    projectId: "quiz-room-7",
    storageBucket: "quiz-room-7.firebasestorage.app",
    messagingSenderId: "46213262853",
    appId: "1:46213262853:web:f96b5a7f19b03c19e2366c"
  }
};
/********************************
 * INIT ALL DATABASES
 ********************************/
const databases = {};
Object.keys(firebaseConfigs).forEach(key=>{
  const app = firebase.initializeApp(firebaseConfigs[key], key);
  databases[key] = firebase.database(app);
});
const DBS = Object.values(databases);

/********************************
 * ORIGINAL VARIABLES (UNCHANGED)
 ********************************/
let adminTimer = null;
let timeLeft = 10;
let currentQuestionIndex = 0;
let quizStarted = false;
let waitingRoomOpen = true;

const mentorCache = {};

const timerEl = document.getElementById("timer");
const questionEl = document.getElementById("questionNumber");
const teamsBody = document.getElementById("teams-body");
const mentorNameEl = document.getElementById("mentorName");

let mentorName = "—";
let roomNumber = "—";
let sortOrder = "asc";

/********************************
 * HELPERS
 ********************************/
function allDB(fn){ DBS.forEach(fn); }

/********************************
 * LOAD MENTOR NAME
 ********************************/
Object.entries(databases).forEach(([room, db]) => {
  db.ref("mentor").on("value", snap => {
    mentorCache[room] = {
      name: snap.val()?.name ?? "—",
      roomNumber: snap.val()?.roomNumber ?? "—"
    };
  });
});

/********************************
 * SYNC LEVEL TO ADMIN PANEL
 ********************************/
databases.room01.ref("admin/level").on("value", snap => {
  if (snap.exists()) {
    document.getElementById("levelDisplay").innerText = snap.val();
  }
});


/********************************
 * RENDER TABLE (EXACT SAME)
 ********************************/
function renderTeams(teamsArray){
  teamsBody.innerHTML = "";
  if(teamsArray.length===0){
    teamsBody.innerHTML=`<tr><td colspan="8">No teams found</td></tr>`;
    return;
  }
  let i=1;
  teamsArray.forEach(teamData=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${i++}</td>
      <td>${teamData.roomNumber}</td>
      <td>${teamData.mentorName}</td>
      <td>${teamData.teamId}</td>
      <td>${teamData.team.name}</td>
      <td>${teamData.team.status}</td>
      <td>${teamData.team.score}</td>
      <td><button onclick="qualifyTeam('${teamData.room}','${teamData.teamId}')">Qualify</button></td>
    `;
    teamsBody.appendChild(tr);
  });
}

/********************************
 * LISTEN TEAMS (ALL ROOMS)
 ********************************/
const teamsCache = {};

Object.entries(databases).forEach(([room,db])=>{
  db.ref("teams").on("value",snap=>{
    teamsCache[room]=[];
    snap.forEach(child=>{
      teamsCache[room].push({
        room,
        teamId: child.key,
        team: child.val(),
        mentorName: mentorCache[room]?.name ?? "—",
        roomNumber: mentorCache[room]?.roomNumber ?? "—"
      });
    });

    const merged = Object.values(teamsCache).flat();
    merged.sort((a,b)=>{
      const A=parseInt(a.team.score)||0;
      const B=parseInt(b.team.score)||0;
      return sortOrder==="asc"?A-B:B-A;
    });

    renderTeams(merged);
  });
});

/********************************
 * ROOM HEADER FOR SORTING
 ********************************/
document.getElementById("room-header").addEventListener("click", () => {
  sortOrder = sortOrder === "asc" ? "desc" : "asc";

  document.getElementById("room-header").innerText =
    sortOrder === "asc" ? "Room Number ▲" : "Room Number ▼";

  const merged = Object.values(teamsCache).flat();

  merged.sort((a, b) => {
    const A = parseInt(a.roomNumber) || 0;
    const B = parseInt(b.roomNumber) || 0;
    return sortOrder === "asc" ? A - B : B - A;
  });

  renderTeams(merged);
});

/********************************
 * TEAM ID HEADER FOR SORTING
 ********************************/
document.getElementById("teamid-header").addEventListener("click", () => {
  sortOrder = sortOrder === "asc" ? "desc" : "asc";

  document.getElementById("teamid-header").innerText =
    sortOrder === "asc" ? "Team ID ▲" : "Team ID ▼";

  const merged = Object.values(teamsCache).flat();

  merged.sort((a, b) => {
    const A = a.teamId.toString().toLowerCase();
    const B = b.teamId.toString().toLowerCase();
    return sortOrder === "asc"
      ? A.localeCompare(B)
      : B.localeCompare(A);
  });

  renderTeams(merged);
});

/********************************
 * SCORE HEADER FOR SORTING
 ********************************/
document.getElementById("score-header").addEventListener("click", () => {
  sortOrder = sortOrder === "asc" ? "desc" : "asc";

  document.getElementById("score-header").innerText =
    sortOrder === "asc" ? "Score ▲" : "Score ▼";

  // 🔥 Re-sort merged teams from ALL rooms
  const merged = Object.values(teamsCache).flat();

  merged.sort((a, b) => {
    const scoreA = parseInt(a.team.score) || 0;
    const scoreB = parseInt(b.team.score) || 0;
    return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
  });

  renderTeams(merged);
});

/********************************
 * QUALIFY TEAM (ROOM-WISE)
 ********************************/
function qualifyTeam(room,teamId){
  databases[room].ref(`teams/${teamId}`).update({
    status:"Qualified",
    qualified:true
  });
}

/********************************
 * QUIZ LOGIC (UNCHANGED)
 ********************************/
function startQuiz(){
  if(quizStarted) return;
  quizStarted=true;
  waitingRoomOpen=false;
  currentQuestionIndex=0;
  startQuestion();
  nextQuestion();
}

function nextQuestion(){
  if(!quizStarted) return;
  currentQuestionIndex++;
  if(currentQuestionIndex>15){
    clearInterval(adminTimer);
    questionEl.innerText="--";
    timerEl.innerText="--";
    return;
  }
  startQuestion();
}

function pauseQuiz(){
  clearInterval(adminTimer);
  quizStarted=false;
  timerEl.innerText=`⏸ ${timeLeft}s`;
}

function resumeTimer(){
  quizStarted=true;
  clearInterval(adminTimer);

  adminTimer=setInterval(()=>{
    if(!quizStarted){
      clearInterval(adminTimer);
      return;
    }
    timeLeft--;
    timerEl.innerText=timeLeft;
    allDB(db=>db.ref("admin/timeLeft").set(timeLeft));

    if(timeLeft<=0){
      clearInterval(adminTimer);
      startQuestion();
      nextQuestion();
    }
  },1000);
}

function resetValues(){
  quizStarted=false;
  clearInterval(adminTimer);

  allDB(db=>{
    db.ref("admin").update({
      quizStarted:false,
      waitingRoomOpen:true,
      currentQuestionIndex:1,
      timeLeft:15,
    });

    db.ref("teams").once("value",snap=>{
      snap.forEach(child=>{
        db.ref(`teams/${child.key}`).update({
          score:0,
          lastAnsweredQuestion:0
        });
      });
    });
  });
      
  timerEl.innerText="--15--";
  questionEl.innerText="--1--";
}

function resetGame(){
  quizStarted=false;
  clearInterval(adminTimer);

  allDB(db=>{
    db.ref("admin").update({
      quizStarted:false,
      waitingRoomOpen:true,
      currentQuestionIndex:1,
      timeLeft:15,
      level:1
    });

    db.ref("teams").once("value",snap=>{
      snap.forEach(child=>{
        db.ref(`teams/${child.key}`).update({
          score:0,
          qualified:false,
          status:"Waiting",
          lastAnsweredQuestion:0
        });
      });
    });
  });

  timerEl.innerText="--15--";
  questionEl.innerText="--1--";
}

function nextRound() {
  // 1️⃣ Read current level from MASTER
  databases.room01.ref("admin/level").once("value").then(snap => {
    let level = snap.val() || 0;
    level = Math.min(level + 1, 3);

    // 2️⃣ Write SAME level to ALL rooms
    allDB(db => {
      db.ref("admin/level").set(level);
    });
  });
}

function startQuestion(){
  if(!quizStarted) return;
  clearInterval(adminTimer);
  timeLeft=15;

  allDB(db=>db.ref("admin").update({
    quizStarted:true,
    currentQuestionIndex,
    questionStartTime:Date.now(),
    timeLeft:15,
    waitingRoomOpen:false
  }));

  questionEl.innerText=currentQuestionIndex;
  timerEl.innerText=timeLeft;

  adminTimer=setInterval(()=>{
    if(!quizStarted){
      clearInterval(adminTimer);
      return;
    }
    timeLeft--;
    timerEl.innerText=timeLeft;
    allDB(db=>db.ref("admin/timeLeft").set(timeLeft));

    if(timeLeft<=0){
      clearInterval(adminTimer);
      setTimeout(()=>quizStarted && nextQuestion(),3000);
    }
  },1000);
}
