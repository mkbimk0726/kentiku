document.addEventListener("DOMContentLoaded", () => {
    console.log('📌 スクリプトが読み込まれました');

    // ✅ デバッグログを画面上に表示する関数
    function logToScreen(message) {
        let logDiv = document.getElementById("debug-log");
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.id = "debug-log";
            logDiv.style.position = "fixed";
            logDiv.style.top = "10px";
            logDiv.style.left = "10px";
            logDiv.style.width = "90%";
            logDiv.style.height = "30%";
            logDiv.style.overflowY = "auto";
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
            console.log(`📌 CSV 取得内容 (先頭200文字): ${text.slice(0, 200)}`); // 🔍デバッグ用

            let parsedData = parseCSV(text);

            if (!parsedData || parsedData.length === 0) {
                throw new Error("CSVのパース結果が空です");
            }

            console.log('📌 CSV パース後:', parsedData);
            questions = generateQuestions(parsedData);

            if (questions.length > 0) {
                initializeQuestions();
            } else {
                console.error("❌ 問題が生成されませんでした");
            }
        } catch (error) {
            console.error('❌ CSV 読み込みエラー:', error);
        }
    }

    function parseCSV(csvText) {
        console.log('📌 parseCSV() 実行');

        // ✅ 改行コードを統一
        csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // ✅ CSV をパース
        let parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        // ✅ カラム名のデバッグ（\ufeff やスペースを削除）
        parsed.meta.fields = parsed.meta.fields.map(f => f.trim().replace(/\ufeff/g, ""));
        console.log("📌 修正後のCSVカラム名:", parsed.meta.fields);

        console.log("📌 パース結果の生データ:", parsed.data);
        
        // ✅ パース時のエラーをチェック
        if (parsed.errors.length > 0) {
            console.error("❌ CSV パースエラー:", parsed.errors);
        }

        let result = [];
        parsed.data.forEach(row => {
            // 各データが正しく取得できているかチェック
            console.log("📌 解析中の行:", row);
            console.log("📌 行のキー:", Object.keys(row));  // ← 追加

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
        console.log("📌 generateQuestions() の入力データ:", data);  // ← 追加

        data.forEach(entry => {
            console.log("📌 現在処理中のエントリ:", entry);  // ← 追加

            let relatedEntries = data.filter(q => q.groupId === entry.groupId && q.id !== entry.id);
            let isTrueFalse = Math.random() < 0.5;

            if (isTrueFalse) {
                let isTrue = Math.random() < 0.5;
                let questionText, correctAnswer;

                if (isTrue || relatedEntries.length === 0) {
                    questionText = `${entry.都市計画名} は ${entry.建築家} が ${entry.特徴1}`;
                    correctAnswer = true;
                } else {
                    let wrongEntry = relatedEntries[Math.floor(Math.random() * relatedEntries.length)];
                    questionText = `${entry.都市計画名} は ${wrongEntry.建築家} が ${entry.特徴1}`;
                    correctAnswer = false;
                }

                questionsList.push({
                    type: "truefalse",
                    question: questionText,
                    correct: correctAnswer
                });
            }
        });

        console.log("📌 最終的な問題リスト:", questionsList);  // ← 追加
        return questionsList;
    }

    document.getElementById("start-button").addEventListener("click", () => {
        console.log('📌 スタートボタンが押されました');
        loadCSV();
    });
});
