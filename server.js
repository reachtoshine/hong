const express = require('express')
const app = express()
const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb') 

app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(express.static(__dirname + '/public'));

let db
const url = 'mongodb+srv://reachtoshine:Ov79bA0M9DU8YQq8@cluster0.lvgghli.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('hong')
}).catch((err)=>{
  console.log(err)
})

app.listen(8080, () => {
  console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/', (요청, 응답) => {
  응답.redirect('/list')
}) 

app.get('/signup', (요청, 응답) => {
  응답.send('comming soon!!')
}) 

app.get('/home', (요청, 응답) => {
    응답.redirect("/")
}) 

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('posts').find().toArray()
    console.log(result.length)
    응답.render('list.ejs', { 글목록 : result })

  })

  app.get('/write', async (요청, 응답) => {
    let result = await db.collection('posts').find().toArray()
    응답.render('write.ejs')
  })

  app.post('/add', async (요청, 응답) => {
    if (요청.body.title == '') {
      응답.send('제목안적었는데')
    } else {
      await db.collection('posts').insertOne({ title : 요청.body.title, content : 요청.body.content })
      응답.redirect('/list') 
    }
    
  })

  app.get('/detail/:id', async (요청, 응답)=>{
    console.log(요청.params.id)
    let result = await db.collection('posts').findOne({_id : new ObjectId(요청.params.id)})
    응답.render('detail.ejs', {result : result})
})

