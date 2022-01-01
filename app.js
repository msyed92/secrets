//jshint esversion:6
import bodyParser from "body-parser"
import express from "express"
import ejs from "ejs"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
const saltRounds = 10

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
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (!err) {
                            if (result) {
                                res.render("secrets")
                            } else {
                                res.render("login")
                            }
                        } else {
                            res.send(`Unable to login due to ${err}.`)
                        }
                    })
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
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            const newUser = new User({
                email: req.body.username,
                password: hash
            })
            newUser.save((err) => {
                if (!err) {
                    res.render("secrets")
                } else {
                    res.send(err)
                }
            })
        })


    })


app.listen(process.env.PORT || 3000, function () {
    console.log("server successfly started.")
})