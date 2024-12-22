const express = require('express')
const app = express()

app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.use(express.static(__dirname + '/public'));

app.get('/', (요청, 응답) => {
  응답.redirect('/home')
}) 

app.get('/home', (요청, 응답) => {
    응답.sendFile(__dirname + '/index.html')
  }) 