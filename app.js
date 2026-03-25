// ==========================================
// 1. Firebase 初始化與連線設定
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBoZvFBkdu26DLv-5G1w5y-pTSKJrEWHdY",
  authDomain: "qsplit-91b88.firebaseapp.com",
  projectId: "qsplit-91b88",
  storageBucket: "qsplit-91b88.firebasestorage.app",
  messagingSenderId: "682291461495",
  appId: "1:682291461495:web:1e793a9a096e249fbc3572"
};

// 啟動 Firebase 與 Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 全域變數：用來存放雲端抓下來的帳單，以及記錄目前是否在編輯狀態
let expenses = []; 
let editingExpenseId = null;


// ==========================================
// 2. 🌟 核心魔法：即時監聽雲端資料庫
// ==========================================
// 只要資料庫一有變動 (新增、刪除、修改)，這裡就會自動觸發，拉取最新資料並重繪畫面！
db.collection("expenses").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  expenses = []; // 先清空舊陣列
  snapshot.forEach((doc) => {
    // 把每一筆雲端資料塞回陣列，並把文件 ID 記下來
    expenses.push({ id: doc.id, ...doc.data() });
  });
  
  // 資料更新完畢，呼叫大腦去重算並渲染畫面！
  renderApp(); 
});


// ==========================================
// 3. 大腦演算法 (淨收支計算 & 債務簡化)
// ==========================================
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


// ==========================================
// 4. 畫面渲染 (把陣列變成 HTML 卡片)
// ==========================================
function renderApp() {
  const expenseListDiv = document.getElementById("expense-list");
  expenseListDiv.innerHTML = ""; 

  // 渲染帳單明細
  expenses.forEach(exp => {
    let splitLabel = exp.involved.length === 3 ? "全員均分" : `${exp.involved.length}人均分`; 
    
    expenseListDiv.innerHTML += `
      <div class="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
        <div class="flex-1">
          <h3 class="font-bold text-gray-100">${exp.title}</h3>
          <p class="text-sm text-gray-400">${exp.payer} 先付了 $${exp.amount}</p>
        </div>
        <div class="text-right flex flex-col items-end">
          <span class="text-sm bg-gray-800 text-gray-300 px-2 py-1 rounded-full border border-gray-700">${splitLabel}</span>
          <span class="text-xs text-gray-500 mt-1">${exp.involved.join('、')}</span>
        </div>
        <div class="ml-4 flex items-center space-x-2">
          <button onclick="editExpense('${exp.id}')" class="p-2 text-gray-500 hover:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
          </button>
          <button onclick="deleteExpense('${exp.id}')" class="p-2 text-gray-500 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
          </button>
        </div>
      </div>
    `;
  });

  // 渲染結算建議
  const balances = calculateBalances(expenses);
  const transactions = simplifyDebts(balances);
  const settlementListDiv = document.getElementById("settlement-list");
  settlementListDiv.innerHTML = ""; 

  if (transactions.length === 0) {
    settlementListDiv.innerHTML = `<p class="text-gray-400 text-center py-2">目前沒有需要結算的帳目 🎉</p>`;
    return;
  }

  transactions.forEach(t => {
    settlementListDiv.innerHTML += `
      <div class="flex items-center justify-between p-3 bg-indigo-950 rounded-lg border border-indigo-900">
        <div class="flex items-center space-x-2">
          <span class="font-semibold text-gray-100">${t.from}</span>
          <span class="text-indigo-300 font-bold">➔</span>
          <span class="font-semibold text-gray-100">${t.to}</span>
        </div>
        <div class="font-bold text-indigo-300">$ ${t.amount}</div>
      </div>
    `;
  });
}


// ==========================================
// 5. 使用者互動與 Firebase 雲端操作 (CRUD)
// ==========================================

// --- 更改群組標題 ---
function editGroupTitle() {
  const titleElement = document.getElementById("group-title");
  const currentTitle = titleElement.innerText;
  const newTitle = prompt("請輸入新的群組名稱：", currentTitle);
  if (newTitle !== null && newTitle.trim() !== "") {
    titleElement.innerText = newTitle.trim();
  }
}

// --- 刪除帳單 (通知 Firebase 刪除) ---
function deleteExpense(expenseId) {
  if (confirm("確定要刪除這筆帳單嗎？")) {
    db.collection("expenses").doc(expenseId).delete();
  }
}

// --- 進入編輯模式 ---
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

// --- 控制 Modal 視窗開關 ---
const addBtn = document.getElementById("add-btn");
const addModal = document.getElementById("add-modal");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");

addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));

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


// --- 儲存或更新帳單 (寫入 Firebase) ---
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

  // 準備要寫入雲端的資料包
  const expenseData = {
    title: title,
    amount: amount,
    payer: payer,
    involved: involvedMembers,
    createdAt: firebase.firestore.FieldValue.serverTimestamp() // 記錄雲端伺服器的時間
  };

  if (editingExpenseId) {
    // 情況 A：更新舊帳單
    db.collection("expenses").doc(editingExpenseId).update(expenseData);
  } else {
    // 情況 B：新增一筆帳單
    db.collection("expenses").add(expenseData);
  }

  closeModal(); 
  // 💡 存檔後不需要手動呼叫 renderApp()，因為上方的 onSnapshot 監聽器會自動發現資料庫變了，自動幫我們重繪！
});