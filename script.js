document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    // ✅ デバッグメッセージを非表示にする
    function logToScreen(message) {
        let logDiv = document.getElementById("log");
        if (!logDiv) return;
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
            const text = await response.text();
            console.log('📌 CSV を取得しました:', text.slice(0, 100)); 
            questions = parseCSV(text);
            console.log('📌 パース後の questions:', questions);
            initializeQuestions();
        } catch (error) {
            console.error('❌ CSV の読み込みエラー:', error);
        }
    }

    function parseCSV(csvText) {
        console.log('📌 parseCSV() が実行されました');
        let result = [];
        let parsed = Papa.parse(csvText, { header: true });

        if (parsed.errors.length > 0) {
            console.error("❌ CSV パースエラー:", parsed.errors);
        }

        parsed.data.forEach(row => {
            if (!row.id || !row.question) return;
            result.push({
                id: parseInt(row.id),
                type: row.type.trim(),
                question: row.question.trim(),
                choices: row.choices ? row.choices.replace(/(^"|"$)/g, '').split(",") : [],
                correct: row.correct === "true" ? true : row.correct === "false" ? false : row.correct.trim(),
                relatedId: row.relatedId ? parseInt(row.relatedId) : null,
                explanation: row.explanation ? row.explanation.trim() : ""
            });
        });

        console.log('📌 パース後の questions:', result);
        return result;
    }

    function initializeQuestions() {
        currentQuestionIndex = 0;
        correctAnswers = 0;
        loadQuestion();
    }

    function loadQuestion() {
        console.log('📌 loadQuestion() が実行されました');
        if (currentQuestionIndex >= questions.length) {
            showEndScreen();
            return;
        }

        const questionObj = questions[currentQuestionIndex];
        console.log('📌 出題:', questionObj);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("result").textContent = "";
        document.getElementById("explanation").textContent = "";
        document.getElementById("next-question").style.display = "none";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0 ? true : false, questionObj);
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
        console.log('📌 checkAnswer() が実行されました', userAnswer, questionObj);
        let isCorrect = userAnswer === questionObj.correct;

        document.getElementById("result").textContent = isCorrect ? "正解！" : "不正解...";
        document.getElementById("explanation").textContent = questionObj.explanation;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("next-question").style.display = "block";

        if (isCorrect) correctAnswers++;

        currentQuestionIndex++;
    }

    function showEndScreen() {
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("end-screen").style.display = "block";
        document.getElementById("score").textContent = `正解数: ${correctAnswers} / ${questions.length}`;
    }

    function restartQuiz() {
        console.log('📌 スタートに戻るボタンが押されました');
        
        document.getElementById("start-button").style.display = "block"; // ✅ スタートボタンを表示
        document.getElementById("quiz-container").style.display = "none"; // ✅ クイズ画面を非表示
        document.getElementById("end-screen").style.display = "none"; // ✅ 終了画面を非表示

        initializeQuestions(); // ✅ 質問リストをリセット
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        document.getElementById("start-button").style.display = "none";
        document.getElementById("quiz-container").style.display = "block";
        document.getElementById("end-screen").style.display = "none";
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", () => {
        console.log('📌 次の問題へ進みます');
        loadQuestion();
    });

    document.getElementById("restart-button").addEventListener("click", restartQuiz); // ✅ スタートに戻るボタンを修正
});
