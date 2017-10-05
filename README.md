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


### Contributing

I'm not actively developing this for wide usage, this was just a side project for my server to be a fun little mini game. If you want to use it, your best bet it to branch it and keep it up yourself. If you need help getting setup with the Bungie API or getting your own Firebase DB going, feel free to reach out and I'll help you out.
