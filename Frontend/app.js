const express = require("express");
const app = express();
const path = require("path");
const axios = require("axios");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
var pdf = require("pdf-creator-node");
var fs = require("fs");
const { requireAuth } = require("./utils/require-auth");
const { hashPassword } = require("./utils/hash-password");
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()

const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
// secure: true require HTTPS, maxAge in milliseconds
    cookie: {secure: false, maxAge: 3600000} 
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

// ROUTES
app.get("/", (req, res) => {
    res.render("index.html");
});

app.get("/login", (req, res) => {
    res.render("login.html");
});

app.get("/register", (req, res) => {
    res.render("register.html");
});

app.get("/map", (req, res) => {
    res.render("map.html");
});

app.get("/city", (req, res) => {
    res.render("city.html");
});

app.get("/dashboard", requireAuth, (req, res) => {
    MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
        if (err) 
            return res.json({message: "Server Error", error: true});
        
        const db = client.db('MeteoApp');
        const favs = db.collection('favorites');
        const cursor = favs.find({userNickname: req.session.user.nickname});
        const cities = await cursor.toArray();
        
        return res.render("dashboard", {favs: cities.map((el) => el.cityName)});
    });
});

// API

app.get('/logout', (req, res) => {
    if(req.session.user) {
        req.session.destroy();
        return res.render("login.html")
    } else {
        return res.render("index.html");
    }        
});


app.get("/api/getCityWeather/:city", (req, res) => {
    const city = req.params.city;
    axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.API}&lang=it`)
         .then((cityData) => axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${cityData.data.coord.lat}&lon=${cityData.data.coord.lon}&appid=${process.env.API}&units=metric&lang=it`))
         .then((weatherInCity) => res.send(weatherInCity.data))
         .catch((err) => res.json({error: "City Not Found"}));
});

app.get("/api/getPositionWeather/:lat/:lon", (req, res) => {
    const { lat, lon } = req.params;
    axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.API}&units=metric&lang=it`)
         .then((weatherAtCoord) => res.send(weatherAtCoord.data));
});

app.get("/api/loggedIn", (req, res) => {
    if (req.session.user)
        return res.json({loggedIn: true});
    return res.json({loggedIn: false});
});

app.post("/api/addToFavorites", requireAuth, (req, res) => {
    const { name } = req.body;
    MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
        if (err) 
            return res.json({message: "Server Error", error: true});
        
        const db = client.db('MeteoApp');
        const favs = db.collection('favorites');
        
        await favs.insertOne({userNickname: req.session.user.nickname, cityName: name});
        return res.json({message: "Added Successfully", success: true});
    });
});

app.post("/api/removeFromFavorites", requireAuth, (req, res) => {
    const { name } = req.body;
    MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
        if (err) 
            return res.json({message: "Server Error", error: true});
        
        const db = client.db('MeteoApp');
        const favs = db.collection('favorites');
        
        await favs.deleteOne({userNickname: req.session.user.nickname, cityName: name});
        return res.json({message: "Removal Successful", success: true});
    });
});

app.get("/api/isInFavorites", requireAuth, async (req, res) => {
    const name = req.query.name;
    MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
        if (err) 
            return res.json({message: "Server Error", error: true});
        
        const db = client.db('MeteoApp');
        const favs = db.collection('favorites');

        const favCity = await favs.findOne({$and: [{userNickname: req.session.user.nickname}, {cityName: name}]});

        if (favCity)
            return res.json({message: "Exists Already", exists: true});
        else
            return res.json({message: "Doesn't Exist Already", exists: false});
    });
});

app.post("/register", (req, res) => {
    const { nickname, password, confirmPassword } = req.body;

    if (password == confirmPassword) {
        
        MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
            if (err) 
                return res.json({message: "Server Error", error: true});

            const db = client.db('MeteoApp');
            const users = db.collection('users');
            const user = await users.findOne({nickname: nickname});

            // send to register with already existing
            // warning
            if (user)
                return res.json({message: "User with this nickname already exists.", success: false})

            // send to login
            const passHash = hashPassword(password);
            await users.insertOne({nickname: nickname, password: passHash});

            // send to login
            return res.json({message: "Registration Successful", success: true});
        });
    } else {
        return res.json({message: "Passwords do not match", success: false});
    }
});

app.post("/login", (req, res) => {
    const { nickname, password } = req.body;

    if (!nickname)
        return res.json({message: "Insert Nickname"});
    
    if (!password)
        return res.json({message: "Insert Password"});

    MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err, client) => {
        if (err) 
            return res.json({message: "Server Login Error", error: true});

        const db = client.db('MeteoApp');
        const users = db.collection('users');
        const passHash = hashPassword(password);
        const user = await users.findOne({$and: [{nickname: nickname}, {password: passHash}]});

        if (user) {
            req.session.user = user;
            return res.json({message: "Login Successful", success: true});
        } else {
            return res.json({message: "User with these credentials doesn't exist.", success: false});
        }
    });
});

app.get("/api/detailedInfo", requireAuth, async (req, res) => {
    const {lat, lon} = req.query;

    var html = fs.readFileSync(path.resolve(__dirname, "./public/pdftemplate/template.html"), "utf8");

    var options = {
        format: "A4",
        orientation: "portrait",
        border: "10mm",
        header: {
            height: "45mm",
            contents: '<h1 style="text-align: center;">Detailed Informations</h1>'
        },
    };

    var fcData = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.API}&units=metric&lang=it`);
    fcData = fcData.data;

    var currentData = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.API}&units=metric&lang=it`);
    currentData = currentData.data;

    var forecast = fcData.list.map((el) => { return {
        date: el.dt_txt,
        temp: `${el.main.temp} °C`,
        feels_like: `${el.main.feels_like} °C`,
        temp_min: `${el.main.temp_min} °C`,
        temp_max: `${el.main.temp_max} °C`,
        humidity: `${el.main.humidity} %`,
        cloudiness: `${el.clouds.all} %`
    }; });

    var document = {
        html: html,
        data: {
            current: currentData,
            forecast: forecast,
        },
        path: "./output.pdf",
        type: "",
    };

    pdf
        .create(document, options)
        .then(() => {
            // download file
            res.download(`${__dirname}/output.pdf`, () => {
                // delete file
                fs.unlinkSync(`${__dirname}/output.pdf`);
            });
        })
        .catch((error) => {
            console.error(error);
        });
});

var server = app.listen(port, () => {
    var host = server.address().address;
	var port = server.address().port;

	console.log(`Applicazione in ascolto su ${host} con porta ${port}`);
});