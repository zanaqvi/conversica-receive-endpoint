//Initiallising node modules
var express = require("express");
var fs = require('fs');
var bodyParser = require("body-parser");
//const { Pool, Client } = require('pg');

var app = express();
//var jwt = require('jsonwebtoken');
// Setting Base directory
app.use(bodyParser.json());

//const ELITE_SECRET = 'elite_secret';
const basicAuth = require('express-basic-auth');

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});
//express basic auth
app.use(basicAuth({
    users: {
        'admin': 'sh3rl0Ck',
        'conver': '1023_C0nv3rS1c@'
    }
}));

app.use('/files_received', express.static(__dirname + '/files_received'));  
app.use(express.static(__dirname + '/files_received')); 

//Setting up server
var server = app.listen(process.env.PORT || 3316, function () {
	var port = server.address().port;
	console.log("Conversica-endpoint app now running on port", port);
});

app.get("/api/test", function(req , res){
	console.log("request received");
	res.status(200).send({ auth: true, message: 'all ok' });
});

app.post('/receive/conversicaMessage', function(request, respond) {
	var body = '';
	var dt = new Date(Date.now());
	console.log(dt.toLocaleDateString() + '_' + dt.toLocaleTimeString() + ' conversicaMessage received');
    filePath = __dirname + '/files_received/message_'+Date.now()+'.json';
    request.on('data', function(data) {
        body += data;
    });

    request.on('end', function (){
        fs.appendFile(filePath, body, function() {
            respond.end();
        });
    });
});

app.post('/receive/conversicaLead', function(request, respond) {
	var body = '';
	var dt = new Date(Date.now());
	console.log(dt.toLocaleDateString() + '_' + dt.toLocaleTimeString() + ' conversicaLead received');
    filePath = __dirname + '/files_received/lead_'+Date.now()+'.json';
    request.on('data', function(data) {
        body += data;
    });

    request.on('end', function (){
        fs.appendFile(filePath, body, function() {
            respond.end();
        });
    });
});

/* initializing postgresql connection credentials
const pool = new Pool({
	user: 'elite_adm1n',
	host: 'elitestaffing.cm524zcbhfxh.us-west-2.rds.amazonaws.com',
	database: 'elitestaffing',
	password: '$h3rl0ck',
	port: 5432,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000
  });

//execute query and send response back
var executePooledPgQuery = function(res, query){
	pool.connect((err, pgClient, release) => {
		if (err) {
			  console.error('Error acquiring client', err.stack);
			  res.send(err);
		} else {
			pgClient.query(query, (err, resultset) => {
				release();
				if (err) {   
					console.log("Error while querying database :- " + err);
					res.send(err);
				}
				else {
					console.log('Response Sent\n');
					res.send(resultset);
				}
			});
		}
	  });
}


//The supplied query is expected to end on 'where email_address='
//The function apends the email address value to the query after JWT authentication and executes the sql
var checkJWTTokenAndExecuteQueryAppendID = function(req, res, query) {
	var token = req.headers['x-access-token'];
	if (!token) 
		return res.status(401).send({ auth: false, message: 'No token provided.' });
	jwt.verify(token, ELITE_SECRET, function(err, decoded) {
		if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		executePooledPgQuery(res, query+"'"+decoded.id+"'");
	});
}

// Checks username and password combinaiton in the database and if authenticated send a jwt token with a 200 OK status
app.post("/api/user/login", function(req , res){
	//var query = "select * from [dbo].[APP_USER] WHERE [Email_Address] = '"+req.body.Email +"' AND [Password] = HASHBYTES('MD5', CONVERT(NVARCHAR(4000),'"+req.body.Password+"'))";
	var query = "select * from elite.APP_USER WHERE Email_Address = '"+req.body.Email +"' AND Password = md5('"+req.body.Password+"')";
	//console.log(query);
	pool.connect((err, pgClient, release) => {
		if (err) {
		  	console.error('Error acquiring client', err.stack);
		} else {
			pgClient.query(query, (err, resultset) => {
				release();
				if (err) {   
					console.log("Error while querying database :- " + err);
					res.send(err);
				}
				else {
					if (resultset.rowCount == 1) {
						console.log('User Authenticated\n');
						// create a token
						var token = jwt.sign({ id: req.body.Email }, ELITE_SECRET, {
							expiresIn: 86400 // expires in 24 hours
						});
						res.status(200).send({ auth: true, token: token });
						//res.send(resultset);
					}
					else {
						res.status(500).send({ auth: false, message: 'Failed to authenticate user.' });
					}
				}
			});
		}
	  });
	// executeQuery (res, query);
    //executePooledPgQuery(jwt.sign({user: res}, ELITE_SECRET), query);
});

//checks for jwt token and if valid token is found exeutes a select * query for users
app.get("/api/user", function(req , res){
	var query = "select * from elite.APP_USER where Email_Address=";
	checkJWTTokenAndExecuteQueryAppendID(req, res, query);
});


//POST API - INSERT new USER / user registration
//the function checks if the email provided does not exist
//sends 500 - email already exists error if email is found in the table else inserts a new user recod in db
//there ois no JWT authentication for this 
app.post("/api/user", function(req , res){
	var checkquery = "select * from elite.APP_USER WHERE Email_Address = '"+req.body.Email+"'";
	pool.connect((err, pgClient, release) => {
		if (err) {
		  	console.error('Error acquiring client', err.stack);
		} else {
			pgClient.query(checkquery, (err, resultset) => {
				release();
				if (err) {
					console.log("Error while querying database (i1) :- " + err);
					res.send(err);
				}
				else {
					if(resultset.rowCount==0) {
						var query = "INSERT INTO elite.APP_USER (First_Name, Last_Name, Email_Address, Phone_Number, Password, USER_ROLE) VALUES \
							('"+req.body.FirstName+"','"+req.body.LastName+"','"+req.body.Email+"','"+req.body.PhoneNumber+"', md5('"+ req.body.Password + "'),'"+ req.body.UserRole+"')";
						executePooledPgQuery(res, query);
					}
					else {
						console.log(err, resultset.rowCount);
						console.log("EMAIL ALREADY EXISTS");
						res.status(500).send('EMAIL ALREADY EXISTS');
						//res.send(new Error("EMAIL ALREADY EXISTS"));
					}
				}
			});
		}
	});
});

//PUT API
app.put("/api/user/update", function(req , res){
	//[First_Name], [Last_Name],[Email_Address],[Phone_Number], [Password], [USER_ROLE]
	var query = "UPDATE elite.APP_USER SET First_Name = '" + req.body.FirstName  +  "' , Last_Name =  '" + req.body.Email + "', \
		Phone_Number=  '" + req.body.PhoneNumber  +  "' , USER_ROLE=  '" + req.body.UserRole  +  "' WHERE Email_Address= ";
	
	checkJWTTokenAndExecuteQueryAppendID(req, res, query);
});

//PUT API
app.put("/api/user/updatePassword", function(req , res){
	//[First_Name], [Last_Name],[Email_Address],[Phone_Number], [Password], [USER_ROLE]
	var query = "UPDATE elite.APP_USER SET Password = md5('"+ req.body.NewPassword + "') Where Password = md5('"+ req.body.OldPassword + "') AND Email_Address= ";
	checkJWTTokenAndExecuteQueryAppendID(req, res, query);
});
*/