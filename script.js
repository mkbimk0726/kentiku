function parseCSV(csvText) {
    console.log('📌 parseCSV() が実行されました');

    // 🔹 取得したCSVの改行コードを確認するために先頭100文字をログ出力
    console.log('📌 CSV の先頭100文字:', csvText.slice(0, 100));

    // 🔹 すべての改行コードを `\n` に統一（Windowsの `\r\n` も修正）
    csvText = csvText.replace(/\r/g, "\n");

    // 🔹 もし改行がすべて `\n` に変換されているはずなのに行が1つしかない場合、強制的に修正
    if (!csvText.includes("\n")) {
        console.error("❌ CSVの改行が消えています！データを修正します。");
        csvText = csvText.replace(/ 1,/g, "\n1,"); // 1行目のデータを起点に強制改行
    }

    // 🔹 行ごとに分割
    const lines = csvText.trim().split("\n");
    console.log('📌 CSV の行数:', lines.length);

    if (lines.length < 2) {
        console.error('❌ CSV にデータがありません');
        return [];
    }

    const result = [];
    const headers = lines[0].split(","); // ヘッダー行を取得

    for (let i = 1; i < lines.length; i++) {
        let data = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // カンマを適切に処理
        console.log(`📌 パースされた行 ${i}:`, data);
        
        if (data.length < headers.length) continue; // 空行はスキップ

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
