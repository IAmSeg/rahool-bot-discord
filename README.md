# rahool-bot-discord
Rahool bot for discord app.

Simulates the Cryptarch Rahool from the game Destiny.

The bot allows users to buy engrams that decrypt into real Destiny items, such as armor, weapons, ships, and ghosts. The user data such as glimmer count,
full loadout of weapons and armor are kept track of by the bot. The user data is stored in a firebase database and written to/read from in real time. The items that decrypt from engrams
are also stored in a firebase database, and are loaded from a python script that fetches the Destiny Manifest through the Bungie API.
The code for the armory database generation is not open source due to the API keys in it for the Bungie API, but feel free to ask for it
if you'd like to run it yourself with your own API keys.

### Current functionality

* Keeps track of currency for users, known as glimmer
* Automatically adds 5 glimmer per message to a user when they type within discord
* Users can buy engrams for 100 glimmer
* Keeps track of users light level and loadout from bought engrams 
* Engrams decrypt within certain light levels and tiers (common, uncommon, rare, legendary, exotic) depending on the user's current light level
* Users can gamble glimmer
* Users can check the light level of all users within the server to see who has highest light

### Setup

To get up and running, you need your own Discord auth token for your bot. [Use this guide](https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0) to get started with your own bot. You'll then want to create a file called `auth.json` that has the following:  

```
{
  "token": "YOUR_TOKEN_HERE"
}
```

After that you'll need to setup your own firebase db and get your firebase config. [Go here for firebase setup.](https://firebase.google.com/docs/web/setup?authuser=0) Then create a file called `firebaseConfig.js` that contains the following: 

```js
export default {
  apiKey: "<API_KEY>",
  authDomain: "<PROJECT_ID>.firebaseapp.com",
  databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
  messagingSenderId: "<SENDER_ID>",
};
```

To use the current `!buyengram` functionality you'll need an armory of destiny items setup in a firebase db. You can do this however you want, but I use a python script to fetch the destiny manifest from the bungie API and populate the db with that. If you wanna see how I did it, [check out the repo here](https://github.com/MrDoctorJ/destiny-armory-generator/tree/master).


### Contributing

I'm not actively developing this for wide usage, this was just a side project for my server to be a fun little mini game. If you want to use it, your best bet it to branch it and keep it up yourself. If you need help getting setup with the Bungie API or getting your own Firebase DB going, feel free to reach out and I'll help you out.
