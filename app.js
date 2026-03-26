const firebaseConfig = {
  apiKey: "AIzaSyBoZvFBkdu26DLv-5G1w5y-pTSKJrEWHdY",
  authDomain: "qsplit-91b88.firebaseapp.com",
  projectId: "qsplit-91b88",
  storageBucket: "qsplit-91b88.firebasestorage.app",
  messagingSenderId: "682291461495",
  appId: "1:682291461495:web:1e793a9a096e249fbc3572"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.enablePersistence().catch(err => console.log("離線模式狀態：", err.code));

const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('room');

if (roomId) {
  localStorage.setItem('qsplit_current_room', roomId);
} else {
  const savedRoomId = localStorage.getItem('qsplit_current_room');
  if (savedRoomId) {
    window.location.replace(`?room=${savedRoomId}`);
  } else {
    roomId = Math.random().toString(36).substring(2, 8);
    localStorage.setItem('qsplit_current_room', roomId);
    window.location.replace(`?room=${roomId}`);
  }
}

// 🌟 新增：深淺色模式切換邏輯
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// 讀取記憶的顏色偏好 (預設為深色)
if (localStorage.getItem('theme') === 'light') {
  htmlElement.classList.remove('dark');
} else {
  htmlElement.classList.add('dark'); // 沒設定就預設深色
}

themeToggleBtn.addEventListener('click', () => {
  htmlElement.classList.toggle('dark');
  if (htmlElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});


let expenses = []; 
let editingExpenseId = null;
let groupMembers = ["小明", "小華", "小美"];

db.collection("rooms").doc(roomId).collection("settings").doc("appInfo").onSnapshot((doc) => {
  const titleElement = document.getElementById("group-title");
  if (doc.exists) {
    const data = doc.data();
    if (data.title) titleElement.innerText = data.title;
    if (data.members && data.members.length > 0) groupMembers = data.members;
  } else {
    titleElement.innerText = "點我修改標題"; 
  }
  renderMembersUI(); 
  renderApp();
});

db.collection("rooms").doc(roomId).collection("expenses").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  expenses = []; 
  snapshot.forEach((doc) => {
    expenses.push({ id: doc.id, ...doc.data() });
  });
  renderApp(); 
});

function calculateBalances(expensesList) {
  const balances = {};
  expensesList.forEach(expense => {
    const splitAmount = expense.amount / expense.involved.length;
    balances[expense.payer] = (balances[expense.payer] || 0) + expense.amount;
    expense.involved.forEach(person => {
      balances[person] = (balances[person] || 0) - splitAmount;
    });
  });
  return balances;
}

function simplifyDebts(balances) {
  const creditors = []; 
  const debtors = [];   
  for (const [person, amount] of Object.entries(balances)) {
    const cleanAmount = Math.round(amount); 
    if (cleanAmount > 0) creditors.push({ person, amount: cleanAmount });
    else if (cleanAmount < 0) debtors.push({ person, amount: Math.abs(cleanAmount) }); 
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    transactions.push({ from: debtor.person, to: creditor.person, amount: settlementAmount });
    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;
    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }
  return transactions;
}

function renderMembersUI() {
  const payerSelect = document.getElementById("input-payer");
  const checkboxGroup = document.getElementById("checkbox-group");
  if (!payerSelect || !checkboxGroup) return;

  payerSelect.innerHTML = "";
  checkboxGroup.innerHTML = "";

  groupMembers.forEach(member => {
    payerSelect.innerHTML += `<option value="${member}">${member}</option>`;
    // 🌟 更新：打勾按鈕的深淺色支援
    checkboxGroup.innerHTML += `
      <label class="inline-flex items-center cursor-pointer bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <input type="checkbox" value="${member}" class="split-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-500 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:ring-2 bg-white dark:bg-gray-700" checked>
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-200">${member}</span>
      </label>
    `;
  });
}

function renderApp() {
  const expenseListDiv = document.getElementById("expense-list");
  expenseListDiv.innerHTML = ""; 

  expenses.forEach(exp => {
    let splitLabel = exp.involved.length === groupMembers.length ? "全員均分" : `${exp.involved.length}人均分`; 
    // 🌟 更新：帳單卡片的深淺色支援
    expenseListDiv.innerHTML += `
      <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center group shadow-sm dark:shadow-none transition-colors duration-300">
        <div class="flex-1">
          <h3 class="font-bold text-gray-900 dark:text-gray-100">${exp.title}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">${exp.payer} 先付了 $${exp.amount}</p>
        </div>
        <div class="text-right flex flex-col items-end">
          <span class="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">${splitLabel}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">${exp.involved.join('、')}</span>
        </div>
        <div class="ml-4 flex items-center space-x-1">
          <button onclick="editExpense('${exp.id}')" class="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
          </button>
          <button onclick="deleteExpense('${exp.id}')" class="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
          </button>
        </div>
      </div>
    `;
  });

  const balances = calculateBalances(expenses);
  const transactions = simplifyDebts(balances);
  const settlementListDiv = document.getElementById("settlement-list");
  settlementListDiv.innerHTML = ""; 

  if (transactions.length === 0) {
    settlementListDiv.innerHTML = `<p class="text-gray-500 text-center py-4 text-sm bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">目前沒有需要結算的帳目 🎉</p>`;
    return;
  }

  transactions.forEach(t => {
    // 🌟 更新：結算結果卡片的深淺色支援
    settlementListDiv.innerHTML += `
      <div class="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors">
        <div class="flex items-center space-x-3">
          <span class="font-bold text-gray-800 dark:text-gray-100">${t.from}</span>
          <span class="text-indigo-500 dark:text-indigo-400 font-bold">➔</span>
          <span class="font-bold text-gray-800 dark:text-gray-100">${t.to}</span>
        </div>
        <div class="font-bold text-indigo-600 dark:text-indigo-300 text-lg">$ ${t.amount}</div>
      </div>
    `;
  });
}

