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

                // ✅ スタートボタンを非表示
                document.getElementById("start-button").style.display = "none";  

                // ✅ クイズコンテナを表示
                document.getElementById("quiz-container").style.display = "block";  

                // ✅ 最初の問題を表示
                loadQuestion();
            } else {
                console.error("❌ 問題が生成されませんでした");
            }
        } catch (error) {
            console.error('❌ CSV 読み込みエラー:', error);
        }
    }

    function parseCSV(csvText) {
        console.log('📌 parseCSV() 実行');
        csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        let parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (!parsed.meta || !parsed.meta.fields) {
            console.error("❌ CSVのカラム名が取得できませんでした");
            console.log("📌 `parsed` の中身:", parsed);
            return [];
        }

        parsed.meta.fields = parsed.meta.fields.map(f => f.trim().replace(/\ufeff/g, ""));
        console.log("📌 修正後のCSVカラム名:", parsed.meta.fields);
        console.log("📌 パース結果の生データ:", parsed.data);

        let result = [];
        parsed.data.forEach(row => {
            if (!row["都市計画名"] || !row["建築家"] || !row["特徴1"]) {
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
        console.log("📌 generateQuestions() の入力データ:", data);

        data.forEach(entry => {
            let isTrueFalse = Math.random() < 0.5;
            let questionText, correctAnswer;

            if (isTrueFalse) {
                questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                correctAnswer = true;
            } else {
                let questionOptions = data.filter(q => q.groupId === entry.groupId && q.id !== entry.id);
                let wrongEntry = questionOptions.length > 0 
                    ? questionOptions[Math.floor(Math.random() * questionOptions.length)]
                    : null;

                if (wrongEntry) {
                    questionText = `${entry.都市計画名} は ${wrongEntry.建築家} が ${entry.特徴1}`;
                    correctAnswer = false;
                }
            }

            questionsList.push({
                type: "truefalse",
                question: questionText,
                correct: correctAnswer
            });
        });

        console.log("📌 最終的な問題リスト:", questionsList);
        return questionsList;
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

        let questionTextElem = document.getElementById("question-text");
        if (!questionTextElem) {
            console.error("❌ `question-text` が見つかりません！");
            return;
        }

        // ✅ 画面のテキストを更新
        questionTextElem.textContent = questionObj.question;

        // ✅ 選択肢をクリアして、新しいものを追加
        let choicesContainer = document.getElementById("choices");
        choicesContainer.innerHTML = "";  // ← ここでクリア

        ["〇", "✕"].forEach((option, index) => {
            const btn = document.createElement("button");
            btn.textContent = option;
            btn.classList.add("choice-btn");
            btn.onclick = () => checkAnswer(index === 0, questionObj);
            choicesContainer.appendChild(btn);
        });

        // ✅ 「次の問題へ」ボタンを隠す
        document.getElementById("next-question").style.display = "none";
    }

    function checkAnswer(userAnswer, questionObj) {
        console.log("📌 ユーザーの回答:", userAnswer);
        console.log("📌 正解:", questionObj.correct);

        document.getElementById("result").textContent = userAnswer === questionObj.correct
            ? "正解！"
            : "不正解！";

        if (userAnswer === questionObj.correct) {
            correctAnswers++;
        }

        currentQuestionIndex++;

        // ✅ 「次の問題へ」ボタンを表示
        document.getElementById("next-question").style.display = "block";
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", () => {
        console.log("📌 次の問題ボタンが押されました");
        loadQuestion();
    });
});
