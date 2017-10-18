# rahool-bot-discord
Rahool bot for discord app.

Simulates the Cryptarch Rahool from the game Destiny.

The bot allows users to buy engrams that decrypt into real Destiny items, such as armor, weapons, ships, and ghosts. The user data such as glimmer count,
full loadout of weapons and armor are kept track of by the bot. The user data is stored in a firebase database and written to/read from in real time. The items that decrypt from engrams
are also stored in a firebase database, and are loaded from a python script that fetches the Destiny Manifest through the Bungie API.
The code for the armory database generation is not open source due to the API keys in it for the Bungie API, but feel free to ask for it
if you'd like to run it yourself with your own API keys.

### Current functionality

* **!glimmer** - Check your current glimmer
* **!glimmereconomy** - More information about how the glimmer economy works
* **!buyengram**- Buy an engram from Rahool for 100 glimmer
* **!light** - Check your current light level
* **!lightrank** - Check the light level of everyone in the server, ranked highest to lowest
* **!loadout** - Check your current loadout
* **!gamble AMOUNT** - Gamble AMOUNT of glimmer
* **!gamblehelp** - More information on how gambling wins or losses are determined
* **!gambleodds** - Check the current house gambling odds
* **!robbank SECRET_GUESS** - Attempt to rob the Global Glimmer Bank by guessing the secret vault number (1-100)
* **!howtorobbank** - More informatoin on how to rob the Global Glimmer Bank
* **!bankamount** - Check the current Global Glimmer Bank amount
* **!battle ENEMY_TIER** - Battles an enemy in your selected tier (1-8)
* **!battlecooldown** - Check your current battle cooldown time
* **!battlelog** - Check your total battle wins/losses/glimmer
* **!joinraid RAID_ID** - Join a raid with id RAID_ID
* **!startraid RAID_ID** - Start a raid with id RAID_ID
* **!raidparty RAID_ID** - Check the gaurdian count/combined light for a raid with id RAID_ID
* **!loan AMOUNT @user** - Loan AMOUNT glimmer to a user
* **!collect AMOUNT @user** - Collect a loan of AMOUNT glimmer from @user who you have loaned to
* **!repay AMOUNT @user** - Repay a loan of AMOUNT glimmer to @user who has loaned glimmer to you
* **!loans** - Check the amount of glimmer you have loaned out
* **!debt** - Check how much glimmer you are in debt (how much you have been loaned)
* **!loansystem** - More information about how the loan/repay/collect system works
* **!frag** - Check the current Glimmer Mainframe fragmentation rate
* **!defrag AMOUNT** - Donate AMOUNT glimmer to defragmentation repairs of the Glimmer Mainframe.
* **!aboutfrag** - More information about how the Glimmer Mainframe fragmentation works.

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
  config: {
    apiKey: "<API_KEY>",
    authDomain: "<PROJECT_ID>.firebaseapp.com",
    databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
    messagingSenderId: "<SENDER_ID>"
  },
  credentials: {
    email: 'YOUR_AUTHENTICATED_BOT_EMAIL_HERE',
    password: 'YOUR_BOT_PASSWORD_HERE'
  }
};
```

**Note:** the `credentials` object is only necessary if you are locking down permissions on your firebase db, which I recommend doing. If you have it just open to writing, however, you don't need the `credentials` object.

To use the current `!buyengram` functionality you'll need an armory of destiny items setup in a firebase db. You can do this however you want, but I use a python script to fetch the destiny manifest from the bungie API and populate the db with that. If you wanna see how I did it, [check out the repo here](https://github.com/MrDoctorJ/destiny-armory-generator/tree/master).


### Contributing

I'm not actively developing this for wide usage, this was just a side project for my server to be a fun little mini game. If you want to use it, your best bet it to branch it and keep it up yourself. If you need help getting setup with the Bungie API or getting your own Firebase DB going, feel free to reach out and I'll help you out.
