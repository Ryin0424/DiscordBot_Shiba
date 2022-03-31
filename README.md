# Discord bot 社畜柴柴

A discord bot - using Node.js.

~~是一個在群組朋友起鬨下莫名誕生的機器人。~~

![DEMO](https://i.imgur.com/yUzJ1lM.gif)

- 使用技術
  - 原生 JS (Node.js)
  - Firebase RealTime Database
  - Heroku 部屬

- 使用說明(指令)
  - 主要功能
    - 下班/午休
      - 提醒你還有多久才會下班 ~~嗚嗚嗚嗚~~
    - 社畜柴柴幫幫我
      - 設定下班時間
      - 支語警察
        - 檢查頻道中是否有支語入侵
        - 使用者可以幫忙擴充資料庫
  - 娛樂功能
    - 柴運勢
      - 求神問卜
    - 柴猜拳
      - ~~總柴~~社畜柴柴陪你玩猜拳
    - 柴猜數
      - 就是終極密碼
      - 可以自訂規則
      - 有成績紀錄
      - 未來預期把這個功能弄得更完善一點
  - 被動功能
    - 上面提過的支語警察 ~~搭配精美圖片~~
    - ![支語警察](https://i.imgur.com/CdKyIYz.gif)
    - 紀錄頻道訊息刪除
      - ~~因為 MEE6 這個功能要付費，乾脆自幹一個~~



---

如果你也想把社畜柴柴帶回家，記得以下部分要修改哦

- Firsebase Config & Discord token
  - 廢話，不然你要連到哪裡去 QQ

```json
// JSON/config.json example
{
  "firebaseConfig": {
    "apiKey": "Your Firebase API key... blablabla"
  },
  "discord_auth": {
    "key": "Your discord bot key"
  }
}
```

- 下班時間的主機時差 
  - https://github.com/Ryin0424/discordBot_Shiba/blob/develop/bot.js#L290
  - 這邊因為筆者懶得抓時區，所以用暴力解法直接減去差額
  
```js
// 計算下班剩餘時間
  function calcTime(type, now, target) {
    // const diff = (timeToString(target) - timeToString(now));
    const diff = (timeToString(target) - timeToString(now) -28800000); // Heroku 主機時差 (8小時，8*60*60*1000)
    // 無條件捨去，1000(毫秒) 60(秒) 60(分)
    let hour = Math.trunc(diff / 1000 / 60 / 60);
    let min = Math.trunc(diff / 1000 / 60 - hour * 60);
    return alertText(type, hour, min);
  }
```

- 不追蹤刪除紀錄的頻道
  - https://github.com/Ryin0424/discordBot_Shiba/blob/develop/bot.js#L722
  - 此處的 `channel.id` 為筆者所在伺服器的頻道 id，如果也有不想要追蹤刪除紀錄的頻道，此處可以修改為自己的 `channel.id`
  - ~~不改這邊也不會出什麼問題就是了~~

```js
//抓刪 刪除事件
client.on('messageDelete', function (msg) {
  if (!msg.guild) return; //只要是來自群組的訊息
  if (msg.channel.id === "958259041182814268") return; // 不紀錄刪除頻道內的刪除事件
  try {
    const avatarURL = "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".jpeg" ;
    const embed = new Discord.MessageEmbed()
      .setColor('#ad0000')
      .setTitle(`📝  <@${msg.author.id}> 執行了刪除事件`)
      .setAuthor(`${msg.author.username}#${msg.author.discriminator}`, avatarURL, avatarURL)
      .setThumbnail(avatarURL)
      .addField('[刪除頻道]', '`' + msg.channel.name + '`', true)
      .addField('[刪除內容]', msg.content)
      .setTimestamp()

    client.channels.cache.get("958259041182814268").send(embed); // 刪除紀錄頻道
  } catch (error) {
    // catchError("紀錄刪除（messageDelete） Error", error);
    console.error("紀錄刪除（messageDelete） Error", error);
  }
});
```

---

## 特別銘謝

it邦幫忙 微笑 (lion31lion31) 撰寫的
[用Node.js製作後台零負擔的DiscordBot](https://ithelp.ithome.com.tw/users/20126642/ironman/2992)

給了非常大的幫助及方向！

但是文中的 discord.js 離目前版本已經有段差距，也想跟著實作的小夥伴，記得要注意套件版本！
