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
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');
const mongoose = require('mongoose');
const expressListRoutes = require('express-list-routes');

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
const redisClient = new Redis(process.env.REDIS_URL);

// Configure session middleware with Redis
app.use(session({
  store: new RedisStore({ client: redisClient, ttl: 86400 }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false, // set to true if using HTTPS
      httpOnly: true,
      maxAge: 86400000,
  }
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
app.use('/api/auth',require('./routes/apiauth'))
app.use('/api/dashboard',require('./routes/apidashboard'))
app.use('/api/public',require('./routes/apipublic'))
app.use('/api/stories',require('./routes/apistories'))

app.get('/api',(req,res)=> {
  res.json({message:'Welcome to the API. Refer to the/api/routes for more information about the availabel routes'});
});

app.get('/api/routes', (req, res) => {
  const apiRoutes = [
      { "method": "GET", "path": "/api", "description": "Welcome message for the API", "data_required": "" },
      { "method": "GET", "path": "/api/routes", "description": "Lists all available API routes", "data_required": "" },
      { "method": "GET", "path": "/api/auth/google", "description": "Initiates Google OAuth authentication", "data_required": "" },
      { "method": "GET", "path": "/api/auth/google/callback", "description": "Handles callback from Google OAuth", "data_required": "" },
      { "method": "POST", "path": "/api/auth/signup", "description": "User signup", "data_required": "{ email, password, username }" },
      { "method": "POST", "path": "/api/auth/login", "description": "User login", "data_required": "{ email, password }" },
      { "method": "GET", "path": "/api/auth/logout", "description": "Logs out the user", "data_required": "Auth token (if required)" },
      { "method": "GET", "path": "/api/dashboard/", "description": "Fetches user dashboard data", "data_required": "Auth token" },
      { "method": "GET", "path": "/api/public/", "description": "Fetches publicly available stories", "data_required": "" },
      { "method": "GET", "path": "/api/public/search", "description": "Search stories in public", "data_required": "{ query }" },
      { "method": "POST", "path": "/api/stories/add", "description": "Creates a new story", "data_required": "{ title, content, visibility }" },
      { "method": "GET", "path": "/api/stories/byId/:id", "description": "Fetch a story by ID", "data_required": ":id" },
      { "method": "GET", "path": "/api/stories/edit/:id", "description": "Fetch story details for editing", "data_required": ":id, Auth token" },
      { "method": "DELETE", "path": "/api/stories/:id", "description": "Delete a story by ID", "data_required": ":id, Auth token" },
      { "method": "GET", "path": "/api/stories/user/:userId", "description": "Fetch stories by a user", "data_required": ":userId" },
      { "method": "POST", "path": "/api/stories/like/:id", "description": "Like a story", "data_required": ":id, Auth token" },
      { "method": "POST", "path": "/api/stories/dislike/:id", "description": "Dislike a story", "data_required": ":id, Auth token" },
      { "method": "POST", "path": "/api/stories/comment/:id", "description": "Add a comment to a story", "data_required": ":id, { text }" }
  ];
  res.json({ message: "Available API Routes", routes: apiRoutes });
});




const PORT = process.env.PORT || 5000;
app.listen(PORT,console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
