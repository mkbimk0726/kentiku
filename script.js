document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    function logToScreen(message) {
        let logDiv = document.getElementById("log");
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.id = "log";
            logDiv.style.position = "fixed";
            logDiv.style.bottom = "10px";
            logDiv.style.left = "10px";
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

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/questions.csv");

            if (!response.ok) {
                throw new Error(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
            }

            console.log('📌 CSV を取得しました', response);
            const text = await response.text();
            console.log('📌 CSV の内容:\n' + text);

            // 🔹 PapaParse で CSV を解析
            questions = parseCSVWithPapa(text);
            console.log('📌 パース後の questions:', questions);

            initializeQuestions();
        } catch (error) {
            console.error('❌ CSV の読み込み中にエラーが発生しました:', error);
        }
    }

    // **✅ `PapaParse` を使った CSV パース関数**
    function parseCSVWithPapa(csvText) {
        console.log('📌 parseCSVWithPapa() が実行されました');

        let parsedData = Papa.parse(csvText, {
            header: true,  // 🔹 ヘッダー行をキーとして解析
            skipEmptyLines: true, // 🔹 空行を無視
        });

        console.log('📌 PapaParse の解析結果:', parsedData);

        if (parsedData.errors.length > 0) {
            console.error('❌ PapaParse のエラー:', parsedData.errors);
            return [];
        }

        let result = parsedData.data.map(row => ({
            id: parseInt(row.id),
            type: row.type.trim(),
            question: row.question.trim(),
            choices: row.choices ? row.choices.replace(/(^"|"$)/g, '').split(",") : [],
            correct: row.correct === "true" ? true : row.correct === "false" ? false : row.correct.trim(),
            relatedId: row.relatedId ? parseInt(row.relatedId) : null,
            explanation: row.explanation ? row.explanation.trim() : ""
        }));

        console.log('📌 パース後の questions:', result);
        return result;
    }

    function loadQuestion() {
        console.log('📌 loadQuestion() が実行されました');
        console.log('📌 現在の questions:', questions);

        if (questions.length === 0) {
            console.error('❌ questions 配列が空です！');
            return;
        }

        const questionObj = questions.shift();
        console.log('📌 選ばれた問題:', questionObj);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("result").textContent = "";
        document.getElementById("explanation").textContent = "";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0, questionObj);
                document.getElementById("choices").appendChild(btn);
            });
        } else if (questionObj.choices.length > 0) {
            questionObj.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(choice, questionObj);
                document.getElementById("choices").appendChild(btn);
            });
        }
    }

    function checkAnswer(userAnswer, questionObj) {
        console.log('📌 checkAnswer() が呼び出されました', userAnswer, questionObj);
        let isCorrect = userAnswer === questionObj.correct;

        if (isCorrect) {
            console.log('✅ 正解！');
            document.getElementById("result").textContent = "正解！";
        } else {
            console.log('❌ 不正解...');
            document.getElementById("result").textContent = "不正解...";
        }

        document.getElementById("explanation").textContent = questionObj.explanation;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("next-question").style.display = "block";
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        document.getElementById("start-button").style.display = "none";
        document.getElementById("quiz-container").style.display = "block";
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", () => {
        console.log('📌 次の問題へ進みます');
        loadQuestion();
    });
});
