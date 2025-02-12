document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let missedQuestions = []; // 間違えた問題を保存するリスト

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

                document.getElementById("start-button").style.display = "none";  
                document.getElementById("quiz-container").style.display = "block";  

                currentQuestionIndex = 0;
                correctAnswers = 0;
                loadQuestion();
            } else {
                console.error("❌ 問題が生成されませんでした");
            }
        } catch (error) {
            console.error('❌ CSV 読み込みエラー:', error);
        }
    }

    function checkAnswer(isCorrect, correctAnswer, correctText, questionObj) {
        let resultText = isCorrect ? "✅ 正解！" : "❌ 不正解！";
        resultText += ` 正解: ${correctText}`;
        document.getElementById("result").textContent = resultText;
        if (isCorrect) {
            correctAnswers++;
        } else {
            // ❌ 間違えた場合、形を変えて 2〜6問後に再出題する
            addMissedQuestion(questionObj);
        }

        highlightCorrectAnswer(correctAnswer);
        currentQuestionIndex++;
        document.getElementById("next-question").style.display = "block";
    }

    function addMissedQuestion(questionObj) {
        let newQuestion;
        let delay = Math.floor(Math.random() * 5) + 2; // 2〜6問後に再出題

        if (questionObj.type === "truefalse") {
            // 〇✕問題で間違えたら 4択問題に変える
            newQuestion = {
                type: "multiple",
                question: `${questionObj.correctText} に関する正しい選択肢を選べ`,
                choices: [questionObj.correct].concat(shuffleArray(["選択肢1", "選択肢2", "選択肢3"])), // ダミーを追加
                correct: questionObj.correct
            };
        } else if (questionObj.type === "multiple") {
            // 4択問題で間違えたら 〇✕問題に変える
            newQuestion = {
                type: "truefalse",
                question: `${questionObj.correct} は正しいか？`,
                correct: true,
                correctText: questionObj.correct
            };
        }

        // 20問以内なら挿入、超えるなら次回に出題
        if (questions.length < 20) {
            let insertIndex = Math.min(currentQuestionIndex + delay, questions.length);
            questions.splice(insertIndex, 0, newQuestion);
        } else {
            missedQuestions.push(newQuestion);
        }
    }

    function loadQuestion() {
        console.log('📌 loadQuestion() 実行');

        if (currentQuestionIndex >= questions.length) {
            console.log("📌 全ての問題が終了しました。終了画面へ移行");
            document.getElementById("quiz-container").style.display = "none";
            document.getElementById("end-screen").style.display = "block";
            document.getElementById("score").textContent = `正解数: ${correctAnswers} / ${questions.length}`;

            // 次回に持ち越す問題を追加
            questions = missedQuestions;
            missedQuestions = [];
            return;
        }

        const questionObj = questions[currentQuestionIndex];
        console.log('📌 出題:', questionObj);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0 === questionObj.correct, questionObj.correct ? "〇" : "✕", questionObj.correctText, questionObj);
                document.getElementById("choices").appendChild(btn);
            });
        } else {
            questionObj.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice;
                btn.classList.add("choice-btn");
                btn.onclick = () => {
                    checkAnswer(choice === questionObj.correct, questionObj.correct, questionObj.correct, questionObj);
                    highlightCorrectAnswer(questionObj.correct);
                };
                document.getElementById("choices").appendChild(btn);
            });
        }

        document.getElementById("result").textContent = "";
        document.getElementById("next-question").style.display = "none";
    }

    function highlightCorrectAnswer(correctAnswer) {
        let buttons = document.querySelectorAll(".choice-btn");
        buttons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.style.backgroundColor = "lightgreen"; // 正解をハイライト
            } else {
                btn.style.backgroundColor = "lightcoral"; // 不正解は赤く
            }
            btn.disabled = true; // 選択後にボタンを無効化
        });
    }

    document.getElementById("start-button").addEventListener("click", loadCSV);
    document.getElementById("next-question").addEventListener("click", loadQuestion);
    document.getElementById("restart-button").addEventListener("click", () => location.reload());

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
