const bodyParser = require("body-parser")
const express = require("express")
const mongoose = require("mongoose")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session")
const dotenv = require("dotenv")
const findOrCreate = require("mongoose-findorcreate")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


dotenv.config()

//initialize app, packages and modules
const app = express()
app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

//passport
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())

//mongoose connection
const URI = process.env.DB_STRING
mongoose.connect(
    URI,
    { useNewUrlParser: true })

//document schema and model
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secrets: [{
        type: String
    }]
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("User", userSchema)

//passport users
passport.use(User.createStrategy())
passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user)
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (token, tokenSecret, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user)
        })
    }
))

const facebook = {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://localhost:3000/auth/facebook/secrets",
    enableProof: true
}

passport.use(new FacebookStrategy(facebook,
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user)
        })
    }))

app.route("/")
    .get((req, res) => {
        res.render("home")
    })

app.route('/auth/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }))

app.route('/auth/facebook')
    .get(passport.authenticate('facebook', {
    }))

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
    function (req, res) {
        res.redirect('/secrets')
    })

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
    function (req, res) {
        res.redirect('/secrets');
    })

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const newUser = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(newUser, (err) => {
            if (err) {
                console.log(err)
                res.redirect("/login")
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err)
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route("/secrets")
    .get((req, res) => {
        User.find({ "secret": { $ne: null } }, (err, users) => {
            if (err) {
                console.log(err)
            } else {
                if (users) {
                    let allSecrets = []
                    users.forEach(user => {
                        user.secrets.forEach(secret => {
                            allSecrets.push(secret)
                        })
                    })
                    shuffleArray(allSecrets)
                    res.render("secrets", { allSecrets: allSecrets })
                } else {
                    res.render("secrets")
                }
            }
        })
    })

app.route("/logout")
    .get((req, res) => {
        req.logout()
        res.redirect("/")
    })

app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("submit")
        } else {
            res.redirect("/login")
        }
    })
    .post((req, res) => {
        const submittedSecret = req.body.secret
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                if (user) {
                    user.secrets.push(submittedSecret)
                    user.save()
                    res.redirect("secrets")
                } else {
                    res.redirect("/login")
                }
            }
        })
    })


app.listen(process.env.PORT || 3000, function () {
    console.log("server successfly started.")
})