function createNewRoom() {
  if (confirm("確定要開啟一個全新的帳本嗎？\n\n別擔心，舊的帳本資料都會保留在雲端，只要你有原本的專屬網址，隨時都能回來查看喔！")) {
    localStorage.removeItem('qsplit_current_room');
    window.location.href = window.location.pathname; 
  }
}

function editGroupTitle() {
  const titleElement = document.getElementById("group-title");
  const currentTitle = titleElement.innerText;
  const newTitle = prompt("請輸入新的活動名稱：", currentTitle === "點我修改標題" ? "" : currentTitle);
  if (newTitle !== null && newTitle.trim() !== "") {
    db.collection("rooms").doc(roomId).collection("settings").doc("appInfo").set({
      title: newTitle.trim()
    }, { merge: true });
  }
}

function editMembers() {
  const currentStr = groupMembers.join("，");
  const input = prompt("請輸入所有參與者的名字\n(請用「逗號」隔開，例如：阿翔,小美,大軍)：", currentStr);
  if (input !== null && input.trim() !== "") {
    const newMembers = input.split(/[,，、]/).map(m => m.trim()).filter(m => m !== "");
    if (newMembers.length > 0) {
      db.collection("rooms").doc(roomId).collection("settings").doc("appInfo").set({
        members: newMembers
      }, { merge: true });
    } else {
      alert("名單不能為空喔！");
    }
  }
}

function deleteExpense(expenseId) {
  if (confirm("確定要刪除這筆帳單嗎？")) {
    db.collection("rooms").doc(roomId).collection("expenses").doc(expenseId).delete();
  }
}

function editExpense(expenseId) {
  const expense = expenses.find(exp => exp.id === expenseId);
  if (!expense) return;
  editingExpenseId = expenseId;
  document.getElementById("modal-title").innerText = "編輯帳單";
  document.getElementById("input-title").value = expense.title;
  document.getElementById("input-amount").value = expense.amount;
  document.getElementById("input-payer").value = expense.payer;
  const checkboxes = document.querySelectorAll(".split-checkbox");
  checkboxes.forEach(cb => {
    cb.checked = expense.involved.includes(cb.value);
  });
  addModal.classList.remove("hidden");
}

const addBtn = document.getElementById("add-btn");
const addModal = document.getElementById("add-modal");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");

addBtn.addEventListener("click", () => {
  if (groupMembers.length === 0) {
    alert("請先點擊右上角設定群組成員喔！");
    return;
  }
  addModal.classList.remove("hidden");
});

function closeModal() {
  addModal.classList.add("hidden");
  document.getElementById("input-title").value = "";
  document.getElementById("input-amount").value = "";
  const checkboxes = document.querySelectorAll(".split-checkbox");
  checkboxes.forEach(cb => cb.checked = true);
  editingExpenseId = null; 
  document.getElementById("modal-title").innerText = "新增一筆帳單";
}

cancelBtn.addEventListener("click", closeModal);
addModal.addEventListener("click", (e) => { if (e.target === addModal) closeModal(); });

saveBtn.addEventListener("click", () => {
  const title = document.getElementById("input-title").value.trim();
  const amount = parseFloat(document.getElementById("input-amount").value);
  const payer = document.getElementById("input-payer").value;
  const checkedBoxes = document.querySelectorAll(".split-checkbox:checked");
  const involvedMembers = Array.from(checkedBoxes).map(cb => cb.value);

  if (!title || isNaN(amount) || amount <= 0) {
    alert("請輸入有效的項目名稱和金額哦！");
    return;
  }
  if (involvedMembers.length === 0) {
    alert("請至少選擇一位要分攤的成員！");
    return;
  }

  const expenseData = {
    title: title,
    amount: amount,
    payer: payer,
    involved: involvedMembers,
    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
  };

  if (editingExpenseId) {
    db.collection("rooms").doc(roomId).collection("expenses").doc(editingExpenseId).update(expenseData);
  } else {
    db.collection("rooms").doc(roomId).collection("expenses").add(expenseData);
  }
  closeModal(); 
});

const shareBtn = document.getElementById("share-btn");
const qrModal = document.getElementById("qr-modal");
const closeQrBtn = document.getElementById("close-qr-btn");

shareBtn.addEventListener("click", () => {
  const currentUrl = window.location.href;
  new QRious({
    element: document.getElementById('qr-canvas'),
    value: currentUrl,
    size: 240, 
    background: 'white',
    foreground: '#030712' 
  });
  qrModal.classList.remove("hidden");
});

closeQrBtn.addEventListener("click", () => qrModal.classList.add("hidden"));
qrModal.addEventListener("click", (e) => { 
  if (e.target === qrModal) qrModal.classList.add("hidden"); 
});