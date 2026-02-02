const firebaseConfig = {
    apiKey: "AIzaSyAcE9NC_zuXRqdyW8m4AiABPMO3E_pZeIg" ,
    authDomain: "istiklalmarsiyarismasiv2.firebaseapp.com" ,
    databaseURL: "https://istiklalmarsiyarismasiv2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "istiklalmarsiyarismasiv2",
    storageBucket: "istiklalmarsiyarismasiv2.firebasestorage.app",
    messagingSenderId: "575665271689",
    appId: "1:575665271689:web:1c5762dd4345da397d6758"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const questions = [
    { q: "İstiklal Marşı hangi tarihte kabul edilmiştir?" },
    { q: "Mehmet Âkif Ersoy, İstiklal Marşı'nı nerede yazmıştır?" },
    { q: "İstiklal Marşı hangi ordumuza ithaf edilmiştir?" },
    { q: "İstiklal Marşı'nın bestecisi kimdir?" },
    { q: "Mehmet Âkif Ersoy ödül olarak verilen parayı nereye bağışlamıştır?" },
    { q: "İstiklal Marşı toplam kaç kıtadan oluşmaktadır?" },
    { q: "Mehmet Âkif Ersoy'un şiirlerini topladığı eserin adı nedir?" },
    { q: "İstiklal Marşı yarışmasına toplam kaç şiir katılmıştır?" },
    { q: "İstiklal Marşı'nın ilk iki kıtası hangi ölçü ile yazılmıştır?" },
    { q: "İstiklal Marşı mecliste ilk kez kim tarafından okunmuştur?" },
    { q: "Mehmet Âkif Ersoy aslen nerelidir (Babası)?" },
    { q: "Mehmet Âkif Ersoy'un asıl mesleği nedir?" },
    { q: "İstiklal Marşı'nın kabul edildiği dönemde Maarif Vekili kimdir?" },
    { q: "Mehmet Âkif Ersoy hangi ilin milletvekilliğini yapmıştır?" },
    { q: "Korkma, sönmez bu şafaklarda yüzen al sancak; / Sönmeden yurdumun üstünde tüten en son ...?" },
    { q: "Mehmet Âkif Ersoy ne zaman vefat etmiştir?" },
    { q: "Mehmet Âkif, Safahat'ın hangi bölümünde Çanakkale şehitlerine yer vermiştir?" },
    { q: "İstiklal Marşı ilk olarak hangi gazetede yayınlanmıştır?" },
    { q: "Aşağıdakilerden hangisi Safahat'ın bölümlerinden biri değildir?" },
    { q: "Mehmet Âkif Ersoy, İstiklal Marşı'nı neden Safahat'a almamıştır?" }
];

let my = { name: "", role: "", room: "", score: 0 };
let timerInt;
let currentQ = -1;
let currentStep = "";

function joinQuiz() {
    my.name = document.getElementById('userName').value;
    my.room = document.getElementById('roomCode').value;
    my.role = document.getElementById('userRole').value;

    if(!my.name || !my.room) return alert("Bilgileri girin!");

    document.getElementById('login-view').style.display = 'none';
    document.getElementById('waiting-view').style.display = 'block';
    document.getElementById('room-display').innerText = "Oda: " + my.room;

    if(my.role === 'host') {
        document.getElementById('host-start-area').style.display = 'block';
        db.ref('rooms/' + my.room).update({ step: 'lobby', currentQ: -1 });
    } else if(my.role === 'competitor') {
        db.ref('rooms/' + my.room + '/users/' + my.name).set({ score: 0 });
    }
    listen();
}

function listen() {
    db.ref('rooms/' + my.room + '/users').on('value', snap => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        snap.forEach(u => { list.innerHTML += `<li>${u.key}</li>`; });
    });

    db.ref('rooms/' + my.room).on('value', snap => {
        const data = snap.val();
        if(!data || data.currentQ < 0) return;
        
        if(currentQ !== data.currentQ || currentStep !== data.step) {
            currentQ = data.currentQ;
            currentStep = data.step;
            syncUI(currentStep, currentQ);
        }
    });
}

function syncUI(step, qIdx) {
    document.getElementById('waiting-view').style.display = 'none';
    document.getElementById('quiz-view').style.display = 'block';
    document.getElementById('q-text').innerText = (qIdx + 1) + ". " + questions[qIdx].q;
    
    // Alanları temizle
    document.getElementById('competitor-area').style.display = 'none';
    document.getElementById('judge-area').style.display = 'none';
    document.getElementById('score-area').style.display = 'none';
    document.getElementById('host-area').style.display = (my.role === 'host') ? 'block' : 'none';

    if(step === 'question') {
        startTimer();
        if(my.role === 'competitor') {
            document.getElementById('competitor-area').style.display = 'block';
            document.getElementById('answerInput').value = "";
            document.getElementById('answerInput').disabled = false;
            document.getElementById('sendBtn').style.display = 'block';
            document.getElementById('wait-judge-msg').style.display = 'none';
        }
        if(my.role === 'host') document.getElementById('host-action-btn').innerText = "Cevapları İncele";
    } else if(step === 'judge') {
        clearInterval(timerInt);
        if(my.role === 'judge') {
            document.getElementById('judge-area').style.display = 'block';
            loadJudgeList();
        }
        if(my.role === 'host') document.getElementById('host-action-btn').innerText = "Puan Durumunu Göster";
    } else if(step === 'score') {
        document.getElementById('score-area').style.display = 'block';
        loadScoreList();
        if(my.role === 'host') document.getElementById('host-action-btn').innerText = "Sonraki Soru";
    }
}

