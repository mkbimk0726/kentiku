function generateQuestions(data) {
    let questionsList = [];

    data.forEach(entry => {
        let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.id !== entry.id);
        let isTrueFalse = Math.random() < 0.5;

        if (isTrueFalse) {
            let isTrue = Math.random() < 0.5;
            let questionText, correctAnswer;

            if (isTrue || relatedEntries.length === 0) {
                questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                correctAnswer = true;
            } else {
                let randType = Math.floor(Math.random() * 3);
                let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];

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
            let randType = Math.floor(Math.random() * 2);
            let questionText, correctAnswer, choices = [];

            if (randType === 0) {
                questionText = `${entry.都市計画名} は ${entry.特徴1} 設計者は誰か？`;
                correctAnswer = entry.建築家;

                choices.push(correctAnswer);
                while (choices.length < 4 && relatedEntries.length > 0) {
                    let randomEntry = relatedEntries.pop();
                    let wrongChoice = randomEntry.建築家;
                    if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                }
            } else {
                questionText = `${entry.建築家} は ${entry.特徴1} 建築物はどれか？`;
                correctAnswer = entry.都市計画名;

                choices.push(correctAnswer);
                while (choices.length < 4 && relatedEntries.length > 0) {
                    let randomEntry = relatedEntries.pop();
                    let wrongChoice = randomEntry.都市計画名;
                    if (!choices.includes(wrongChoice)) choices.push(wrongChoice);
                }
            }

            choices = shuffleArray(choices); // ✅ 修正：`shuffleArray()` を適用

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
