const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./JSON/config.json');

// set firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue, get, child } = require("firebase/database");
const firebaseConfig = config.firebaseConfig;
const firebase = initializeApp(firebaseConfig);
const db = getDatabase(firebase);

//持續執行方法
let nowDoFunction = false;
let DoingCount = 0;
let DoUserID = '';
let DoData = undefined;

// 設定時間
let date = false;

// bot 上線
client.login(config.discord_auth.key);
client.on('ready', () => {
  console.info(`${client.user.tag} login.`);
});

// ------------- firebase 操作 -------------

// 覆蓋 db 資料
// 參數 path/路徑 、 data/要寫入的資料
function db_set_data(path, data) {
  set(ref(db, path), data);
}

const ownerID = [
  {
    id: '317268543626412032', // 我
    username: '阿陰',
    time: '18:00'
  },
  {
    id: '401644473819332613', // 村
    username: 'Saronven',
    time: '17:30'
  },
  {
    id: '339418235604697089', // ㄕㄩ
    username: 'Gealach',
    time: '17:00'
  },
  {
    id: '393032833137901579', // 維
    username: 'shengwei',
    time: '22:00'
  },
  {
    id: '357168893229269023', // 達
    username: 'pogoo',
    time: '18:00'
  }
]

const angry = [];

