var builder = require('botbuilder');
var restify = require('restify');
var d = new Date();
var time = d.getHours();
var newTime = time+10;
var db = require('./db.js'); 


var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


var connector = new builder.ChatConnector({
    appId: '5741df31-3d36-41e0-83af-320ad9e19d5e',
    appPassword: 'etZJCZE38^>fhetqOZ931}='
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [
    function(session,results,next){
        session.userData = [];
        session.userData.qid = 0;
        session.userData.count = 0;
        session.userData.score = 0;
        session.send('Hey there! I am Cybot, your friendly cyber awareness chatbot.');
        next();
    },
    function(session){
        session.beginDialog('getName');
    },
    function(session,results){
        session.beginDialog('getAge');
    },
    function(session,results){
        session.beginDialog('question');
    },
    function(session,results){
        session.beginDialog('results');
    },
    function(session,results){
        session.beginDialog('end');
    }
]);

bot.dialog('getName',[
    function(session){
        builder.Prompts.text(session,'What is your name?');
    },
    function(session,results){
        session.userData.name = session.message.text;
        session.send('%s',session.message.text);
        builder.Prompts.choice(session,'Is this the name you entered?',"Yes|No",{listStyle:3})
    },
    function(session,results,next){
        if(results.response.entity=='Yes'){
            session.send('Okay');
            next();
        }else if(results.response.entity=='No'){
            session.send('Only type in your name');
            session.beginDialog('getName');
        }
    },
    function(session,results){
        session.endDialog();
    }
]);

bot.dialog('getAge',[
    function(session,results){
        var sent = 'How old are you, '+session.userData.name+'?';
        builder.Prompts.text(session,sent);
    },
    function(session,results,next){
        session.userData.age = builder.EntityRecognizer.parseNumber(session.message.text);
        console.log(session.userData.age);
        if(session.userData.age!=null){
            next();
        }else{
            session.beginDialog('getAge');
        }
    },
    function(session,results,next){
        if(session.userData.age<15 && session.userData.age>5){
            session.userData.table = 'grouptwo';
            next();
        // }else if(session.userData.age<15 && session.userData.age>10){
        //     session.userData.table = 'grouptwo';
        //     next();
        }else if(session.userData.age<18 && session.userData.age>14){
            session.userData.table = 'groupthree';
            next();
        }else{
            session.send('Sorry, this quiz is for kids of ages 6 through 18 only.');
            session.beginDialog('getAge');
        }
    },
    function(session,results){
        session.endDialog();
    }
]);

bot.dialog('getQ',[
    function(session,results,next){
        session.send('Okay then, here is the question');
        db.select(session,session.userData.table);
    }
]);

bot.dialog('question',[
    function(session,results,next){
        session.beginDialog('getQ');
    },
    function(session){
        builder.Prompts.choice(session,session.userData.question,session.userData.options,{listStyle: 3});
    },
    function(session,results){
        var choice  = results.response.entity;
        if(choice == session.userData.answer){
            session.beginDialog('correct');
        }else{
            session.beginDialog('wrong');
        }
    },
    function(session,results){
        session.userData.count = session.userData.count + 1;
        console.log(session.userData.count);
        if(session.userData.count>4){
            session.endDialog();
        }else{
            session.beginDialog('question');
            session.userData.qid = session.userData.qid + 1;
        }

    }
]);

bot.dialog('correct',[
    function(session){
        sendimage(session,'https://vignette1.wikia.nocookie.net/villains/images/1/17/BenderHD.jpg/revision/latest?cb=20170413201605','CORRECT');
        session.send('That is the correct answer %s. Good job!',session.userData.name);
        session.userData.score = session.userData.score + 1;
        session.endDialog();
    }
]);

bot.dialog('wrong',[
    function(session){
        sendimage(session,'http://pngimg.com/uploads/futurama/futurama_PNG25.png','INCORRECT');
        session.send('No %s! That is incorrect. Here is a simple tip:',session.userData.name);
        session.send(session.userData.tip);
        session.endDialog();
    }
]);

bot.dialog('results',[
    function(session,results){
        session.userData.id = session.userData.name+session.userData.age;
        db.insert(session,session.userData.id,session.userData.name,session.userData.age,session.userData.score);
        session.send('That is the end. Please wait for results, ');
        session.endDialog();
    }
]);

bot.dialog('end',[
    function(session,results){
        session.send('%s, you have answered %s questions correctly. Congratulations!',session.userData.name,session.userData.score);
        session.send('Goodbye!');
        session.endDialog();
    }
]);

function sendimage(session,url,title) {
    var msg = new builder.Message(session);
    msg.attachments([
        new builder.HeroCard(session)
            .title(title)
            .images([builder.CardImage.create(session, url)])
    ]);
    session.send(msg);
}