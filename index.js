require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser');
const path = require('path');

const server = express();

const productRouter = require('./routes/ProductRoute');
const brandsRouter = require('./routes/BrandsRoute');
const categoriesRouter = require('./routes/CategoriesRoute');
const usersRouter = require('./routes/UsersRoute');
const authRouter = require('./routes/AuthRoute');
const cartRouter = require('./routes/CartRoute');
const orderRouter = require('./routes/OrderRoute');

const { User } = require('./model/UserModel');
const { isAuth, sanitizeUser, cookieExtractor } = require('./services/common');
const { env } = require('process');

//cookie Extractor 


//JWT options 
const opts = {};
opts.jwtFromRequest = cookieExtractor; //Extracting the JWT frontend token from the cookie
opts.secretOrKey = process.env.JWT_SECRET_KEY;

//---------------middlewares------------------

server.use(express.static(path.resolve(__dirname,'build')));
// server.use(express.static('build'))

//for parsing the cookie from frontend 
server.use(cookieParser());

server.use(express.json()); // to parse req.body

//for accessing the frontend data
server.use(cors({
    exposedHeaders: ['X-Total-Count']
}));

//setting up the session for making session token
server.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: false, // don't save session if unmodified
        saveUninitialized: false, // don't create session until something stored
    })
);



//setting up the passport session
server.use(passport.authenticate('session'));

//Routes
server.use('/products', isAuth(), productRouter.router);//Redirect->productControl
server.use('/brands', isAuth(), brandsRouter.router);//Redirect->BrandControl
server.use('/categories', isAuth(), categoriesRouter.router);//Redirect->CategoryControl
server.use('/users', isAuth(), usersRouter.router);//Redirect->UserControl
server.use('/auth', authRouter.router);//Redirect->AuthControl
server.use('/cart', isAuth(), cartRouter.router);//Redirect->CartControl
server.use('/orders', isAuth(), orderRouter.router);//Redirect->OrderControl
// this line we add to make react router work in case of other routes doesnt match
server.get('*', (req, res) =>
  res.sendFile(path.resolve('build', 'index.html'))
);

// Passport Strategies
passport.use(
    'local',
    new LocalStrategy(
        {usernameField:'email'},
        async function (email, password, done) {
        // by default passport uses username
        try {
            const user = await User.findOne({ email: email }).exec();
            if (!user) {
                //execute when user is not found
                done(null, false,
                    { message: 'invalid credentials' }
                ); // for safety
            }
            crypto.pbkdf2(
                password,
                user.salt,
                310000,
                32,
                'sha256',
                async function (err, hashedPassword) {
                    if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
                        //Password didn't matched
                        return done(null, false, { message: 'invalid credentials' });
                    }
                    const token = jwt.sign(
                        sanitizeUser(user),
                        process.env.JWT_SECRET_KEY
                    );
                    done(null, {id:user.id, role:user.role, token}); //this line call the serialize 
                });
        } catch (err) {
            //handling other network related error
            done(err);
        }
    })
);

//Passprt JWT strategies
passport.use(
    'jwt',
    new JwtStrategy(opts, async function (jwt_payload, done) {
        console.log({ jwt_payload });
          try {
            const user = await User.findById(jwt_payload.id);
            if (user) {
              return done(null, sanitizeUser(user)); // this calls serializer
            } else {
              return done(null, false);
            }
          } catch (err) {
            return done(err, false);
          }
    })
);

// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
    console.log('serialize', user);
    process.nextTick(function () {
        return cb(null, { id: user.id, role: user.role });
    });
});


// this changes session variable req.user when called from authorized request  
passport.deserializeUser(function (user, cb) {
    console.log('de-serialize', user);
    process.nextTick(function () {
        return cb(null, user);
    });
});

//---------------middlewares------------------

//Set up default mongoose connection
async function main() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("database connected");
}

//calling and handling errors of database
main().catch(err => console.log(err));

server.get('/', (req, res) => {
    res.json({ status: 'Success' });
})


server.listen(process.env.PORT, () => {
    console.log("server started at port : " + process.env.PORT);
})