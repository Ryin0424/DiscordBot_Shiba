const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./JSON/config.json');


// set firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue, get, child } = require("firebase/database");
const firebase = initializeApp(config.firebaseConfig);
const db = getDatabase(firebase);
//持續執行方法
let nowDoFunction = false;
let DoingCount = 0;
let DoUserID = '';
let DoData = undefined;
let DoingChannel = '';

// 設定時間
let date = false;
// 設定 DC code 字符串
let codeArea = '```';

// bot 上線
client.login(config.discord_auth.key);
client.on('ready', () => {
  console.info(`${client.user.tag} login.`);
});

// ------------- firebase 操作 -------------

// 覆蓋 db 資料
// 參數 path/路徑 、 data/要寫入的資料
async function db_set_data(path, data) {
  await set(ref(db, path), data);
}
const angry = [];

client.on('message', msg => {
  // 前置判斷
  try{
    if(!msg.guild) return; // 訊息不含有 guild 元素(來自私訊)，不回應
    if(!msg.member.user) return; // user 元素不存在，不回應
    if(msg.member.user.bot) return; // 消息由機器人發送，不回應
  }
  catch(error){
    console.error('前置判斷 Error',error);
    return;
  }

  //續行方法
  if (nowDoFunction && msg.author.id === DoUserID) {
    nowDoFunction(msg);
    return;
  }
  // 訊息字串分析
  try {
    const cmd = msg.content;

    if (nowDoFunction){
      nowDoFunction(msg);
    }
    switch (cmd) {
      case '社畜柴柴幫幫我': // 設定功能
          try {
            if (DoUserID === '') {
              msg.channel.send('汪嗚～有什麼我能效勞的嗎？');
              DoUserID = msg.author.id;
              DoingChannel = msg.channel.id; // 確認目前作用頻道
              nowDoFunction = ShibaHlepMe;
            } else {
              // 紀錄插話仔
              recordInterruption(msg, '有人正找我呢，你憋吵');
            }
          } catch (err) {
            console.error('社畜柴柴幫幫我(ShibaHlepMe) Error', err);
          }
          break;
      case '下班時間': // 查詢 距離下班剩餘時間
          offDuty();
          break;
      case '下班': // 查詢 距離下班剩餘時間
          offDuty();
          break;
      case '午休': // 查詢 距離午休剩餘時間
          getRightTime();
          msg.reply(calcTime('午休', date, formatTargetTime('12:00')));
          break;
      case '指令': // 查詢 指令列表
          shibaCanDo();
          break;
      case '柴時間': // 查詢 機器時間
          getRightTime();
          msg.channel.send(`柴柴本地時間：${showTime(date.getHours())}:${showTime(date.getMinutes())}`);
          msg.channel.send(`台灣時間：${showTime(date.getHours()+8)}:${showTime(date.getMinutes())}`); // Heroku 主機時差
          break;
      // 娛樂功能 ------
      case '柴運勢':
          Omikuji(msg);
          break;
      case '柴猜拳':
          nowDoFunction = doMora;
          DoUserID = msg.author.id;
          DoingChannel = msg.channel.id; // 確認目前作用頻道
          msg.reply('一決勝負吧！');
          break;
      case '柴猜數':
          nowDoFunction = ultimatePassword;
          DoUserID = msg.author.id; // 鎖定一人參與
          DoingChannel = msg.channel.id; // 確認目前作用頻道
          msg.channel.send(`${codeArea}密碼範圍：1 ~ 100 \n回答次數：5 次以內${codeArea}本柴已經決定好密碼了，來吧！\n\n如需變更範圍及次數，請輸入「變更規則」`);
          break;
      case '柴成績':
          msg.channel.send("正在取得個人成績紀錄...");
          getMyAchievement(msg);
          break;
      // default: //身份組ID
      //   CheckID(msg, cmd, CheckParty, msg.author.id);
      //   break;
    }

    // 支語警察
    chinaPolice(cmd);

  } catch (err) {
    console.error('輸入訊息(OnMessage) Error', err);
  }

  // 查詢下班時間
  function offDuty(){
    return onValue(ref(db, 'off-duty-time'), (snapshot) => {
      const offDutyList = snapshot.val();
      let alert = ''
      const targetIndex = offDutyList.findIndex(item => {
        return item.id === msg.author.id;
      })
      if (targetIndex > -1) {
        getRightTime();
        alert = calcTime('下班', date, formatTargetTime(offDutyList[targetIndex].time));
      } else {
        alert = '看起來你還沒有設定下班時間哦'
      }
      msg.reply(alert);
    }, {
      onlyOnce: true
    });
  }

  // 指令提示
  function shibaCanDo(){
    const embed1 = new Discord.MessageEmbed()
      .setColor('#F48B16')
      .setTitle('設定相關，請先輸入「社畜柴柴幫幫我」')
      .addField('設定下班時間', '設定/修改時間')
      .addField('支語舉報', '提防支語入侵，人人有責')
      .addField('沒事了', '結束設定')
    const embed2 = new Discord.MessageEmbed()
      .setColor('#9EC2E5')
      .setTitle('查詢相關，可直接輸入下列指令')
      .addField('下班/下班時間', '查詢距離下班剩餘時間')
      .addField('午休', '查詢距離午休剩餘時間')
    const embed3 = new Discord.MessageEmbed()
      .setColor('#6dca1c')
      .setTitle('娛樂相關，可直接輸入下列指令')
      .addField('柴運勢', '每日運勢')
      .addField('柴猜拳', '猜拳勝負')
      .addField('柴猜數', '終極密碼拆炸彈')
    msg.channel.send(' **社畜的忠實好朋友** - `社畜柴柴` ');
    msg.channel.send(embed1);
    msg.channel.send(embed2);
    msg.channel.send(embed3);
  }

  // 社畜柴柴幫幫我
  function ShibaHlepMe(msg){
    try{
      if (DoUserID === msg.author.id && DoingChannel === msg.channel.id) {
        switch (msg.content) {
          case '設定下班時間':
            nowDoFunction = setGetOffWorkTime;
            return onValue(ref(db, 'off-duty-time'), (snapshot) => {
              const offDutyList = snapshot.val();
              let target = offDutyList.find(user => user.id === DoUserID)
              if(target !== undefined) {
                msg.reply(`已存在資料，目前您的下班時間為：**${target.time}**。\n若要修改下班時間，請重新輸入\n（請用二十四小時制，分號請為半形，ex: 18:00)`);
              }else{
                msg.reply(`好的！請輸入您的下班時間\n（請用二十四小時制，分號請為半形，ex: 18:00)`);
              }
            }, {
              onlyOnce: true
            });
            break;
          case '支語舉報':
            nowDoFunction = reportChinaWord;
            msg.reply(`請輸入您要舉報的支語詞彙（單個）`);
            break;
          case '你能做什麼':
            CloseAllDoingFunction();
            shibaCanDo();
            break;
          case '沒事了':
            CloseAllDoingFunction();
            msg.channel.send('OK～那我回去睡搞搞了');
            break;
        }
      } else if (DoingChannel !== msg.channel.id) {
        // do nothing
      } else {
        // 記錄插話仔
        recordInterruption(msg, '有人正找我呢，你憋吵');
      }
    }
    catch(error){
      console.error('社畜柴柴幫幫我(At Shiba) Error', error);
    }
  }

  // 設定下班時間
  function setGetOffWorkTime(msg) {
    try {
      switch (DoingCount) {
        case 0:
          DoData = []
          DoData.push(msg.content); // 下班時間
          DoData.push(msg.author.username);
          msg.channel.send(`申請資料如下：\n> 設定者  \n> 下班時間 - **${DoData[0]}**\n\n正確 Y / 錯誤 N`);
          break;
        case 1:
          if (msg.content === 'Y' || msg.content === 'y') {
            msg.channel.send('已確認，資料輸入中...');
            return onValue(ref(db, 'off-duty-time'), (snapshot) => {
              const offDutyList = snapshot.val();
              for (let i in offDutyList){
                if (offDutyList[i].id === DoUserID) {
                  offDutyList[i].time = DoData[0];
                } else {
                  offDutyList.push({
                    id: msg.author.id,
                    time: DoData[0],
                    username: DoData[1],
                  })
                }
              }
              // 執行寫入
              db_set_data('off-duty-time' ,offDutyList);
              msg.channel.send('輸入完畢！');
              CloseAllDoingFunction();
            }, {
              onlyOnce: true
            });
          } else if (msg.content === 'N' || msg.content === 'n') {
            CloseAllDoingFunction();
            msg.channel.send('已取消操作，請重新下達指令')
            break;
          } else {
            DoingCount--;
            msg.channel.send('無法辨識訊息，請輸入Y/N來選擇');
            break;
          }
          break;
      }
      if (DoUserID !== '') DoingCount++;
    } catch (err) {
      CloseAllDoingFunction();
      client.channels.fetch(msg.channel.id).then(channel => channel.send('發生意外錯誤，中斷指令行為，請重新下達指令!'))
      console.error('設定下班時間(setGetOffWorkTime) Error', err);
    }
  }

  function showTime(item){
    return (item < 10) ? `0${item}` : item;
  }

  // 將輸入的訊息(下班時間)還原成系統能分析的格式 (ex: 2022-02-22 22:22)
  function formatTargetTime(str) {
    getRightTime();
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${str}`
  }

  function timeToString(time) {
    return (Date.parse(time)).valueOf();
  }

  // 計算下班剩餘時間
  function calcTime(type, now, target) {
    // const diff = (timeToString(target) - timeToString(now));
    const diff = (timeToString(target) - timeToString(now) -28800000); // Heroku 主機時差 (8小時，8*60*60*1000)
    // 無條件捨去，1000(毫秒) 60(秒) 60(分)
    let hour = Math.trunc(diff / 1000 / 60 / 60);
    let min = Math.trunc(diff / 1000 / 60 - hour * 60);
    return alertText(type, hour, min);
  }

  function alertText(type, hour, min) {
    switch (type) {
      case '午休':
        if (hour >= 1) {
          return `離午休還有 ${hour}小時 ${min}分 呢！484太早問了啊？`;
        } else if (hour === 0 && min > 0) {
          return `同志，離午休只差 ${hour}小時 ${min}分 ，再堅持一下！`;
        } else if (hour <= -1) {
          return `午休已經過啦，醒醒面對工作吧社畜！`
        } else {
          return `已經在午休了不是？當本柴不用午休的嗎？`
        }
        break;
      case '下班':
        if (hour >= 2) {
          return `社畜還想下班啊！離下班還有 ${hour}小時 ${min}分 呢！`;
        } else if (hour >= 1) {
          return `離下班只剩 ${hour}小時 ${min}分 哦，加油吧社畜！`;
        } else if (hour === 0 && min > 0) {
          return `你好像很努力哦，剩下最後的 ${min}分 就下班了呢`
        } else {
          return `社畜你今天已經解脫啦！還是你很想工作？這麼想上班我可以成全你啊`
        }
        break;
    }
  }

  function getRightTime(){
    date = new Date();
  }

  // 支語警察
  function chinaPolice(cmd){
    return onValue(ref(db, 'china-police'), (snapshot) => {
      const chinaWord = snapshot.val();
      let police = chinaWord.find(word => cmd.indexOf(word) > -1)
      if (police !== undefined) msg.reply(`https://ect.incognitas.net/szh_police/${getRandom(10000)}.jpg \n支語警告`)
      // msg.reply(alert);
    }, {
      onlyOnce: true
    });
  }
  // 提供支語庫，國家會感謝你的
  function reportChinaWord(msg) {
    try {
      switch (DoingCount) {
        case 0:
          DoData = []
          DoData.push(msg.content)
          msg.channel.send(`檢舉資料如下：\n > 設定者  \n> 舉報詞彙 - **${DoData[0]}**\n\n正確 Y / 錯誤 N`);
          break;
        case 1:
          if (msg.content === 'Y' || msg.content === 'y') {
            msg.channel.send('已確認，資料輸入中...');
            return onValue(ref(db, 'china-police'), (snapshot) => {
              const chinaWord = snapshot.val();
              if(chinaWord === null || chinaWord === undefined){
                chinaWord = []
              }
              chinaWord.push(DoData[0])
              // 執行寫入
              db_set_data('china-police', chinaWord);
              msg.channel.send('輸入完畢！');
              CloseAllDoingFunction();
            }, {
              onlyOnce: true
            });
          } else if (msg.content === 'N' || msg.content === 'n') {
            CloseAllDoingFunction();
            msg.channel.send('已取消操作，請重新下達指令');
            break;
          } else {
            DoingCount--;
            msg.channel.send('無法辨識訊息，請輸入Y/N來選擇');
            break;
          }
          break;
      }
      if (DoUserID !== '') DoingCount++;
    } catch (err) {
      CloseAllDoingFunction();
      client.channels.fetch(msg.channel.id).then(channel => channel.send('發生意外錯誤，中斷指令行為，請重新下達指令!'))
      console.error('支語舉報(reportChinaWord) Error', err);
    }
  }

  // 取得亂數
  // example: x = 3，則得到 0~3(不含3)之間的亂數 (0.1.2)
  function getRandom(x) {
    return Math.floor(Math.random() * x);
  }
  // example: min = 0, max = 3，則得到 0~3之間的亂數 (0.1.2.3)
  function getRangeRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // 柴運勢
  function Omikuji(msg) {
    const fortune = ['大吉', '大兇', '中吉', '中兇', '小吉', '小兇', '末吉', '沒吉', '沒兇', '吉', '兇', '柴曰：不可說', '施主這個問題你還是別深究了吧', '超吉', '究吉', '兇貴'];
    let answer = fortune[getRandom(fortune.length)];
    let flag1 = "　　   ○ ＿＿＿＿";
    let flag2 = "　　   ∥　　　　|";
    let flag3 = "　　   ∥ 看上面 |";
    let flag4 = "　　   ∥￣￣￣￣";
    let cat1 = "　 ∧＿∧";
    let cat2 = "　(`･ω･∥";
    let cat3 = "　丶　つ０";
    let cat4 = "　 しーＪ";
    if(answer.length === 1){
      flag3 = `　　   ∥   ${answer}  |`;
    } else if (answer.length === 2) {
      flag3 = `　　   ∥  ${answer} |`;
    }
    let text = (answer.length > 2) ? answer : '';
    msg.reply(`${text}${codeArea}
    ${flag1}
    ${flag2}
    ${flag3}
    ${flag2}
    ${flag4}
    ${cat1}
    ${cat2}
    ${cat3}
    ${cat4}${codeArea}`)
  }

  // 柴猜拳
  function doMora(msg) {
    if (msg.author.id === DoUserID && msg.channel.id === DoingChannel) {
      const mora = ['剪刀', '石頭', '布'];
      const botMora = mora[getRandom(3)];
      try {
        switch (DoingCount) {
          case 0:
            if (msg.content !== '剪刀' && msg.content !== '石頭' && msg.content !== '布'){
              msg.channel.send(`欸，我看不懂你在出什麼啦～`)
              DoingCount --;
            }else{
              msg.channel.send(`我出「${botMora}」！`)
              if (botMora === msg.content){
                msg.channel.send(`哎呀，看來我們不分勝負呢～`);
                msg.channel.send(`再來！`);
                DoingCount --;
              } else { // 分出勝負
                moraWinner(botMora, msg.content);
              }
            }
            break;
        }
        if (DoUserID !== '') DoingCount++;
      } catch (err) {
        CloseAllDoingFunction();
        client.channels.fetch(msg.channel.id).then(channel => channel.send('發生意外錯誤，中斷指令行為，請重新下達指令!'))
        console.error('柴猜拳(doMora) Error', err);
      }
    } else if (DoingChannel !== msg.channel.id) {
      // do nothing
    } else {
      recordInterruption(msg, `請不要打擾我跟<@${DoUserID}>的決鬥`);
    }
  }

  // 判斷猜拳勝負
  function moraWinner(bot, player){
    switch (player){
      case '剪刀':
          if(bot === '布'){
            msg.channel.send(`汪嗚～居然是${player}，我輸啦！`);
            break;
          } else{
            msg.channel.send(`勝敗乃兵家常事，大俠請重新來過`);
            break;
          }
          break;
      case '石頭':
          if (bot === '剪刀') {
            msg.channel.send(`汪嗚～居然是${player}，我輸啦！`);
            break;
          } else {
            msg.channel.send(`勝敗乃兵家常事，大俠請重新來過`);
            break;
          }
          break;
      case '布':
          if (bot === '石頭') {
            msg.channel.send(`汪嗚～居然是${player}，我輸啦！`);
            break;
          } else {
            msg.channel.send(`勝敗乃兵家常事，大俠請重新來過`);
            break;
          }
          break;
    }
    CloseAllDoingFunction();
  }


  // 終極密碼功能
  let PasswordMin = 1;
  let PasswordMax = 100;
  let AnswerLimited = 5;
  let ultimatePasswordKey = "";
  function ultimatePassword(msg) {
    if (msg.author.id === DoUserID && msg.channel.id === DoingChannel){
      if (msg.content === '變更規則') {
        nowDoFunction = changePasswordRole;
        msg.channel.send(`請輸入新的數字範圍及回答次數，並以「/」分開\n(ex: 範圍為 **10~500**，回答限制 **20** 次內，則輸入「10~500/20」)`);
      } else {
        ultimatePasswordKey = getRangeRandom(PasswordMin + 1, PasswordMax - 1);
        doPassword(msg);
        if (DoUserID !== '') {
          nowDoFunction = doPassword;
        }
      }
    } else if (DoingChannel !== msg.channel.id) {
      // do nothing
    } else {
      recordInterruption(msg, '安靜，有人正要開始拆彈呢');
    }
  }

  // 終極密碼遊戲開始
  function doPassword(msg){
    if (msg.author.id === DoUserID && msg.channel.id === DoingChannel) {
      AnswerLimited --;
      try {
        if (isNaN(Number(msg.content))){
          msg.channel.send(`你好歹也輸入數字吧...難道你是猴子嗎？`);
          AnswerLimited++;
        } else if (Number(msg.content) >= PasswordMax || Number(msg.content)  <= PasswordMin){ // 輸入數字 大於最大 或 小於最小
          msg.channel.send(`喂喂！看清楚範圍啊`);
          AnswerLimited ++;
        } else if (msg.content < ultimatePasswordKey) {
          PasswordMin = Number(msg.content) ;
          msg.channel.send(`${codeArea}密碼範圍：${PasswordMin} ~ ${PasswordMax}${codeArea} 剩餘次數：${AnswerLimited} 次`);
        } else if (msg.content > ultimatePasswordKey) {
          PasswordMax = Number(msg.content) ;
          msg.channel.send(`${codeArea}密碼範圍：${PasswordMin} ~ ${PasswordMax}${codeArea} 剩餘次數：${AnswerLimited} 次`);
        } else if (Number(msg.content) === ultimatePasswordKey){
          getAchievement(DoUserID, "柴猜數", 'win');
          CloseAllDoingFunction();
          AnswerLimited++;
          msg.reply(`恭喜拆彈成功！\nhttps://media.giphy.com/media/fxsqOYnIMEefC/giphy.gif`);
        }
        if (AnswerLimited <= 0) {
          getAchievement(DoUserID, "柴猜數", 'lose');
          CloseAllDoingFunction();
          msg.reply(`砰！次數歸零，拆彈失敗\n正確密碼是：**${ultimatePasswordKey}**\nhttps://c.tenor.com/o7kwCN9_VjEAAAAC/explosion-boom.gif`);
        }
      } catch (err) {
        CloseAllDoingFunction();
        client.channels.fetch(msg.channel.id).then(channel => channel.send('發生意外錯誤，中斷指令行為，請重新下達指令!'))
        console.error('終極密碼(doPassword) Error', err);
      }
    } else if (DoingChannel !== msg.channel.id) {
      // do nothing
    } else if (msg.author.id !== DoUserID && DoingChannel === msg.channel.id) { // 同個頻道但是不是當前使用者
      recordInterruption(msg, `噓，<@${DoUserID}>現在正在經歷拆彈的緊張時刻呢`);
    }
  }
  // 變更終極密碼的規則
  function changePasswordRole(msg) {
    if (msg.author.id === DoUserID && msg.channel.id === DoingChannel) {
      let ary = msg.content.split("/");
      AnswerLimited = ary[1];
      let range = ary[0].split("~");
      PasswordMin = range[0];
      PasswordMax = range[1];
      if (isNaN(Number(PasswordMin)) || isNaN(Number(PasswordMax)) || isNaN(Number(AnswerLimited))) {
        msg.channel.send(`輸入資料有誤，請重新設定`);
      } else if (Number(PasswordMin) === Number(PasswordMax) || Number(PasswordMax) - Number(PasswordMin) === 1) {
        msg.channel.send(`你這樣我沒辦法設定密碼啦～`);
      }else {
        msg.channel.send(`更新規則如下：\n${codeArea}密碼範圍：${PasswordMin} ~ ${PasswordMax} \n回答次數：${AnswerLimited} 次以內${codeArea}本柴已經決定好密碼了，來吧！`);
        ultimatePasswordKey = getRangeRandom(Number(PasswordMin) + 1, Number(PasswordMax) - 1);
        nowDoFunction = doPassword;
      }
    } else if (DoingChannel !== msg.channel.id) {
      // do nothing
    } else {
      recordInterruption(msg, `還在設定中呢，別亂啦～`);
    }
  }

  // 紀錄打岔/插話仔
  function recordInterruption(msg, text){
    return onValue(ref(db, 'angry'), (snapshot) => {
      getRightTime();
      const angry = snapshot.val();
      const today = `${date.getMonth()+1}-${date.getDate()}`
      if(angry === null){
        let newData = {};
        newData[today] = [];
        newData[today].push(msg.author.id);
        db_set_data('angry', newData);
      }else{
        angry[today].push(msg.author.id);
        db_set_data('angry', angry);
      }
      msg.reply(text);
    }, {
      onlyOnce: true
    });
  }

  // 設定/取得人員成就資料
  function getAchievement(authorId, game, result) {
    return onValue(ref(db, 'achievement'), (snapshot) => {
      let achievementData = snapshot.val();
      if (achievementData === null) {
        achievementData = []
        let newMember = {
          id: authorId,
          bombDisposal: {
            win: 0,
            lose: 0
          }
        };
        let newRecord = recordAchievement(newMember, game, result);
        achievementData.push(newRecord);
        db_set_data('achievement', achievementData);
      } else {
        let target = achievementData.find(member => member.id === authorId); // 尋找成就列表中有無資料
        if (target === undefined) { // 尚未建立資料，設定之
          let newMember = {
            id: authorId,
            bombDisposal: {
              win: 0,
              lose: 0
            }
          };
          let newRecord = recordAchievement(newMember, game, result);
          achievementData.push(newRecord);
          db_set_data('achievement', achievementData);
        } else {
          target = recordAchievement(target, game, result);
          db_set_data('achievement', achievementData);
        }
      }
    }, {
      onlyOnce: true
    });
  }

  // 紀錄遊戲的成就分數
  function recordAchievement(member, game, result) {
    switch (game) {
      case '柴猜數':
        if (result === 'win') {
          member.bombDisposal.win = member.bombDisposal.win + 1;
        } else {
          member.bombDisposal.lose = member.bombDisposal.lose + 1;
        }
        break;
    }
    return member;
  }

  // 取得個人成就成績
  function getMyAchievement(msg) {
    return onValue(ref(db, 'achievement'), (snapshot) => {
      let achievementData = snapshot.val();
      let target = achievementData.find(member => member.id === msg.author.id);
      if (target === undefined) {
        msg.channel.send("目前還沒有任何成績紀錄哦");
      } else {
        let all = target.bombDisposal.win + target.bombDisposal.lose;
        let successRate = Math.round(target.bombDisposal.win / all * 10000) / 100 + "%";
        msg.reply(`\n> 柴猜數
> ${codeArea}diff
> +成功：${target.bombDisposal.win}場
> -失敗：${target.bombDisposal.lose}場
> 成功率：${successRate}${codeArea}`);
      }
    }, {
      onlyOnce: true
    });
  }

  // 確認權限
  // userRole 使用者擁有的身份組ID
  // targetRole 確認是否擁有的身份組ID
  function checkRoles(userRole, targetRole){
    return userRole.some((el) => {
      return el === targetRole;
    })
  }

  // 結束所有續行
  function CloseAllDoingFunction(){
    nowDoFunction = false;
    DoingCount = 0;
    DoUserID = '';
    DoingChannelg = '';
    DoData = undefined;
  }

});

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
  } catch (err) {
    console.error("messageDeleteError", err);
  }
});
