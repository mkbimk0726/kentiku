document.addEventListener("DOMContentLoaded", () => {
    let questions = [];
    let questionPool = [];
    let questionHistory = new Set();
    let currentQuestionIndex = 0;
    let wrongQuestions = [];
    let totalQuestions = 20;
    let pendingQuestions = [];
    let correctAnswers = 0;

    async function loadCSV() {
        try {
            const response = await fetch("/questions.csv");

            if (!response.ok) {
                throw new Error(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            questions = parseCSV(text);
            initializeQuestions();
        } catch (error) {
            console.error('❌ CSV の読み込み中にエラーが発生しました:', error);
        }
    }

    function parseCSV(csvText) {
        csvText = csvText.replace(/\r/g, "\n");
        const lines = csvText.trim().split("\n");

        if (lines.length < 2) {
            console.error('❌ CSV にデータがありません');
            return [];
        }

        const result = [];
        const headers = lines[0].split(",");
        for (let i = 1; i < lines.length; i++) {
            let data = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

            if (!data || data.length < headers.length) continue;

            let questionObj = {
                id: parseInt(data[0]),
                type: data[1].trim(),
                question: data[2].trim(),
                choices: data[3] ? data[3].replace(/(^"|"$)/g, '').split(",") : [],
                correct: data[4] === "true" ? true : data[4] === "false" ? false : data[4].trim(),
                relatedId: data[5] ? parseInt(data[5]) : null,
                explanation: data[6] ? data[6].trim() : ""
            };

            result.push(questionObj);
        }
        return result;
    }

    function initializeQuestions() {
        questionPool = [...questions];
        currentQuestionIndex = 0;
        correctAnswers = 0;
        shuffleArray(questionPool);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadQuestion() {
        if (currentQuestionIndex >= totalQuestions || questionPool.length === 0) {
            showEndScreen();
            return;
        }

        const questionObj = questionPool.shift();
        questionHistory.add(questionObj.id);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("result").textContent = "";
        document.getElementById("explanation").textContent = "";
        document.getElementById("next-question").style.display = "none";

        if (questionObj.type === "truefalse") {
            ["✕", "〇"].forEach((option, index) => { // ✕ を 0, 〇 を 1 にする
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 1, questionObj); // 〇 のとき true にする
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
        let isCorrect = userAnswer === questionObj.correct;

        if (isCorrect) {
            document.getElementById("result").textContent = "正解！";
            correctAnswers++;
        } else {
            document.getElementById("result").textContent = "不正解...";
            wrongQuestions.push(questionObj);
        }

        document.getElementById("explanation").textContent = questionObj.explanation;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("next-question").style.display = "block";
    }

    function showEndScreen() {
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("end-screen").style.display = "block";
        document.getElementById("score").textContent = `正解数: ${correctAnswers} / ${totalQuestions}`;
    }

    function restartQuiz() {
        document.getElementById("start-button").style.display = "block";
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("end-screen").style.display = "none";

        initializeQuestions();
    }

    document.getElementById("start-button").addEventListener("click", () => {
        document.getElementById("start-button").style.display = "none";
        document.getElementById("quiz-container").style.display = "block";
        document.getElementById("end-screen").style.display = "none";
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", loadQuestion);
    document.getElementById("restart-button").addEventListener("click", restartQuiz);
});
