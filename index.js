const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
const { google } = require("googleapis");

const app = express();
app.listen(process.env.PORT || 1300, () =>
  console.log("SERVER RUNNİNG ON PORT 1300")
);

const Beklet = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

var yymTvTitles = null;
var yymTvTitlesLowercased = null;

var TvModals = null;
var TrendyolPriceİnfoArray = [];
var YymTvArray = [];
var PriceİnfoAsİnteger = null;
var ExcelTvModalİd = null;

function GetYymTvData({ cheerioParser, element }) {
  return {
    title: String(
      cheerioParser(element)
        .find(".showcase-title a")
        .text()
        .replace("''", "")
        .split(" ", 2)
        .join("")
    ),
    price: parseInt(
      cheerioParser(element)
        .find(".showcase-price-new")
        .text()
        .trim()
        .replace(".", "")
        .replace(",00", "")
        .replace(" TL", "")
    ),
  };
}
async function GetYymTv() {
  try {
    console.log("yyc  girdi");
    let yyc_url =
      "https://www.yineyenimarket.com/kategori/revizyonlu-televizyonlar?stoktakiler=1";
    var get_yyc_info = await axios.get(yyc_url);
    const yyc_cheerio = cheerio.load(get_yyc_info.data);
    yyc_cheerio(".showcase-content").each(function (index, element) {
      YymTvArray.push(GetYymTvData({ cheerioParser: yyc_cheerio, element }));
    });
    console.log(YymTvArray);
    console.log("yyc basarili");
  } catch (error) {
    console.log("YYC.COM ÜRÜN BİLGİSİ ÇEKİLEMEDİ ERROR-->", error);
    yycError = "YYC.COM ÜRÜN BİLGİSİ ÇEKİLEMEDİ";
  }
}

app.get("/", (req, res) => {
  res.send("TOOLU ÇALIŞTIRMAK İÇİN URL YE /toolcalistir YAZIN!");
});

app.get("/toolcalistir", async (req, res) => {
  res.send("TOOL ARKAPLANDA ÇALIŞMAYA BAŞLADI!");
  const auth = new google.auth.GoogleAuth({
    keyFile: "phone-app-api-cred.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const spreadsheetId = "198ZEmC98mG40vc_NHcUs0M_9uREL68mjk5RAnolQTyw";
  try {
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "TV Modelleri Unique!D1:D",
    });
    TvModals = getRows.data.values.flat(Infinity);
    console.log(TvModals);
  } catch (error) {
    console.log("getrows err--->", error);
  }
  await GetYymTv();

  for (var i = 0; i <= TvModals.length; ) {
    var yymTvTitles = YymTvArray[i].title;
    var yymTvTitlesLowercased = yymTvTitles.toLowerCase();
    for (var a = 0; a <= TvModals.length; ) {
      if (yymTvTitlesLowercased.includes(TvModals[a])) {
        console.log(yymTvTitlesLowercased, TvModals[a]);
        console.log(true, yymTvTitlesLowercased + " İÇERİYOR " + TvModals[a]);
        console.log(YymTvArray[i].price);
        try {
          googleSheets.spreadsheets.values.update({
            auth,
            spreadsheetId,
            valueInputOption: "USER_ENTERED",
            range: `TV Modelleri Unique!E${a + 1}`,
            resource: {
              values: [[YymTvArray[i].price]],
            },
          });
        } catch (error) {
          console.log(error);
        }
      }
      await Beklet(1500);
      a++;
    }

    i++;
  }
});
