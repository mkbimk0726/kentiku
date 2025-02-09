document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    function logToScreen(message) {
        let logDiv = document.getElementById("log");
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.id = "log";
            logDiv.style.position = "fixed";
            logDiv.style.bottom = "10px";
            logDiv.style.left = "10px";
            logDiv.style.background = "rgba(0, 0, 0, 0.8)";
            logDiv.style.color = "white";
            logDiv.style.padding = "10px";
            logDiv.style.fontSize = "12px";
            logDiv.style.zIndex = "9999";
            document.body.appendChild(logDiv);
        }
        logDiv.innerHTML += message + "<br>";
    }

    console.log = (function(origConsoleLog) {
        return function(message) {
            origConsoleLog(message);
            logToScreen(message);
        };
    })(console.log);

    async function loadCSV() {
        console.log('📌 loadCSV() が実行されました');
        try {
            const response = await fetch("/questions.csv");

            if (!response.ok) {
                throw new Error(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
            }

            console.log('📌 CSV を取得しました', response);
            const text = await response.text();
            console.log('📌 CSV の内容:\n' + text);
            questions = parseCSV(text);
            console.log('📌 パース後の questions:', questions);
            initializeQuestions();
        } catch (error) {
            console.error('❌ CSV の読み込み中にエラーが発生しました:', error);
        }
    }
    function parseCSV(csvText) {
    console.log('📌 parseCSV() が実行されました');

    // 🔹 CSVの最初の100文字をログ出力（データの状態を確認）
    console.log('📌 CSV の先頭100文字:', csvText.slice(0, 100));

    // 🔹 改行コードを `\n` に統一（Windowsの `\r\n` も修正）
    csvText = csvText.replace(/\r/g, "\n");

    // 🔹 CSVの各行を配列に分割
    const lines = csvText.trim().split("\n");
    console.log('📌 CSV の行数:', lines.length);

    if (lines.length < 2) {
        console.error('❌ CSV にデータがありません');
        return [];
    }

    const result = [];
    const headers = lines[0].split(","); // ヘッダー行を取得
    console.log('📌 ヘッダー:', headers);

    for (let i = 1; i < lines.length; i++) {
        // 🛠 デバッグ用に行の内容を出力
        console.log(`📌 行 ${i} の内容 (元のまま):`, lines[i]);

        // 🛠 カンマ区切りを適切に処理（ダブルクォート内のカンマは無視）
        let data = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        // 🛠 分割後のデータをデバッグ出力
        console.log(`📌 パースされた行 ${i}:`, data);

        if (!data || data.length < headers.length) {
            console.error(`❌ データのフォーマットが正しくない（行 ${i}）:`, data);
            continue;
        }

        let questionObj = {
            id: parseInt(data[0]),
            type: data[1].trim(),
            question: data[2].trim(),
            choices: data[3] ? data[3].replace(/(^"|"$)/g, '').split(",") : [], // 選択肢の `"` を除去
            correct: data[4] === "true" ? true : data[4] === "false" ? false : data[4].trim(),
            relatedId: data[5] ? parseInt(data[5]) : null,
            explanation: data[6] ? data[6].trim() : ""
        };

        result.push(questionObj);
    }
    
    console.log('📌 パース後の questions:', result);
    return result;
    }


    function loadQuestion() {
        console.log('📌 loadQuestion() が実行されました');
        console.log('📌 現在の questions:', questions);

        if (questions.length === 0) {
            console.error('❌ questions 配列が空です！');
            return;
        }

        const questionObj = questions.shift();
        console.log('📌 選ばれた問題:', questionObj);

        document.getElementById("question-text").textContent = questionObj.question;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("result").textContent = "";
        document.getElementById("explanation").textContent = "";

        if (questionObj.type === "truefalse") {
            ["〇", "✕"].forEach((option, index) => {
                const btn = document.createElement("button");
                btn.textContent = option;
                btn.classList.add("choice-btn");
                btn.onclick = () => checkAnswer(index === 0, questionObj);
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
        console.log('📌 checkAnswer() が呼び出されました', userAnswer, questionObj);
        let isCorrect = userAnswer === questionObj.correct;

        if (isCorrect) {
            console.log('✅ 正解！');
            document.getElementById("result").textContent = "正解！";
        } else {
            console.log('❌ 不正解...');
            document.getElementById("result").textContent = "不正解...";
        }

        document.getElementById("explanation").textContent = questionObj.explanation;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("next-question").style.display = "block";
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        document.getElementById("start-button").style.display = "none";
        document.getElementById("quiz-container").style.display = "block";
        loadCSV();
    });

    document.getElementById("next-question").addEventListener("click", () => {
        console.log('📌 次の問題へ進みます');
        loadQuestion();
    });
});
