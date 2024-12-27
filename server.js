const express = require('express')
const methodOverride = require('method-override')
const app = express()
const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb') 
const session = require('express-session');
const passport = require('passport');
const NaverStrategy = require('passport-naver').Strategy;

app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method')) 
app.use(session({secret: 'G5gXGAkMZb', resave: false, saveUninitialized: true}));


passport.use(new NaverStrategy({
  clientID: 'yqpW_K1jOFEsdiOFzuab',
  clientSecret: 'G5gXGAkMZb',
  callbackURL: '/login/naver',
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

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
    let result = await db.collection('posts').findOne({_id : new ObjectId(요청.params.id)})
    응답.render('detail.ejs', {result : result})
})

app.get('/edit/:id', async (요청, 응답) => {
  let result = await db.collection('posts').findOne({_id : new ObjectId(요청.params.id)})
  응답.render('edit.ejs', {result : result})
})

app.put('/edit', async (요청, 응답)=>{
  await db.collection('posts').updateOne({ _id : new ObjectId(요청.body.id) },
    {$set : { title : 요청.body.title, content : 요청.body.content }
  })
  응답.redirect('/list')
}) 

app.delete('/delete', async (요청, 응답) => {
  let result = await db.collection('posts').deleteOne( { _id : new ObjectId(요청.query.docid) } )
  응답.send('삭제완료')
})


// 로그인 라우터
app.get('/auth/naver', passport.authenticate('naver'));

// 콜백 라우터
app.get('/auth/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/' }),
  (req, res) => {
    // 성공적으로 로그인한 후
    res.redirect('/profile');
  }
);

// 프로필 페이지
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.json(req.user);
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});
