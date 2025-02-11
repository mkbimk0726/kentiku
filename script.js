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
        let questionText, correctAnswer, choices = [];

        if (isTrueFalse) {
            // ✅ 〇✕問題（True/False）をランダムに正解・不正解を生成
            let isTrue = Math.random() < 0.5;
            if (isTrue) {
                // ✅ 正しい問題を作成
                questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                correctAnswer = true;
            } else {
                // ✅ 誤った問題を作成（建築家、都市計画、特徴をランダムで変更）
                let wrongEntry = data[Math.floor(Math.random() * data.length)];
                let randType = Math.floor(Math.random() * 3);  // 0: 建築家, 1: 都市計画, 2: 特徴

                if (randType === 0) {
                    questionText = `${entry.都市計画名} は ${wrongEntry.建築家} が ${entry.特徴1}`;
                } else if (randType === 1) {
                    questionText = `${wrongEntry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                } else {
                    questionText = `${entry.都市計画名} は ${entry.建築家} が ${wrongEntry.特徴1}`;
                }

                correctAnswer = false;
            }

            questionsList.push({
                type: "truefalse",
                question: questionText,
                correct: correctAnswer
            });
        } else {
            let isArchitectQuestion = Math.random() < 0.5;

            if (isArchitectQuestion) {
                // ✅ 「この都市計画は誰が設計したか？」（建築家を答える）
                questionText = `${entry.都市計画名} は誰が設計したか？`;
                correctAnswer = entry.建築家;
                choices.push(correctAnswer);

                let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.建築家 !== correctAnswer);
                let extraEntries = getClosestID2Entries(data, entry.groupId, correctAnswer, "建築家");

                while (choices.length < 4 && (relatedEntries.length > 0 || extraEntries.length > 0)) {
                    let randomEntry = relatedEntries.length > 0 
                        ? relatedEntries.pop() 
                        : extraEntries.pop();

                    let wrongChoice = randomEntry.建築家;
                    if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                }
            } else {
                // ✅ 「この建築家が手がけた都市計画は？」（都市計画を答える）
                questionText = `${entry.建築家} は ${entry.特徴1} どの都市計画を手がけたか？`;
                correctAnswer = entry.都市計画名;
                choices.push(correctAnswer);

                let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.都市計画名 !== correctAnswer);
                let extraEntries = getClosestID2Entries(data, entry.groupId, correctAnswer, "都市計画名");

                while (choices.length < 4 && (relatedEntries.length > 0 || extraEntries.length > 0)) {
                    let randomEntry = relatedEntries.length > 0 
                        ? relatedEntries.pop() 
                        : extraEntries.pop();

                    let wrongChoice = randomEntry.都市計画名;
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

    questionsList = questionsList.sort(() => Math.random() - 0.5).slice(0, 20);
    console.log("📌 ランダムに選択された問題リスト:", questionsList);

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

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0 === questionObj.correct);
                document.getElementById("choices").appendChild(btn);
            });
        } else {
            questionObj.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(choice === questionObj.correct);
                document.getElementById("choices").appendChild(btn);
            });
        }

        document.getElementById("result").textContent = "";
        document.getElementById("next-question").style.display = "none";
    }

    function checkAnswer(isCorrect) {
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
