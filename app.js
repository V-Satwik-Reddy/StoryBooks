const express =require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const {engine} = require('express-handlebars');
const path = require('path');
const passport=require('passport');
const session=require('express-session')
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const mongoose = require('mongoose');
dotenv.config({path: './config/config.env'});

require('./config/passport')(passport);

connectDB()

const app = express();

//body parser
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//logging

    app.use(morgan('dev'));


//handlebars helpers
const {formatDate,stripTags,truncate,editIcon,select} = require('./helpers/hbs');

// Handler bars
app.engine('.hbs', engine({helpers:{formatDate,editIcon,truncate,stripTags,select},
  defaultLayout: 'home', extname: '.hbs',
  layoutsDir: path.join(__dirname, 'Front/Design'),
  partialsDir: path.join(__dirname, 'Front/partials')}));

app.set('views', path.join(__dirname, 'Front'));
app.set('view engine', '.hbs');

// session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false, 
  store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60 // Session expires in 24 hours (TTL in seconds)
  })
}));


//passoe middleware
app.use(passport.initialize());
app.use(passport.session());

//set global variable
app.use(function(req,res,next){
    res.locals.user = req.user || null;
    next();
});

//static folder
app.use(express.static(path.join(__dirname,'public')));

// pageTitle
const setPageTitle = require('./middleware/setPageTitle');
app.use(setPageTitle);

//router
app.use('/',require('./routes/index'))
app.use('/auth',require('./routes/auth'))
app.use('/stories',require('./routes/stories'))

const PORT = process.env.PORT || 5000;
app.listen(PORT,console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
