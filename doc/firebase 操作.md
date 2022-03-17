# Firebase Web ver.9 SDK 範例

[官方文件](https://firebase.google.com/docs/database/web/read-and-write#web-version-9)

## 初始引入
```
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue, get, child } = require("firebase/database"); // SDK 模組化引用
const firebaseConfig = config.firebaseConfig; // 密鑰
const firebase = initializeApp(firebaseConfig);
const db = getDatabase(firebase);
```


## 監聽(onValue) db 資料
```
// 參數 path/路徑
function db_watch_data(path) {
  const starCountRef = ref(db, path);
  onValue(starCountRef, (snapshot) => {
    const data = snapshot.val();
    // return data; // 此行無作用，此處的資料無法被外處取得，操作必須在這個 function 內完成
  });
}
```
## 監聽(onValue) db 資料，一次性
```
function db_watch_once_data(path) {
  return onValue(ref(db, path), (snapshot) => {
    const data = snapshot.val();
  }, {
    onlyOnce: true
  });
}
```


## 覆蓋式寫入(set) db 資料
```
// 參數 path/路徑 、 data/要寫入的資料
function db_set_data(path, data) {
  set(ref(db, path), data);
}
```

## 讀取(一次性) db 資料
目前無法正常啟動
```
/node_modules/@firebase/database/dist/index.node.cjs.js:2999
    if (path.pieceNum_ >= path.pieces_.length) {
             ^
```
`TypeError: Cannot read property 'pieceNum_' of undefined`
```
// 參數 path/路徑
function db_get_data(path) {
  get(child(db, path)).then((snapshot) => {
    return snapshot.val();
    // if (snapshot.exists()) {
    //   console.log(snapshot.val());
    // } else {
    //   console.log("No data available");
    // }
  }).catch((error) => {
    console.error(error);
  });
}
```