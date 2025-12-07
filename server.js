require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));   // serve frontend assets

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------------------------------------------------
   1️⃣ CHATBOT ENDPOINT
----------------------------------------------------*/
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: userMessage }] }
      ]
    });

    const reply = result.response.text();
    res.json({ reply });

  } catch (err) {
    console.error("Gemini API Error:", err);
    res.json({ reply: "Error: " + err.message });
  }
});

/* ---------------------------------------------------
   2️⃣  CASE STUDY BUILDER + NUMERICALS
----------------------------------------------------*/

app.post("/generate-case-study", async (req, res) => {
  try {
    const {
      companyName,
      industry,
      kpis,
      context,
      scenario,
      customScenario,
      includeNumericals,
      numberOfNumericals,
      difficulty
    } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Handle “Others” scenario
    const finalScenario =
      scenario === "Others" && customScenario?.trim()
        ? customScenario
        : scenario;

    const prompt = `
Generate a CLEAN and WELL-FORMATTED logistics/warehouse case study using the exact structure below.

If "includeNumericals" = true, add numericals at the end.
If includeNumericals = false, ONLY generate numericals (standalone).

------------------------------------------
📌 **CASE STUDY TITLE**
(Create a relevant title)

### 1. Company Background
Company: ${companyName}
Industry: ${industry}

### 2. Scenario
${finalScenario}

### 3. Operational Problem
Describe a realistic operational issue.

### 4. KPI Situation
KPIs to focus on: ${kpis}

### 5. Root Cause Analysis (5 Whys)
Provide structured 5-why analysis.

### 6. Proposed Solutions
Give 3–5 solutions (technical + process)

### 7. Expected KPI Impact
Explain improvements clearly.

### 8. Conclusion
Provide a crisp closing summary.

------------------------------------------
📘 **Numericals (Only if enabled OR standalone mode)**

If "includeNumericals" = true → Add ${numberOfNumericals} numericals  
If case study is NOT requested → ONLY output numericals  
Difficulty Level: ${difficulty}

⚠️ NUMERICAL FORMAT (STRICT)
1. **Question**
2. Step-by-step solution
3. Final answer
------------------------------------------

Additional Context:
${context}
------------------------------------------
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const output = result.response.text();
    res.json({ output });

  } catch (error) {
    console.error("Case Study Error:", error);
    res.status(500).json({ error: "Failed to generate case study." });
  }
});

/* ---------------------------------------------------
   3️⃣ NUMERICALS ONLY (DIRECT GENERATOR)
----------------------------------------------------*/
app.post("/generate-numericals-only", async (req, res) => {
  try {
    const { numberOfNumericals, difficulty, topic } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Generate ONLY numericals related to logistics & supply chain.

Count: ${numberOfNumericals}
Difficulty: ${difficulty}
Topic: ${topic || "General Logistics"}

FORMAT STRICTLY:
----------------------------------
### Numerical X
**Question:**  
**Solution (step-by-step):**  
**Final Answer:**  
----------------------------------
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const output = result.response.text();
    res.json({ output });

  } catch (err) {
    console.error("Numerical Error:", err);
    res.status(500).json({ error: "Failed to generate numericals." });
  }
});

/* ---------------------------------------------------
   4️⃣ START SERVER
----------------------------------------------------*/
app.listen(3000, () => {
  console.log("Server running → http://localhost:3000");
});
