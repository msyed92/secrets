//jshint esversion:6
import bodyParser from "body-parser"
import express from "express"
import ejs from "ejs"
import mongoose from "mongoose"
import encrypt from "mongoose-encryption"
import dotenv from 'dotenv'
dotenv.config()

//initialize app
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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

const secret = process.env.SECRET
userSchema.plugin(encrypt, { secret: secret, encryptedField: ["password"] })

const User = mongoose.model("User", userSchema)

app.get("/", (req, res) => {
    res.render("home")
})

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const loginEmail = req.body.username
        const password = req.body.password
        User.findOne({ email: loginEmail }, (err, user) => {
            if (!err) {
                if (user) {
                    if (password == user.password) {
                        res.render("secrets")
                    } else {
                        res.render("login")
                    }
                } else {
                    res.render("register")
                }
            } else {
                res.send(`Unable to login due to ${err}.`)
            }

        })
    })

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })
        newUser.save((err) => {
            if (!err) {
                res.render("secrets")
            } else {
                res.send(err)
            }
        })

    })


app.listen(process.env.PORT || 3000, function () {
    console.log("server successfly started.")
})