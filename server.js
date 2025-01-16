const express = require('express')
const methodOverride = require('method-override')
const app = express()
const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb') 
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt') 
const { name } = require('ejs')
                 require('dotenv').config() 

app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method')) 
app.use(passport.initialize())
app.use(session({
  secret: process.env.Session_Secret,
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : process.env.CookieAge }
}))
app.use(passport.session())
app.use(passport.authenticate('session'))
let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('hong')
}).catch((err)=>{
  console.log(err)
})

app.listen(8080, () => {
  console.log('http://localhost:8080 에서 서버 실행중')
})

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('users').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: 'ID 또는 비밀번호가 일치하지 않습니다.' })
  }

  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: 'ID 또는 비밀번호가 일치하지 않습니다.' });
  }
})) 
passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username, name : user.name})
  })
})
passport.deserializeUser((user, done) => {
    return done(null, user)
})

app.post('/login', async (요청, 응답, next) => {

  passport.authenticate('local', (error, user, info) => {
      if (error) return 응답.status(500).json(error)
      if (!user) return 응답.status(401).json(info.message)
      요청.logIn(user, (err) => {
        if (err) return next(err)
        응답.redirect('/')
      })
  })(요청, 응답, next)

}) 

app.get('/', (요청, 응답) => {
  if (요청.user){
    응답.redirect('/list')
  } else {
    응답.redirect('/login')
  }

}) 

app.get('/home', (요청, 응답) => {
    응답.redirect("/")
}) 

app.get('/list', async (요청, 응답) => {
    if (요청.user){
      let result = await db.collection('posts').find().toArray()
      응답.render('list.ejs', { 글목록 : result, 요청 : 요청 })
    } else {
      응답.redirect('/login')
    }
  })

  app.get('/write', async (요청, 응답) => {
    if (!요청.user){
      응답.redirect('/login')
    } else {
      응답.render('write.ejs')
    }
  })

  app.post('/add', async (요청, 응답) => {
    if (요청.user){
      if (요청.body.title == '') {
        응답.send('제목안적었는데')
      } else {
        console.log(요청.user)
        await db.collection('posts').insertOne({ 
          title : 요청.body.title, 
          content : 요청.body.content,
          name : 요청.user.name,
          userid : 요청.user.id })
        응답.redirect('/list') 
      }
    } else {
      응답.redirect('/login')
    }
    
  })

  app.get('/detail/:id', async (요청, 응답)=>{
    if (요청.user){
      let result = await db.collection('posts').findOne({_id : new ObjectId(요청.params.id)})
      응답.render('detail.ejs', {result : result})
    } else {
      응답.redirect('/login')
    }
})

app.get('/edit/:id', async (요청, 응답) => {
  if (요청.user){
    let result = await db.collection('posts').findOne({_id : new ObjectId(요청.params.id)})
    응답.render('edit.ejs', {result : result})
  } else {
    응답.redirect('/login')
  }
})

app.put('/edit', async (요청, 응답)=>{
  if (요청.user){
    await db.collection('posts').updateOne({ _id : new ObjectId(요청.body.id) },
    {$set : { title : 요청.body.title, content : 요청.body.content }
  })
  응답.redirect('/list')
  } else {
    응답.redirect('/login')
  }
}) 

app.delete('/delete', async (요청, 응답)=>{
  try{
    await db.collection('posts').deleteOne({ 
      _id : new ObjectId(요청.query.docid),
      // userid : 요청.user._id
    })
    응답.send('삭제완료')
  } catch(e) {
    console.error(e)
  }
}) 

app.get('/login', async (요청, 응답)=>{
  응답.redirect("/idlogin")
})

app.get('/signup', async(요청, 응답) => {
  응답.render('signup.ejs')
})

app.post('/signup', async(요청, 응답) => {
  if (요청.body.password == 요청.body.repw) {
    await db.collection('users').insertOne({
      username : 요청.body.username,
      password : await bcrypt.hash(요청.body.password, 10),
      name : 요청.body.name
    })
    응답.redirect('/')
  } else {
    응답.send("입력한 비밀번호와 확인비밀번호가 일치하지 않습니다. 다시 시도하려면 브라우저에서 뒤로가기 버튼을 눌러주세요.")
  }
})

app.get('/idlogin', async(요청, 응답) => {
  응답.render('idlogin.ejs')
})