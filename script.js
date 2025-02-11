document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    // ✅ デバッグログを画面上に表示する関数
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
            console.log(`📌 CSV 取得内容 (先頭200文字): ${text.slice(0, 200)}`);

            let parsedData = parseCSV(text);

            if (!parsedData || parsedData.length === 0) {
                throw new Error("CSVのパース結果が空です");
            }

            console.log('📌 CSV パース後:', parsedData);
            questions = generateQuestions(parsedData);

            if (questions.length > 0) {
                console.log("📌 質問データが正常に作成されました。最初の質問を読み込みます");
                loadQuestion();  // ✅ 修正: `initializeQuestions()` → `loadQuestion()`
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

        // ✅ CSV をパース（header: false に変更）
        let parsed = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        console.log("📌 `parsed` の中身:", parsed);

        // ✅ カラム名を手動で設定
        let columnNames = ["ID1", "ID2", "都市計画", "現代歴史", "地域", "都市計画名", "建築家", "特徴1"];
        let dataRows = parsed.data.slice(1);  // 1行目をスキップ（カラム名とする）

        let result = [];
        dataRows.forEach(row => {
            let rowObj = {};
            columnNames.forEach((col, index) => {
                rowObj[col] = row[index] || "";
            });

            console.log("📌 手動で作成した行データ:", rowObj);
            result.push(rowObj);
        });

        console.log("📌 最終的なパース結果:", result);
        return result;
    }

    function generateQuestions(data) {
        let questionsList = [];
        console.log("📌 generateQuestions() の入力データ:", data);

        data.forEach(entry => {
            console.log("📌 現在処理中のエントリ:", entry);

            let relatedEntries = data.filter(q => q.ID2 === entry.ID2 && q.ID1 !== entry.ID1);
            let isTrueFalse = Math.random() < 0.5;

            if (isTrueFalse) {
                let isTrue = Math.random() < 0.5;
                let questionText, correctAnswer;

                if (isTrue || relatedEntries.length === 0) {
                    questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                    correctAnswer = true;
                } else {
                    let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];
                    questionText = `${entry.都市計画名} は ${wrongEntry.建築家} が ${entry.特徴1}`;
                    correctAnswer = false;
                }

                questionsList.push({
                    type: "truefalse",
                    question: questionText,
                    correct: correctAnswer
                });
            }
        });

        console.log("📌 最終的な問題リスト:", questionsList);
        return questionsList;
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