client.on('message', msg => {
  // 前置判斷
  try{
    if(!msg.guild) return; // 訊息不含有 guild 元素(來自私訊)，不回應
    if(!msg.member.user) return; // user 元素不存在，不回應
    if(msg.member.user.bot) return; // 消息由機器人發送，不回應
  }
  catch(error){
    console.info(error);
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
    // FIXME:
    console.log('user', DoUserID);
    console.log(cmd ,msg.author.id);
    // console.log(msg);

    if (nowDoFunction){
      nowDoFunction(msg);
    }
    switch (cmd) {
      case '社畜柴柴幫幫我': // 設定功能
        try {
          if (DoUserID === '') {
            msg.channel.send('汪嗚～有什麼我能效勞的嗎？');
            DoUserID = msg.author.id;
            nowDoFunction = ShibaHlepMe;
          } else {
            console.log('插話仔', msg.author.id);
            angry.push(msg.author.id);
            msg.channel.send('有其他人正在使用中，請稍等');
          }
        } catch (err) {
          console.info('ShibaHlepMeError', err);
        }
        break;
      case '下班時間': // 查訊下班時間
        console.log('查詢下班時間')
        console.log(ownerID, msg.author.id);
        const targetIndex = ownerID.findIndex( item => {
          return item.id === msg.author.id;
        })
        let alert = ''
        if (targetIndex > -1) {
          getRightTime();
          alert = calcTime(date, formatTargetTime(ownerID[targetIndex].time));
        }else{
          alert = '看起來你還沒有設定下班時間哦'
        }
        msg.reply(alert);
        break;
      case '下班時間列表': // 列表式查看目前的資料
        const embed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('列表')
          // .setURL('https://discord.js.org/')
          .setAuthor('社畜的忠實好朋友 - 社畜柴柴', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
          .setDescription('測試除錯用的啦')
          // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
          .addField('\u200B', '\u200B')
          // .setImage('https://i.imgur.com/wSTFkRM.png')
          // .setTimestamp()
          for(let i in ownerID){
            let item = ownerID[i];
            embed.addField(item.username, item.time, true)
          }
          // .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');
        msg.channel.send(embed);
        break;
      case '現在幾點':
        getRightTime();
        let hour = (date.getUTCHours() + 8 < 10) ? `0${date.getUTCHours()+8}` : date.getUTCHours()+8;
        let minutes = (date.getMinutes() < 10) ? `0${date.getMinutes()}` : date.getMinutes();

        msg.channel.send(`${hour}:${minutes}`);
        break;
      // default: //身份組ID
      //   CheckID(msg, cmd, CheckParty, msg.author.id);
      //   break;
    }
  } catch (err) {
    console.info('OnMessageError', err);
  }

  // 社畜柴柴幫幫我
  function ShibaHlepMe(msg){
    try{
      if (DoUserID === msg.author.id) {
        switch (msg.content) {
          case '設定下班時間':
            nowDoFunction = setGetOffWorkTime;
            const filterList = filterOwnerID();
            if (filterList.length === 0) {
              msg.reply(`好的！請輸入您的下班時間\n（請用二十四小時制，分號請為半形，ex: 18:00)`);
            } else {
              msg.reply(`已存在資料，目前您的下班時間為：${filterList[0].time}。\n若要修改下班時間，請重新輸入\n（請用二十四小時制，分號請為半形，ex: 18:00)`);
            }
            break;
          case '沒事了':
            CloseAllDoingFunction();
            msg.channel.send('OK～那我回去睡搞搞了');
            break;
        }
      } else {
        console.log('插話仔', msg.author.id);
        angry.push(msg.author.id);
        msg.channel.send('有人正找我呢，你憋吵');
      }
    }
    catch(error){
      console.log('ShibaError', error);
    }
  }

  function filterOwnerID(){
    const filterList = ownerID.filter(list => {
      return list.id === msg.author.id
    })
    return filterList
  }

  function setGetOffWorkTime(msg) {
    try {
      switch (DoingCount) {
        case 0:
          DoData = []
          DoData.push(msg.content); // 下班時間
          msg.channel.send(`申請資料如下：\n設定者 <@${msg.author.id}>\n下班時間 - ${DoData[0]}\n\n正確 Y / 錯誤 N`);
          break;
        case 1:
          if (msg.content === 'Y' || msg.content === 'y') {
            msg.channel.send('已確認，輸入資料中...');
            let index = ownerID.findIndex(item => {
              return item.id === msg.author.id
            });
            if (index > -1) {
              ownerID[index] = {
                id: msg.author.id,
                username: msg.author.username,
                time: DoData[0]
              }
            }else{
              ownerID.push({
                id: msg.author.id,
                time: DoData[0]
              })
            }
            msg.channel.send('輸入完畢！');
            CloseAllDoingFunction();
            //與舊資料比對，已有此人資料變進行更新
            // CheckID(msg, null, EditOldUserPower, DoData[0]);
            // GetGas.postUserPower(DoData, function(dataED) {
            //     if (dataED) {
            //         //bot內變數不會更新，手動更新
            //         UserPowerData.unshift({
            //             'userID': DoData[0],
            //             'userName': DoData[1],
            //             'Joins': DoData[2],
            //             'IsAdmin': DoData[3]
            //         });
            //         msg.channel.send('輸入完畢!');
            //     } else {
            //         msg.channel.send('資料輸入失敗，請重新嘗試');
            //     }
            //     CloseAllDoingFunction();
            // });
          } else if (msg.content === 'N' || msg.content === 'n') {
            CloseAllDoingFunction();
            msg.channel.send('已取消操作，請重新下達指令')
          } else {
            DoingCount--;
            msg.channel.send('無法辨識訊息，請輸入Y/N來選擇');
          }
          break;
      }
      if (DoUserID !== '') DoingCount++;
    } catch (err) {
      CloseAllDoingFunction();
      client.channels.fetch(msg.channel.id).then(channel => channel.send('發生意外錯誤，中斷指令行為，請重新下達指令!'))
      console.info('addUserFunctionNowError', err);
    }
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
  function calcTime(now, target) {
    const diff = (timeToString(target) - timeToString(now))
    // 無條件捨去，1000(毫秒) 60(秒) 60(分)
    let hour = Math.trunc(diff / 1000 / 60 / 60);
    let min = Math.trunc(diff / 1000 / 60 - hour * 60);
    return alertText(hour, min);
  }

  function alertText(hour, min) {
    if (hour >= 2) {
      return `社畜還想下班啊！離下班還有 ${hour}小時 ${min}分 呢！`;
    } else if (hour >= 1) {
      return `離下班只剩 ${hour}小時 ${min}分 哦，加油吧社畜！`;
    } else if(hour === 0 && min > 0){
      return `你好像很努力哦，剩下最後的 ${min}分 就下班了呢`
    } else {
      return `社畜你今天已經解脫啦！還是你很想工作啊？想上班我成全你啊`
    }
  }

  function getRightTime(){
    date = new Date();
  }

  function CloseAllDoingFunction(){
    nowDoFunction = false;
    DoingCount = 0;
    DoUserID = '';
    DoData = undefined;
  }

});

