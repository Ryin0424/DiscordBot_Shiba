const date = new Date();

function formatTargetTime(str) {
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
  } else {
    return `你好像很努力哦，剩下最後的 ${min}分 就下班了呢`
  }
}

console.log(calcTime(date, formatTargetTime('10:00')));