function startTimer() {
    let time = 30.0;
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        time = (time - 0.1).toFixed(1);
        document.getElementById('timer').innerText = time;
        if(time <= 0) {
            clearInterval(timerInt);
            if(my.role === 'competitor') document.getElementById('answerInput').disabled = true;
        }
    }, 100);
}

function sendAnswer() {
    const ans = document.getElementById('answerInput').value;
    if(!ans) return alert("Cevap boş olamaz!");
    db.ref('rooms/' + my.room + '/answers/' + my.name).set({ text: ans, status: 'pending' });
    document.getElementById('answerInput').disabled = true;
    document.getElementById('sendBtn').style.display = 'none';
    document.getElementById('wait-judge-msg').style.display = 'block';
}

function loadJudgeList() {
    db.ref('rooms/' + my.room + '/answers').on('value', snap => {
        const list = document.getElementById('judge-list');
        list.innerHTML = "";
        snap.forEach(ans => {
            const data = ans.val();
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="judge-row">
                    <strong>${ans.key}:</strong> <span>${data.text}</span>
                    <div class="judge-btns" id="btns-${ans.key}">
                        ${data.status === 'pending' ? 
                        `<button class="btn-correct" onclick="judgeResult('${ans.key}', true)">Doğru</button>
                         <button class="btn-wrong" onclick="judgeResult('${ans.key}', false)">Yanlış</button>` : 
                        `<span>${data.status === 'correct' ? '✅ Onaylandı' : '❌ Reddedildi'}</span>`}
                    </div>
                </div>`;
            list.appendChild(li);
        });
    });
}

function judgeResult(pName, isCorrect) {
    db.ref('rooms/' + my.room + '/answers/' + pName).update({ status: isCorrect ? 'correct' : 'wrong' });
    if(isCorrect) {
        db.ref('rooms/' + my.room + '/users/' + pName + '/score').transaction(s => (s || 0) + 5);
    }
}

function loadScoreList() {
    db.ref('rooms/' + my.room).once('value', snap => {
        const data = snap.val();
        const users = data.users || {};
        const answers = data.answers || {};
        
        const u = [];
        Object.keys(users).forEach(name => {
            const ansData = answers[name] || { text: "-", status: "pending" };
            u.push({
                name: name,
                score: users[name].score,
                answerText: ansData.text,
                status: ansData.status
            });
        });

        u.sort((a, b) => a.name.localeCompare(b.name));

        const scoreListDiv = document.getElementById('score-list');
        scoreListDiv.innerHTML = u.map(x => {
            let statusBadge = '<span style="color: #f1c40f;">⏳ Bekliyor</span>'; 
            if (x.status === "correct") {
                statusBadge = '<span style="color: #27ae60;">✅ Doğru</span>';
            } else if (x.status === "wrong") {
                statusBadge = '<span style="color: #e74c3c;">❌ Yanlış</span>';
            }

            return `
            <li style="display: flex; flex-direction: column; gap: 8px; padding: 15px; background: rgba(255,255,255,0.05); margin-bottom: 10px; border-radius: 12px; border-left: 5px solid ${x.status === 'correct' ? '#27ae60' : (x.status === 'wrong' ? '#e74c3c' : '#f1c40f')};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 1.1rem;">${x.name}</strong>
                    <span style="background: #f1c40f; color: #000; padding: 2px 10px; border-radius: 20px; font-weight: bold;">${x.score} Puan</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                    <span style="color: #ddd;">Cevap: <i>"${x.answerText}"</i></span>
                    ${statusBadge}
                </div>
            </li>`;
        }).join("");
    });
}
function handleHostAction() {
    if(currentStep === 'question') {
        db.ref('rooms/' + my.room).update({ step: 'judge' });
    } else if(currentStep === 'judge') {
        db.ref('rooms/' + my.room).update({ step: 'score' });
    } else if(currentStep === 'score') {
        // Soru cevaplarını temizle ve sonraki soruya geç
        db.ref('rooms/' + my.room + '/answers').remove();
        db.ref('rooms/' + my.room).update({ currentQ: currentQ + 1, step: 'question' });
    }
}


function startQuiz() { db.ref('rooms/' + my.room).update({ currentQ: 0, step: 'question' }); }

