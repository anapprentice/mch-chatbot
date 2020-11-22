"use strict";

const BootBot = require('bootbot');
const fetch = require('node-fetch');

const config = require('config');

const CovidHelper = require("./config/covid-helper");

let port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.hear(['hello', 'hi'], (payload, chat) => {
  chat.say("Hello! Welcome to our page where you can find information regarding covid-19.").then(() => {
    chat.say({
      text: 'Please, make a choice.',
      buttons: [
        { type: 'postback', title: "Global", payload: 'OPTION_GLOBAL' },
        { type: 'postback', title: "Specify country", payload: 'OPTION_SPECIFY' },
        { type: 'postback', title: "Am I save?", payload: 'OPTION_WORRIED' },
      ]
    });
  });
});

bot.on('postback:OPTION_GLOBAL', (payload, chat) => {
  chat.say({
    text: 'Please, pick a statistic.',
    buttons: [
      { type: 'postback', title: "Deaths today", payload: 'OPTION_GLOBAL_DEATHS' },
      { type: 'postback', title: "Infected today", payload: 'OPTION_GLOBAL_INFECTED' },
      { type: 'postback', title: "Recovered today", payload: 'OPTION_GLOBAL_RECOVERED' }
    ]
  });
});

bot.on('postback:OPTION_GLOBAL_DEATHS', (payload, chat) => {
  fetch(CovidHelper.apis.summary).then(res => res.json())
    .then(json => {
      let newDeaths = json.Global.NewDeaths;
      chat.say(`There have been ${newDeaths} new deaths as of today.`);
    })
})

bot.on('postback:OPTION_GLOBAL_INFECTED', (payload, chat) => {
  fetch(CovidHelper.apis.summary).then(res => res.json())
    .then(json => {
      let newConfirmed = json.Global.NewConfirmed;
      chat.say(`There have been ${newConfirmed} new cases as of today.`);
    })
})

bot.on('postback:OPTION_GLOBAL_RECOVERED', (payload, chat) => {
  fetch(CovidHelper.apis.summary).then(res => res.json())
    .then(json => {
      let newRecovered = json.Global.NewRecovered;
      chat.say(`There have been ${newRecovered} new recoveries as of today.`);
    })
})

bot.on('postback:OPTION_SPECIFY', (payload, chat) => {
  chat.say({
    text: 'Please, pick a country.',
    buttons: [
      { type: 'postback', title: "Slovakia", payload: 'OPTION_SPECIFY_SLOVAKIA' },
      { type: 'postback', title: "Czech Republic", payload: 'OPTION_SPECIFY_CZECH_REPUBLIC' }
    ]
  });
});

bot.on('postback:OPTION_SPECIFY_SLOVAKIA', (payload, chat) => {
  fetch(CovidHelper.apis.slovakia.getConfirmed).then(res => res.json())
    .then(json => {
      let totalConfirmed = json[json.length-1].Cases;
      chat.say(`There have been ${totalConfirmed} confirmed cases so far.`);
    })
});

bot.on('postback:OPTION_SPECIFY_CZECH_REPUBLIC', (payload, chat) => {
  fetch(CovidHelper.apis.czechRepublic.getConfirmed).then(res => res.json())
    .then(json => {
      let totalConfirmed = json[json.length-1].Cases;
      chat.say(`There have been ${totalConfirmed} confirmed cases so far.`);
    })
});

bot.on('postback:OPTION_WORRIED', (payload, chat) => {
  const askName = (convo) => {
    convo.ask(`What's your name?`, (payload, convo) => {
      const text = payload.message.text;
      convo.set('name', text);
      convo.say(
        `${text}, I am going to ask you a series of question to determine whether you are prone to covid or not.`
      ).then(() => askForAge(convo));
    });
  };

  const askForAge = (convo) => {
    convo.ask(`What's your age?`, (payload, convo) => {
      const text = payload.message.text;
      convo.set('age', text);
      askForMedicalCondition(convo);
    });
  };

  const askForMedicalCondition = (convo) => {
    convo.ask(`Do you have any serious ongoing medical conditions? (yes/no)`, (payload, convo) => {
      const text = payload.message.text;
      convo.set('isSick', text);
      sendSummary(convo)
    });
  }

  const sendSummary = (convo) => {
    let age = parseInt(convo.get('age'));
    let isSick = convo.get('isSick') === "yes";
    let decision;

    if (isSick || age >= 60) {
      decision = "Considering your age and ongoing medical conditions, you should be more cautious about getting infected.";
    } else {
      decision = "Good news! Should you get infected by covid I think you would beat it :)"
    }

    convo.say(`Ok, so let's break it down ${convo.get('name')}. ${decision}`);
    convo.end();
  };

  chat.conversation((convo) => {
    askName(convo);
  });
});

bot.start(port);
