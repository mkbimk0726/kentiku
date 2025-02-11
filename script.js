document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

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

    function loadQuestion() {
        console.log('📌 loadQuestion() 実行');

        if (currentQuestionIndex >= questions.length) {
            console.log("📌 全ての問題が終了しました。終了画面へ移行");
            document.getElementById("quiz-container").style.display = "none";
            document.getElementById("end-screen").style.display = "block";
            document.getElementById("score").textContent = `正解数: ${correctAnswers} / ${questions.length}`;
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
                // ✅ 〇✕問題は `questionObj.correct` が `true/false`
                btn.onclick = () => checkAnswer(index === 0 === questionObj.correct);
                document.getElementById("choices").appendChild(btn);
            });
        } else {
            questionObj.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice;
                btn.classList.add("choice-btn");
                // ✅ 4択問題も `true/false` で判定
                btn.onclick = () => checkAnswer(choice === questionObj.correct);
                document.getElementById("choices").appendChild(btn);
            });
        }

        document.getElementById("result").textContent = "";
        document.getElementById("next-question").style.display = "none";
    }

    function checkAnswer(isCorrect) {
        console.log("📌 ユーザーの回答:", isCorrect);
        console.log("📌 正解:", questions[currentQuestionIndex].correct);

        document.getElementById("result").textContent = isCorrect ? "正解！" : "不正解！";
        if (isCorrect) correctAnswers++;
        currentQuestionIndex++;

        document.getElementById("next-question").style.display = "block";
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
