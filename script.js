document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/question.csv");
            const text = await response.text();
            console.log('📌 CSV を取得しました:', text.slice(0, 100)); // 先頭100文字のみ表示
            questions = generateQuestions(parseCSV(text));
            console.log('📌 生成された問題:', questions);

            // ✅ 問題リストが空でないか確認し、初期化
            if (questions.length > 0) {
                initializeQuestions();
            } else {
                console.error("❌ 問題が生成されませんでした");
            }

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
            if (!row.id || !row["建築物"]) return; // 無効な行はスキップ
            result.push({
                id: parseInt(row.id),
                groupId: parseInt(row.groupId),
                建築物: row["建築物"].trim(),
                建築家: row["建築家"].trim(),
                設計: row["設計"].trim()
            });
        });

        console.log('📌 パース後の CSV データ:', result);
        return result;
    }

    function generateQuestions(data) {
        let questionsList = [];

        data.forEach(entry => {
            let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.id !== entry.id);
            let isTrueFalse = Math.random() < 0.5; // 50% の確率で〇✕問題 or 4択問題

            if (isTrueFalse) {
                // 〇✕問題
                let isTrue = Math.random() < 0.5;
                let questionText, correctAnswer;

                if (isTrue || relatedEntries.length === 0) {
                    // 〇 の場合
                    questionText = `${entry.建築物} は ${entry.建築家} が ${entry.設計}`;
                    correctAnswer = true;
                } else {
                    // × の場合（ランダムに異なる部分を変更）
                    let randType = Math.floor(Math.random() * 3);
                    let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];

                    if (randType === 0) {
                        questionText = `${entry.建築物} は ${wrongEntry.建築家} が ${entry.設計}`;
                    } else if (randType === 1) {
                        questionText = `${wrongEntry.建築物} は ${entry.建築家} が ${entry.設計}`;
                    } else {
                        questionText = `${entry.建築物} は ${entry.建築家} が ${wrongEntry.設計}`;
                    }

                    correctAnswer = false;
                }

                questionsList.push({
                    type: "truefalse",
                    question: questionText,
                    correct: correctAnswer
                });
            } else {
                // 4択問題
                let randType = Math.floor(Math.random() * 2); // どのパターンの問題を出すか
                let questionText, correctAnswer, choices = [];

                if (randType === 0) {
                    // `{6列目}は{8列目} 設計者は誰か？`
                    questionText = `${entry.建築物} は ${entry.設計} 設計者は誰か？`;
                    correctAnswer = entry.建築家;

                    choices.push(correctAnswer);
                    while (choices.length < 4 && relatedEntries.length > 0) {
                        let randomEntry = relatedEntries.pop();
                        let wrongChoice = randomEntry.建築家;
                        if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                    }
                } else {
                    // `{7列目}は{8列目} 建築物はどれか？`
                    questionText = `${entry.建築家} は ${entry.設計} 建築物はどれか？`;
                    correctAnswer = entry.建築物;

                    choices.push(correctAnswer);
                    while (choices.length < 4 && relatedEntries.length > 0) {
                        let randomEntry = relatedEntries.pop();
                        let wrongChoice = randomEntry.建築物;
                        if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                    }
                }

                // 4択の選択肢をシャッフル
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
        console.log('📌 loadQuestion() が実行されました');
        if (currentQuestionIndex >= 20 || questions.length === 0) {
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
        document.getElementById("next-question").style.display = "block";
        currentQuestionIndex++;
    }

    function showEndScreen() {
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("end-screen").style.display = "block";
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", () => {
        console.log('📌 次の問題へ進みます');
        loadQuestion();
    });
});
