const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
require("dotenv").config();
app.use(express.json());

// CORSを許可する
app.use(cors());

const PORT = process.env.PORT || 3001;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const GOO_APP_ID = process.env.GOO_APP_ID;

// 表示する文章を取得する。
app.post("/get-news", async (req, res) => {
  const category = req.body.category;

  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        apiKey: NEWS_API_KEY,
        category: category,
        country: "jp",
        pageSize: 50,
      },
    });

    const news = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
    }));

    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving news" });
  }
});

// 表示文章をかなのみの文章に変換する。
app.post("/convert-to-kana", async (req, res) => {
  try {
    let { text } = req.body;

    // 英数字を一時的に置き換える
    const placeholderArray = [];
    let placeholderIndex = 0;
    text = text.replace(/[A-Za-z0-9]/g, (match) => {
      const placeholder = `WZX`;
      placeholderArray.push(match);
      placeholderIndex++;
      return placeholder; // 使用されにくい英字の組み合わせをプレースホルダーに使用
    });

    // gooひらがな化APIにリクエストを送る
    const gooResponse = await axios.post(
      "https://labs.goo.ne.jp/api/hiragana",
      {
        app_id: GOO_APP_ID,
        sentence: text,
        output_type: "hiragana",
      }
    );

    // goo APIからのレスポンスから変換後の文字列を取得
    let convertedText = gooResponse.data.converted.replace(/\s+/g, "");

    // プレースホルダーを元の英数字に戻す
    placeholderArray.forEach((value, index) => {
      convertedText = convertedText.replace(`だぶりゅぜっとえっくす`, value);
    //   convertedText = convertedText.replace(`つき`, value);
    });

    // クライアントに変換後の文字列を送る
    res.json({ convertedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error ひらがな変換失敗" });
  }
});


// サーバーを起動
app.listen(PORT, () => {
  console.log("サーバー起動🚀 http://localhost:" + PORT);
});
