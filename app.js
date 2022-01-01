//jshint esversion:6
import bodyParser from "body-parser"
import express from "express"
import mongoose from "mongoose"
import passport from "passport"
import passportLocalMongoose from "passport-local-mongoose"
import session from "express-session"
import dotenv from "dotenv"
import LocalStrategy from "passport-local"
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
    cookie: { secure: true }
}))
app.use(passport.initialize())
passport.session()

//mongoose connection
const URI = 'mongodb://localhost:27017/userDB'
mongoose.connect(
    URI,
    { useNewUrlParser: true })

//document schema and model
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

//passport users
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", (req, res) => {
    res.render("home")
})

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
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
                passport.authenticate("local")(req, res), () => {
                    console.log(req)
                    res.redirect("/secrets")
                }
            }
        })
    })

app.route("/secrets")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("secrets")
        } else {
            res.redirect("/login")
        }
    })


app.listen(process.env.PORT || 3000, function () {
    console.log("server successfly started.")
})