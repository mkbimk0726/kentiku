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
            console.log(`📌 CSV 取得内容 (先頭100文字): ${text.slice(0, 100)}`);
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

        let parsed = Papa.parse(csvText, { 
            header: true, 
            skipEmptyLines: true 
        });

        if (parsed.errors.length > 0) {
            console.error("❌ CSV パースエラー:", parsed.errors);
        }

        console.log("📌 パース結果の生データ:", parsed);

        let result = [];

        parsed.data.forEach(row => {
            if (!row["ID1"] || !row["都市計画"] || !row["建築家"] || !row["特徴1"]) {
                console.warn("⚠ 無効な行 (スキップ):", row);
                return; 
            }

            result.push({
                id: parseInt(row["ID1"].trim()),
                groupId: parseInt(row["ID2"].trim()),
                都市計画: row["都市計画"].trim(),
                建築家: row["建築家"].trim(),
                特徴1: row["特徴1"].trim()
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
                    questionText = `${entry.都市計画} は ${entry.建築家} が設計した`;
                    correctAnswer = true;
                } else {
                    let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];
                    let randType = Math.floor(Math.random() * 3);

                    if (randType === 0) {
                        questionText = `${entry.都市計画} は ${wrongEntry.建築家} が設計した`;
                    } else if (randType === 1) {
                        questionText = `${wrongEntry.都市計画} は ${entry.建築家} が設計した`;
                    } else {
                        questionText = `${entry.都市計画} は ${entry.建築家} が ${wrongEntry.特徴1}`;
                    }

                    correctAnswer = false;
                }

                questionsList.push({
                    type: "truefalse",
                    question: questionText,
                    correct: correctAnswer
                });
            } else {
                let randType = Math.floor(Math.random() * 2);
                let questionText, correctAnswer, choices = [];

                if (randType === 0) {
                    questionText = `${entry.都市計画} は ${entry.特徴1} 設計者は誰か？`;
                    correctAnswer = entry.建築家;

                    choices.push(correctAnswer);
                    while (choices.length < 4 && relatedEntries.length > 0) {
                        let wrongChoice = relatedEntries.pop().建築家;
                        if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                    }
                } else {
                    questionText = `${entry.建築家} は ${entry.特徴1} 都市計画はどれか？`;
                    correctAnswer = entry.都市計画;

                    choices.push(correctAnswer);
                    while (choices.length < 4 && relatedEntries.length > 0) {
                        let wrongChoice = relatedEntries.pop().都市計画;
                        if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                    }
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });
});
