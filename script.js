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

        return parsed.data.map(row => ({
            id: parseInt(row["ID1"]),
            groupId: parseInt(row["ID2"]),
            都市計画名: row["都市計画名"].toString().trim(),
            建築家: row["建築家"].toString().trim(),
            特徴1: row["特徴1"].toString().trim()
        }));
    }

    function generateQuestions(data) {
        let questionsList = [];
        console.log("📌 generateQuestions() の入力データ:", data);

        data.forEach(entry => {
            let isTrueFalse = Math.random() < 0.5;
            let questionText, correctAnswer, choices = [];

            if (isTrueFalse) {
                let isTrue = Math.random() < 0.5;
                if (isTrue) {
                    questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                    correctAnswer = true;
                } else {
                    let wrongEntry = data[Math.floor(Math.random() * data.length)];
                    let randType = Math.floor(Math.random() * 3);

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
                    questionText = `${entry.都市計画名} は誰が設計したか？`;
                    correctAnswer = entry.建築家;
                    choices.push(correctAnswer);

                    let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.建築家 !== correctAnswer);
                    let extraEntries = getClosestID2Entries(data, entry.groupId, correctAnswer, "建築家");

                    while (choices.length < 4 && (relatedEntries.length > 0 || extraEntries.length > 0)) {
                        let randomEntry = relatedEntries.length > 0 ? relatedEntries.pop() : extraEntries.pop();
                        let wrongChoice = randomEntry.建築家;
                        if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                    }
                } else {
                    questionText = `${entry.建築家} は ${entry.特徴1} どの都市計画を手がけたか？`;
                    correctAnswer = entry.都市計画名;
                    choices.push(correctAnswer);

                    let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.都市計画名 !== correctAnswer);
                    let extraEntries = getClosestID2Entries(data, entry.groupId, correctAnswer, "都市計画名");

                    while (choices.length < 4 && (relatedEntries.length > 0 || extraEntries.length > 0)) {
                        let randomEntry = relatedEntries.length > 0 ? relatedEntries.pop() : extraEntries.pop();
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

        return questionsList.sort(() => Math.random() - 0.5).slice(0, 20);
    }

    function getClosestID2Entries(data, targetGroupId, correctAnswer, key) {
        return data
            .filter(q => q.groupId !== targetGroupId && q[key] !== correctAnswer)
            .sort((a, b) => Math.abs(a.groupId - targetGroupId) - Math.abs(b.groupId - targetGroupId));
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
