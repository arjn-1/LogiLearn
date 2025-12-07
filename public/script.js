document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
  const chatBody = document.getElementById("chatBody");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const faqTopic = document.getElementById("faqTopic");
  const faqContainer = document.getElementById("faqContainer");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const saveChatBtn = document.getElementById("saveChatBtn");
  const micBtn = document.getElementById("micBtn");
  const themeToggle = document.getElementById("themeToggle");
  const statusText = document.getElementById("statusText");
  const toggleModeBtn = document.getElementById("toggleModeBtn");
  const chatSidebar = document.getElementById("chatSidebar");
  const builderSidebar = document.getElementById("builderSidebar");

  // Case builder inputs
  const cbScenario = document.getElementById("cbScenario");
  const cbCustomScenario = document.getElementById("cbCustomScenario");
  const customScenarioWrap = document.getElementById("customScenarioWrap");
  const cbType = document.getElementById("cbType");
  const cbCompany = document.getElementById("cbCompany");
  const cbIndustry = document.getElementById("cbIndustry");
  const cbKpis = document.getElementById("cbKpis");
  const cbContext = document.getElementById("cbContext");
  const cbIncludeNumericals = document.getElementById("cbIncludeNumericals");
  const cbNumericalCount = document.getElementById("cbNumericalCount");
  const cbNumericalDifficulty = document.getElementById("cbNumericalDifficulty");
  const cbGenerate = document.getElementById("cbGenerate");
  const cbClear = document.getElementById("cbClear");
  const numericalSettings = document.getElementById("numericalSettings");

  // FAQ topics
  const FAQ_TOPICS = {
    "Inventory Management": [
      "What is ABC analysis and how is it used?",
      "How to calculate reorder point?",
      "How to determine safety stock levels?"
    ],
    "Transportation": [
      "What are common shipment consolidation strategies?",
      "How to choose freight mode?",
      "What is route optimization in logistics?"
    ],
    "Warehouse Layout": [
      "Best practices for racking systems",
      "How to design a pick path?",
      "How to reduce picker travel time?"
    ],
    "Order Fulfillment": [
      "What is FIFO vs LIFO in fulfillment?",
      "How to improve order accuracy and fill rate?"
    ]
  };

  // init topic select
  function initTopics() {
    faqTopic.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a topic…";
    faqTopic.appendChild(placeholder);
    Object.keys(FAQ_TOPICS).forEach(topic => {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      faqTopic.appendChild(opt);
    });
  }

  function renderFaqs(topic) {
    faqContainer.innerHTML = "";
    if (!topic || !FAQ_TOPICS[topic]) return;
    FAQ_TOPICS[topic].forEach(q => {
      const btn = document.createElement("button");
      btn.className = "faq-btn";
      btn.textContent = q;
      btn.addEventListener("click", () => {
        addMessage(q, "user");
        sendToServer(q);
      });
      faqContainer.appendChild(btn);
    });
  }

  faqTopic.addEventListener("change", (e) => renderFaqs(e.target.value));

  // add message (markdown rendering)
  function addMessage(text, sender = "bot") {
    const div = document.createElement("div");
    div.classList.add("msg", sender);
    try {
      // Use marked to convert markdown -> HTML
      div.innerHTML = marked.parse(text || "");
    } catch {
      div.textContent = text;
    }
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // send user message
  sendBtn.addEventListener("click", () => {
    const text = userInput.value.trim();
    if (!text) return;
    addMessage(text, "user");
    userInput.value = "";
    sendToServer(text);
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // clear, refresh, save
  clearBtn.addEventListener("click", () => {
    chatBody.innerHTML = `<div class="msg bot">Chat cleared. Ask something again!</div>`;
  });
  refreshBtn.addEventListener("click", () => location.reload());

  saveChatBtn.addEventListener("click", () => {
    const msgs = Array.from(chatBody.querySelectorAll(".msg"));
    if (!msgs.length) return;
    const lines = msgs.map(m => (m.classList.contains("user") ? "User: " : "Bot: ") + m.innerText.trim());
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "logistics_chat_history.txt";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // microphone
  let recognition = null;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.addEventListener("result", (ev) => {
      const transcript = ev.results[0][0].transcript;
      userInput.value = transcript;
      sendBtn.click();
    });
    recognition.addEventListener("end", () => { micBtn.classList.remove("listening"); statusText.textContent = "Ready"; });
    recognition.addEventListener("error", () => { micBtn.classList.remove("listening"); statusText.textContent = "Voice input error"; });
  } else {
    micBtn.disabled = true;
    micBtn.title = "Voice input not supported in this browser.";
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) return;
    try { micBtn.classList.add("listening"); statusText.textContent = "Listening…"; recognition.start(); }
    catch (e) { micBtn.classList.remove("listening"); statusText.textContent = "Voice input error"; }
  });

  // theme
  function applyTheme(theme) {
    document.body.classList.toggle("dark-theme", theme === "dark");
    localStorage.setItem("logistics_theme", theme);
  }
  const savedTheme = localStorage.getItem("logistics_theme") || "light";
  applyTheme(savedTheme);
  themeToggle.addEventListener("click", () => {
    const current = localStorage.getItem("logistics_theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
  });

  // toggle sidebar
  let isBuilder = false;
  toggleModeBtn.addEventListener("click", () => {
    isBuilder = !isBuilder;
    if (isBuilder) {
      chatSidebar.classList.add("hidden");
      builderSidebar.classList.remove("hidden");
      toggleModeBtn.textContent = "Switch to Chat";
    } else {
      builderSidebar.classList.add("hidden");
      chatSidebar.classList.remove("hidden");
      toggleModeBtn.textContent = "Switch to Case Builder";
    }
  });

  // show custom scenario textarea if "Others" chosen
  cbScenario.addEventListener("change", () => {
    if (cbScenario.value === "others") {
      customScenarioWrap.style.display = "block";
    } else {
      customScenarioWrap.style.display = "none";
    }
  });

  // show numerical settings when needed (checkbox OR numerical-only case type)
  function updateNumericalSettingsVisibility() {
    if (cbIncludeNumericals.checked || cbType.value === "numerical-only") {
      numericalSettings.style.display = "flex";
    } else {
      numericalSettings.style.display = "none";
    }
  }
  cbIncludeNumericals.addEventListener("change", updateNumericalSettingsVisibility);
  cbType.addEventListener("change", updateNumericalSettingsVisibility);

  // case builder generate
  cbGenerate.addEventListener("click", async () => {
    // determine final scenario text
    const scenarioValue = cbScenario.value === "others" ? (cbCustomScenario.value || "") : (cbScenario.value || "");
    const caseTypeValue = cbType.value || "";

    const includeNumericalsFlag = cbIncludeNumericals.checked || caseTypeValue === "numerical-only";

    const payload = {
      scenario: scenarioValue,
      customScenario: cbCustomScenario.value || "",
      type: caseTypeValue,
      companyName: cbCompany.value.trim(),
      industry: cbIndustry.value.trim(),
      kpis: cbKpis.value.trim(),
      context: cbContext.value.trim(),
      includeNumericals: includeNumericalsFlag,
      numericalCount: Number(cbNumericalCount.value || 0),
      numericalDifficulty: cbNumericalDifficulty.value || "medium",
      numericalOnly: caseTypeValue === "numerical-only"
    };

    // validation for numerical-only: require count & difficulty
    if (payload.numericalOnly) {
      if (!payload.numericalCount || payload.numericalCount < 1) {
        alert("Enter number of numericals (min 1).");
        return;
      }
      if (!payload.numericalDifficulty) {
        alert("Select numerical difficulty.");
        return;
      }
    } else {
      // for case generation, require scenario and type
      if (!payload.type || !payload.scenario) {
        alert("Please choose a scenario and case type (or choose Numerical-Only).");
        return;
      }
    }

    // show placeholder bot message
    addMessage("Generating... ⏳", "bot");
    statusText.textContent = "Generating…";

    try {
      const res = await fetch("/generate-case-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      // remove last "Generating..." placeholder if present
      const bots = chatBody.querySelectorAll(".msg.bot");
      const lastBot = bots[bots.length - 1];
      if (lastBot && /Generating/i.test(lastBot.innerText)) {
        lastBot.remove();
      }

      if (data.output) {
        addMessage(data.output, "bot");
      } else if (data.text) {
        addMessage(data.text, "bot");
      } else if (data.reply) {
        addMessage(data.reply, "bot");
      } else {
        addMessage("No response from server.", "bot");
      }

      statusText.textContent = "Ready";
    } catch (err) {
      console.error(err);
      addMessage("Network error: " + (err.message || ""), "bot");
      statusText.textContent = "Error";
    }
  });

  cbClear.addEventListener("click", () => {
    cbScenario.value = "";
    cbCustomScenario.value = "";
    customScenarioWrap.style.display = "none";
    cbType.value = "";
    cbCompany.value = "";
    cbIndustry.value = "";
    cbKpis.value = "";
    cbContext.value = "";
    cbIncludeNumericals.checked = false;
    cbNumericalCount.value = 3;
    cbNumericalDifficulty.value = "medium";
    numericalSettings.style.display = "none";
  });

  // chatbot send to server
  async function sendToServer(message) {
    try {
      statusText.textContent = "Thinking…";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      addMessage(data.reply, "bot");
      statusText.textContent = "Ready";
    } catch (e) {
      addMessage("Network error: " + e.message, "bot");
      statusText.textContent = "Error";
    }
  }

  // init
  initTopics();
});
