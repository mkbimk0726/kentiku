document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    // ✅ デバッグログを画面上に表示
    function logToScreen(message) {
        let logDiv = document.getElementById("debug-log");
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.id = "debug-log";
            logDiv.style.position = "fixed";
            logDiv.style.top = "10px";
            logDiv.style.left = "10px";
            logDiv.style.width = "90%";
            logDiv.style.height = "30%";
            logDiv.style.overflowY = "auto";
            logDiv.style.background = "rgba(0, 0, 0, 0.8)";
            logDiv.style.color = "white";
            logDiv.style.padding = "10px";
            logDiv.style.fontSize = "12px";
            logDiv.style.zIndex = "9999";
            document.body.appendChild(logDiv);
        }
        logDiv.innerHTML += message + "<br>";
    }

    console.log = (function(origConsoleLog) {
        return function(message) {
            origConsoleLog(message);
            logToScreen(message);
        };
    })(console.log);

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/questions.csv");
            if (!response.ok) {
                throw new Error(`HTTPエラー: ${response.status}`);
            }
            
            const text = await response.text();
            console.log(`📌 CSV 取得内容 (先頭100文字): ${text.slice(0, 100)}`); // 🔍デバッグ用
            let parsedData = parseCSV(text);

            if (!parsedData || parsedData.length === 0) {
                throw new Error("CSVのパース結果が空です");
            }

            console.log('📌 CSV パース後:', parsedData);
            questions = generateQuestions(parsedData);

            if (questions.length > 0) {
                initializeQuestions();
            } else {
                console.error("❌ 問題が生成されませんでした");
            }
        } catch (error) {
            console.error('❌ CSV 読み込みエラー:', error);
        }
    }

    function parseCSV(csvText) {
        console.log('📌 parseCSV() 実行');

        // ✅ 改行コードを統一
        csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // ✅ CSV をパース
        let parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        console.log("📌 パース結果の生データ:", parsed.data);

        // ✅ パース時のエラーをチェック
        if (parsed.errors.length > 0) {
            console.error("❌ CSV パースエラー:", parsed.errors);
        }

        let result = [];

        parsed.data.forEach(row => {
            // 各データが正しく取得できているかチェック
            console.log("📌 解析中の行:", row);

            if (!row["ID1"] || !row["都市計画名"] || !row["建築家"] || !row["特徴1"]) {
                console.warn("⚠ 無効な行 (スキップ):", row);
                return; 
            }

            result.push({
                id: parseInt(row["ID1"]),
                groupId: parseInt(row["ID2"]),
                都市計画名: (row["都市計画名"] ?? "").toString().trim(),
                建築家: (row["建築家"] ?? "").toString().trim(),
                特徴1: (row["特徴1"] ?? "").toString().trim()
            });
        });

        console.log("📌 最終的なパース結果:", result);
        return result;
    }

    function generateQuestions(data) {
        let questionsList = [];

        data.forEach(entry => {
            let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.id !== entry.id);
            let isTrueFalse = Math.random() < 0.5;

            if (isTrueFalse) {
                let isTrue = Math.random() < 0.5;
                let questionText, correctAnswer;

                if (isTrue || relatedEntries.length === 0) {
                    questionText = `${entry.都市計画名} は ${entry.建築家} が設計した`;
                    correctAnswer = true;
                } else {
                    let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];
                    questionText = `${entry.都市計画名} は ${wrongEntry.建築家} が設計した`;
                    correctAnswer = false;
                }

                questionsList.push({
                    type: "truefalse",
                    question: questionText,
                    correct: correctAnswer
                });
            } else {
                let questionText = `${entry.都市計画名} は誰が設計したか？`;
                let correctAnswer = entry.建築家;
                let choices = [correctAnswer];

                while (choices.length < 4 && relatedEntries.length > 0) {
                    let randomEntry = relatedEntries.pop();
                    let wrongChoice = randomEntry.建築家;
                    if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                }

                choices = shuffleArray(choices);

                questionsList.push({
                    type: "multiple",
                    question: questionText,
                    choices: choices,
                    correct: correctAnswer
                });
            }
        });

        return questionsList;
    }

    function initializeQuestions() {
        currentQuestionIndex = 0;
        document.getElementById("start-button").style.display = "none";
        document.getElementById("quiz-container").style.display = "block";
        document.getElementById("end-screen").style.display = "none";
        loadQuestion();
    }

    function loadQuestion() {
        console.log('📌 loadQuestion() 実行');
        if (currentQuestionIndex >= 20 || questions.length === 0) {
            showEndScreen();
            return;
        }

        const questionObj = questions[currentQuestionIndex];
        console.log('📌 出題:', questionObj);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("next-question").style.display = "none";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0 ? true : false, questionObj);
                document.getElementById("choices").appendChild(btn);
            });
        }
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });
});
