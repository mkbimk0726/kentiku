document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    function logToScreen(message) {
        let logDiv = document.getElementById("log");
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.id = "log";
            logDiv.style.position = "fixed";
            logDiv.style.top = "10px";
            logDiv.style.right = "10px";
            logDiv.style.width = "300px";
            logDiv.style.maxHeight = "250px";
            logDiv.style.overflowY = "auto";
            logDiv.style.background = "rgba(0, 0, 0, 0.8)";
            logDiv.style.color = "white";
            logDiv.style.padding = "10px";
            logDiv.style.fontSize = "12px";
            logDiv.style.zIndex = "9999";
            document.body.appendChild(logDiv);
        }
        logDiv.innerHTML += "📌 " + message + "<br>";
    }

    console.log = (function(origConsoleLog) {
        return function(message) {
            origConsoleLog(message);
            logToScreen(JSON.stringify(message, null, 2));
        };
    })(console.log);

    let questions = [];

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/questions.csv");

            if (!response.ok) {
                throw new Error(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            console.log('📌 CSV を取得しました');
            console.log('📌 CSV の内容（先頭100文字）:', text.slice(0, 100));

            questions = parseCSVWithPapa(text);

            console.log('📌 パース後の questions:', questions);

            if (questions.length === 0) {
                console.error('❌ パース後の questions が空です！');
                return;
            }

            initializeQuestions();
        } catch (error) {
            console.error('❌ CSV の読み込み中にエラーが発生しました:', error);
        }
    }

    function parseCSVWithPapa(csvText) {
        console.log('📌 parseCSVWithPapa() が実行されました');

        const result = Papa.parse(csvText, {
            header: true,  // ヘッダーをキーとして扱う
            skipEmptyLines: true
        });

        console.log('📌 PapaParse の解析結果:', result);

        if (result.errors.length > 0) {
            console.error('❌ CSV 解析エラー:', result.errors);
        }

        return result.data;
    }

    function initializeQuestions() {
        console.log('📌 initializeQuestions() が実行されました');

        if (questions.length === 0) {
            console.error('❌ initializeQuestions(): questions が空です！');
            return;
        }

        shuffleArray(questions);
        loadQuestion();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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
        } else if (questionObj.choices) {
            let choicesArray = questionObj.choices.split(",");
            choicesArray.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice.trim();
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(choice.trim(), questionObj);
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
