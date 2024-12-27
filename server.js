const express = require('express')
const methodOverride = require('method-override')
const app = express()
const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb') 
const session = require('express-session');
const passport = require('passport');
const NaverStrategy = require('passport-naver').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt') 

app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method')) 
app.use(session({secret: 'G5gXGAkMZb', resave: false, saveUninitialized: true}));


passport.use(new NaverStrategy({
  clientID: 'yqpW_K1jOFEsdiOFzuab',
  clientSecret: 'G5gXGAkMZb',
  callbackURL: '/auth/naver',
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(passport.initialize())
app.use(session({
  secret: 'dasdlkfjσδκξφηαΑΓφδκ!@#υ×℃−×№»⌉»‱✓ℳ₿௹؋⃀',
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 6 * 60 * 60 * 1000 }
}))

app.use(passport.session()) 

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

// app.post('/login', async (요청, 응답, next) => {
//   passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
//     let result = await db.collection('users').findOne({ username : 입력한아이디})
//     if (!result) {
//       return cb(null, false, { message: '아이디 DB에 없음' })
//     }
  
//     if (await bcrypt.compare(입력한비번, result.password)) {
//       return cb(null, result)
//     } else {
//       return cb(null, false, { message: '비번불일치' });
//     }
//   })) 
//   passport.serializeUser((user, done) => {
//     process.nextTick(() => {
//       done(null, { id: user._id, username: user.username })
//     })
//   })
//   passport.deserializeUser((user, done) => {
//     process.nextTick(() => {
//       return done(null, user)
//     })
//   })
// }) 

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.collection('users').findOne({ username });
      if (!result) {
        return done(null, false, { message: '아이디 DB에 없음' });
      }
      const isMatch = await bcrypt.compare(password, result.password);
      if (!isMatch) {
        return done(null, false, { message: '비번불일치' });
      }
      return done(null, result); // 인증 성공
    } catch (err) {
      return done(err); // 오류 처리
    }
  })
);

// 직렬화 (세션에 저장)
passport.serializeUser((user, done) => {
  done(null, user._id); // 세션에 저장할 사용자 ID
});

// 역직렬화 (세션에서 사용자 정보 복원)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.collection('users').findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', {
  successRedirect: '/', // 인증 성공 시 리다이렉트
  failureRedirect: '/idlogin',    // 인증 실패 시 리다이렉트
  failureFlash: true,           // 실패 메시지 전달
}));

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
      응답.render('list.ejs', { 글목록 : result })
    } else {
      응답.redirect('/login')
    }
  })

  app.get('/write', async (요청, 응답) => {
    if (요청.user){
      let result = await db.collection('posts').find().toArray()
      응답.render('write.ejs')
    } else {
      응답.redirect('/login')
    }
  })

  app.post('/add', async (요청, 응답) => {
    if (요청.user){
      if (요청.body.title == '') {
        응답.send('제목안적었는데')
      } else {
        await db.collection('posts').insertOne({ title : 요청.body.title, content : 요청.body.content })
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

app.delete('/delete', async (요청, 응답) => {
  if (요청.user){
    await db.collection('posts').deleteOne( { _id : new ObjectId(요청.query.docid) } )
    응답.send('삭제완료')
  } else {
    응답.redirect('/login')
  }
})



// 로그인 라우터
app.get('/auth/naver', passport.authenticate('naver'));

// 콜백 라우터
app.get('/auth/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/list' }),
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

app.get('/login', async (요청, 응답)=>{
  응답.render('auth.ejs')
})

app.get('/auth/id', async(요청, 응답) => {
  응답.render('select.ejs')
})

app.get('/signup', async(요청, 응답) => {
  응답.render('signup.ejs')
})

app.post('/signup', async(요청, 응답) => {
  await db.collection('users').insertOne({
    username : 요청.body.username,
    password : await bcrypt.hash(요청.body.password, 10)
  })
  응답.redirect('/')
})

app.get('/idlogin', async(요청, 응답) => {
  응답.render('idlogin.ejs')
})

