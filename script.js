document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    let questions = [];

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/questions.csv");
            const text = await response.text();
            console.log('📌 CSV を取得しました:', text.slice(0, 100)); // 先頭100文字のみ表示
            questions = generateQuestions(parseCSV(text));
            console.log('📌 生成された問題:', questions);
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });
});
