import config from './firebaseConfig';
import lightLevelConfig from './lightLevelConfig';
import firebase from 'firebase';
import utilities from './utilities';
import request from 'request';
import vendorEngramConfig from './vendorEngramsConfig';
import logger from 'winston';
import moment from 'moment';
import battleConfig from './battleConfig';

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});

logger.level = 'debug';

// Initialize Firebase
firebase.initializeApp(config.config);
firebase.auth().signInWithEmailAndPassword(config.credentials.email, config.credentials.password).catch(err => {
  logger.error(`Error signing into firebase with email and password: ${err}`);
});

export default class Api {
  // @summary - constructor for class
  // @param bot - current instance of bot
  // @channelId - channel to write any messages to 
  constructor(bot, channelId) {
    this.database = firebase.database();
    
    this.bot = bot;
    this.channelId = channelId;
  }

  /* -------------------- *\
       &user functions
  \* ---------------------*/

  // @summary general function that writes user initial data
  // @param userId - user to write data for
  // @username - human friendly username of the user
  writeData(userId, username) {
    try {
      this.database.ref(`users/${userId}`).set({
        id: userId,
        username,
        glimmer: 1000,
        itemLightLevels: {
          helmetLight: 0,
          helmetName: 'unknown',
          gauntletsLight: 0,
          gauntletsName: 'unknown',
          chestLight: 0,
          chestName: 'unknown',
          legsLight: 0,
          legsName: 'unknown',
          classLight: 0,
          className: 'unknown',
          kineticLight: 0,
          kineticName: 'unknown',
          energyLight: 0,
          energyName: 'unknown',
          powerLight: 0,
          powerName: 'unknown'
        }
      });
    }
    catch (e) {
      logger.error(`Error in writeData for ${userId}: ${e}`);
    }
  }

  // @summary - gives glimmer to a user
  // @param userId - user to give glimmer to
  // @param amount
  addGlimerToUser(userId, amount) {
    this.fragmentGlimmerMainframe(amount);
    const user = this.database.ref(`users/${userId}`);
    user.once('value', snapshot => {
      user.update({ glimmer: snapshot.val().glimmer + amount });
    });
  }

  // @summary - takes glimmer from a user
  // @param userId - user to take glimmer from
  // @param amount
  takeGlimerFromUser(userId, amount) {
    this.fragmentGlimmerMainframe(amount);
    const user = this.database.ref(`users/${userId}`);
    user.once('value', snapshot => {
      user.update({ glimmer: snapshot.val().glimmer - amount });
    });
  }

  // @summary updates glimmer for a particular user when they type
  // +5 glimmer for each message
  // @param userId - calling user
  // @username - human friendly username of the user
  updateGlimmer(userId, username) {
    try {
      this.fragmentGlimmerMainframe(5);
      // add 5 to the bank
      this.addAmountToBank(5);
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val())
          snapshot.ref.update({ glimmer: snapshot.val().glimmer + 5, username });
        else
          this.writeData(userId, username);
      });
    }
    catch (e) {
      logger.error(`Error in updateGlimmer for ${userId}: ${e}.`);
    }
  }

  // @summary gets current glimmer for the calling user
  // @param userId - calling user
  getCurrentGlimmer(userId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val())
          this.bot.sendMessage({
            to: this.channelId,
            message: `Current glimmer for <@${userId}>: ${snapshot.val().glimmer}.`
          });
        else
          this.bot.sendMessage({
            to: this.channelId,
            message: `No glimmer for <@${userId}>.`
          });
      });
    }
    catch (e) {
      logger.error(`Error in getCurrentGlimmer for ${userId}: ${e}.`);
    }
  }

  /* -------------------- *\
       &end user functions
  \* ---------------------*/

  /* ------------------------- *\
          &gambling 
  \* ------------------------- */

  // @summary gets a list of users and their light levels and sorts them from highest to lowest
  // 17% chance of winning your gamble, 
  // 12% chance of doubling your wager, 
  // 5% chance of tripling it
  // 23% chance of breaking even, 
  // 36% chance of losing the gamble,
  // 7% chance of losing double your gamble
  // the higher the roll the better
  // @param userId - calling user
  // @param amount - the amount the user chose to gamble
  gambleGlimmer(userId, amount) {
    try {
      this.fragmentGlimmerMainframe(amount);
      if (isNaN(amount)) {
        this.bot.sendMessage({
          to: this.channelId,
          message: `<@${userId}> ${amount} isn't a number, dumbass.`
        });

        return;
      }

      if (amount < 0) {
        this.bot.sendMessage({
          to: this.channelId,
          message: `<@${userId}> how you gonna gamble a negative amount? Get outta here.`
        });

        return;
      }

      const roll = utilities.randomNumberBetween(1, 100);
      let doubleLossChance = 7;
      let lossChance = 36;
      let breakEvenChance = 23;
      let tripleChance = 5;
      let doubleChance = 12;
      let winChance = 17;

      let newAmount = amount;
      let message = ``;
      if (roll <= 7) {
        newAmount = 0 - amount - amount;
        this.addAmountToBank(Math.abs(newAmount));
        message = `rolled a ${roll} (${doubleLossChance}% chance). You have a problem and lost twice your gamble, ${amount * 2} glimmer.`
      }
      else if (roll > 7 && roll <= 43) {
        newAmount = 0 - amount;
        this.addAmountToBank(Math.abs(newAmount));
        message = `rolled a ${roll} (${lossChance}% chance). You lost your gamble and lost ${amount} glimmer..`
      }
      else if (roll > 43 && roll <= 66) {
        newAmount = 0;
        message = `rolled a ${roll} (${breakEvenChance}% chance). You broke even and kept your ${amount} glimmer.`
      }
      else if (roll > 66 && roll <= 83) {
        newAmount = amount;
        message = `rolled a ${roll} (${winChance}% chance). You won your gamble and won ${newAmount} glimmer!`
      }
      else if (roll > 83 && roll <= 95) {
        newAmount = amount * 2;
        message = `rolled a ${roll} (${doubleChance}% chance). You doubled your gamble and won ${newAmount} glimmer!`
      }
      else {
        newAmount = amount * 3;
        message = `rolled a ${roll} (${tripleChance}% chance). You tripled your gamble and won ${newAmount} glimmer!`
      }

      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          if (snapshot.val().glimmer < amount) {
            this.bot.sendMessage({
              to: this.channelId,
              message: `<@${userId}> you don't have that much glimmer to gamble.`
            });
            return;
          }
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> ${message}`
          });
          let glimmer = (Number(snapshot.val().glimmer) + Number(newAmount));
          snapshot.ref.update({ glimmer });
        }
      });
    }
    catch (e) {
      logger.error(`Error in gambleGlimmer for ${userId} and amount ${amount}: ${e}`);
    }
  }

  /* ------------------------- *\
          &end gambling 
  \* ------------------------- */


  /* ------------------------------------------ *\
       &glimmer bank/fragmentation functions
  \* -------------------------------------------*/

  // @summary - fragments the glimmer mainframe for each transaction based on the amount
  // @amount - amount being transacted in the economy
  fragmentGlimmerMainframe(amount) {
    try {
      const oneGlimmerPercentage = .0000001;
      let fragmentationAmount = Math.abs(amount) * oneGlimmerPercentage * 100;
      const fragRef = this.database.ref(`glimmerMainframe`);
      fragRef.once('value', s => {
        fragRef.update({ fragmentationRate: s.val().fragmentationRate + fragmentationAmount, transactionCount: s.val().transactionCount + 1 });
      });

      this.checkMainframeFragmentation();
    } 
    catch (e) {
      logger.error(`Error in fragmentGlimmerMainframe for amount ${amount}: ${e}`);
    }
  }

  // @summary - defragments the glimmer mainframe based on the amount
  // @amount - amount being donated to defrag repairs
  defragGlimmerMainframe(userId, amount) {
    try {
      const oneGlimmerPercentage = .0000001;
      let fragmentationAmount = Math.abs(amount) * oneGlimmerPercentage * 100;
      const fragRef = this.database.ref(`glimmerMainframe`);
      fragRef.once('value', s => {
        fragRef.update({ fragmentationRate: s.val().fragmentationRate - fragmentationAmount });
      });

      this.bot.sendMessage({
        to: this.channelId,
        message: `<@${userId}> the Global Glimmer Bank thanks you for your donation to defragmentation repairs. Your donation helped defragment the Glimmer Mainframe by **${fragmentationAmount}%**.`
      });
    } 
    catch (e) {
      logger.error(`Error in defragGlimmerMainframe for amount ${amount}: ${e}`);
    }
  }

  // @summary - checks the current glimmer mainframe fragmentation rate, and wipes everything if it is at 100%
  checkMainframeFragmentation() {
    try {
      const mainRef = this.database.ref(`glimmerMainframe`);
      mainRef.once('value', s => {
        // mainframe crash
        if (s.val().fragmentationRate >= 100) {
          // wipe users
          const users = this.database.ref(`users`); 
          users.update({ glimmer: 0 , oweTo: false });

          // wipe mainframe
          mainRef.update({ fragmentationRate: 0, transactionCount: 0 });

          // wipe bank
          const bank = this.database.ref(`glimmerBank`);
          bank.update({ amount: 0 });

          this.bot.sendMessage({
            to: this.channelId,
            message: `**MAINFRAME ERROR**. FRAGMENTATION RATE AT 100%. ALL GLIMMER HAS BEEN LOST.`
          });
        }
      });
    } 
    catch (e) {
      logger.error(`Error in checkMainframeFragmentation: ${e}`);
    }
  }

  // @summary - gets the current glimmer mainframe fragmentation rate
  // @bot - this bot
  // @channelid - channel to write to
  getFragmentationRate() {
    try {
      const fragRef = this.database.ref(`glimmerMainframe`);
      fragRef.once('value', s => {
        let message = `Current Glimmer Mainframe fragmentation rate: **${s.val().fragmentationRate.toFixed(7)}%**. Current transaction count: **${s.val().transactionCount}**.`;
        this.bot.sendMessage({
          to: this.channelId,
          message
        });
      });
    } 
    catch (e) {
      logger.error(`Error in getFragmentationRate: ${e}`);
    }
  }

  /// @summary - adds an amount of glimmer to the global glimmer bank
  /// @param amount - amount to add
  addAmountToBank(amount) {
    try {
      this.fragmentGlimmerMainframe(amount);
      const ref = this.database.ref(`glimmerBank`);
      ref.once('value', snapshot => {
        snapshot.ref.update({ amount: snapshot.val().amount + amount });
      });
    }
    catch (e) {
      logger.error(`Error in addAmountToBank: ${e}`);
    }
  }

  // @summary gets current mount of glimmer in global bank
  // @param userId - calling user
  getBankAmount() {
    try {
      const ref = this.database.ref(`glimmerBank`);
      ref.once('value', snapshot => {
        this.bot.sendMessage({
          to: this.channelId,
          message: `Current Global Glimmer Bank amount: **${snapshot.val().amount}** glimmer.`
        })
      });
    }
    catch (e) {
      logger.error(`Error in getBankAmount: ${e}`);
    }
  }

  // @summary gets current mount of glimmer in global bank
  // @param userId - calling user
  // @param guess- the users guess for the secret number
  robBank(userId, guess) {
    try {
      const secret = utilities.randomNumberBetween(1, 100);
      const userRef = this.database.ref(`users/${userId}`);
      const bankRef = this.database.ref(`glimmerBank`);
      userRef.once('value', snapshot => {
        // make sure they're not on bank cooldown
        if (utilities.minutesSince(snapshot.val().bankCooldown) < 1) {
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}>, you are on hiatus from your previous bank robbery attempt. Lay low for a bit.`
          });       

          return;
        }

        let userGlimmer = snapshot.val().glimmer; 
        if (userGlimmer < -100) {
          this.bot.sendMessage({
            to: this.channelId,
            message: `Sorry <@${userId}>, you don't have enough glimmer to attempt a bank robbery.`
          });
          return;
        }

        // bank cooldown
        userRef.update({ bankCooldown: moment().unix() });

        // successful bank rob
        if (guess == secret) {
          bankRef.once('value', snapshot => {
            let amount = snapshot.val().amount;

            this.bot.sendMessage({
              to: this.channelId,
              message: `Congratulations <@${userId}>! You guessed the secret number and successfully robbed the Global Glimmer Bank of **${amount}** glimmer!`
            });

            userRef.once('value', snapshot => {
              userRef.update({ glimmer: snapshot.val().glimmer + amount });
            });

            bankRef.update({ amount: 0 });
          });
        }
        else {
          // fine of 20%
          let fineAmount = Math.abs(Math.floor(snapshot.val().glimmer * 0.2));
          // fine them at least 5, 20 if they don't even have that much glimmer
          fineAmount = fineAmount < 5 ? 20 : fineAmount;
          bankRef.once('value', snapshot => {
            amount = snapshot.val().amount;
            bankRef.update({ amount: amount + Math.abs(fineAmount) });
          });
          userRef.update({ glimmer: snapshot.val().glimmer - Math.abs(fineAmount) });
          this.bot.sendMessage({
            to: this.channelId,
            message: `Sorry <@${userId}>, you were caught trying to rob the bank with a failed robbery attempt. The secret number was **${secret}**. You've been fined **${fineAmount}** glimmer by the glimmer police.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in robBank: ${e}`);
    }
  }

  /* ------------------------------------------ *\
       &end glimmer bank/fragmentation functions
  \* -------------------------------------------*/

  /* ------------------------------------------ *\
       &light level/engram functions
  \* -------------------------------------------*/

  // @summary gets current loadout for user. this includes their specific item names and light levels
  // @param userId - calling user
  getLoadout(userId) {
    try {
      const ref = this.database.ref(`users/${userId}`);
      ref.once('value', snapshot => {
        let message = `Loadout for <@${userId}>: \n` +
          `Kinetic weapon: ${snapshot.val().itemLightLevels.kineticName} (${snapshot.val().itemLightLevels.kineticLight})\n` +
          `Energy weapon: ${snapshot.val().itemLightLevels.energyName} (${snapshot.val().itemLightLevels.energyLight})\n` +
          `Power weapon: ${snapshot.val().itemLightLevels.powerName} (${snapshot.val().itemLightLevels.powerLight})\n` +
          `Helmet: ${snapshot.val().itemLightLevels.helmetName} (${snapshot.val().itemLightLevels.helmetLight})\n` +
          `Gauntlets: ${snapshot.val().itemLightLevels.gauntletsName} (${snapshot.val().itemLightLevels.gauntletsLight})\n` +
          `Chest Armor: ${snapshot.val().itemLightLevels.chestName} (${snapshot.val().itemLightLevels.chestLight})\n` +
          `Leg Armor: ${snapshot.val().itemLightLevels.legsName} (${snapshot.val().itemLightLevels.legsLight})\n` +
          `Class Item: ${snapshot.val().itemLightLevels.className} (${snapshot.val().itemLightLevels.classLight})\n` +
          `Total Light: **${lightLevelConfig.calculateLightLevel(snapshot.val())}**`;

        this.bot.sendMessage({
          to: this.channelId,
          message
        });
     });
    }
    catch (e) {
      logger.error(`Error in getLoadout for ${userId}: ${e}`);
    }
  }

  // @summary gets a list of users and their light levels and sorts them from highest to lowest
  getLightRank() {
    try {
      const users = this.database.ref('users/');
      users.once('value', snapshot => {
        const snapVal = snapshot.val();
        const userList = [];
        let message = `Light ranks:\n`;
        for (let user in snapVal)
          userList.push(snapVal[user]);

        userList.sort((a, b) => lightLevelConfig.calculateLightLevel(b) - lightLevelConfig.calculateLightLevel(a));

        userList.forEach((user, i) => {
          message += `${i + 1}: ${user.username}, light: ${lightLevelConfig.calculateLightLevel(user)}\n`; 
        });

        this.bot.sendMessage({
          to: this.channelId,
          message
        });
      });
    }
    catch (e) {
      logger.error(`Error in getLightRank: ${e}`);
    }
  }

  // @summary sometimes rahool is a dick and your engrams decrypt into nothing
  // @param userId - calling user
  rahoolIsADick(userId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val())
          snapshot.ref.update({ glimmer: snapshot.val().glimmer - 100 });
          this.bot.sendMessage({
            to: this.channelId,
            message: `As a special "fuck you" from me to you, <@${userId}>, your engram decrypted into nothing but shards. Sorry!`
          });
      });
    }
    catch (e) {
      logger.error(`Error in rahoolIsADick for ${userId}: ${e}.`);
    }
  }

   // @summary gets current light level only (no loadout) for the calling user
  // @param userId - calling user
  getCurrentLight(userId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          const currentLight = lightLevelConfig.calculateLightLevel(snapshot.val());
          this.bot.sendMessage({
            to: this.channelId,
            message: `Current light level for <@${userId}>: **${currentLight}**.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in getCurrentLight for ${userId}: ${e}.`);
    }
  }

  // @summary buys an engram for the calling user
  // @param userId - calling user
  getEngram(userId) {
    try {
      this.fragmentGlimmerMainframe(amount);
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          if (snapshot.val().glimmer < 100) {
            this.bot.sendMessage({
              to: this.channelId,
              message: `I'm sorry. You don't have enough glimmer to buy an engram. Engrams cost **100** glimmer. You have **${snapshot.val().glimmer}** glimmer.`
            });

            return;
          }

          // remove 100 from the user and add it to the bank
          snapshot.ref.update({ glimmer: snapshot.val().glimmer - 100 });
          this.addAmountToBank(100);

          let currentLight = lightLevelConfig.calculateLightLevel(snapshot.val())
          let engramTier = lightLevelConfig.determineEarnedEngram(currentLight);

          // grab a random item from the armory of this tier
          const items = this.database.ref(`armory/${engramTier.name}`);
          items.once('value', itemSnapshot => {
            const tierItems = [];
            const snapshotVal = itemSnapshot.val();
            for (let item in snapshotVal)
              tierItems.push(snapshotVal[item]);

            let random = utilities.randomNumberBetween(0, tierItems.length - 1);
            let selectedItem = tierItems[random];
            let engramLightLevel = lightLevelConfig.determineEngramLightLevel(currentLight, engramTier);

            this.updateLightLevel(userId, selectedItem, engramLightLevel);

            // send the message
            let message = `Oh I have a nice ${engramTier.color} ${engramTier.name} engram for you, <@${userId}>! ` +
                          `It it a **${selectedItem.name}** that decrypted at **${engramLightLevel}** light. ` +
                          `*${selectedItem.description}* ` +
                          `${selectedItem.link}`;
            this.bot.sendMessage({
              to: this.channelId,
              message
            })
          });
        }
      }); 
    }
    catch (e) {
      logger.error(`Error in getEngram for ${userId}: ${e}.`);
    }
  }

  // @summary updates light level for a particular user (after they've bought an engram)
  // @param userId - calling user
  // @param selectedItem - the item that decrypted from the engram the user bought
  // @param engramLightLevel - kinda self explanatory
  updateLightLevel(userId, selectedItem, engramLightLevel) {
    try {
      let itemSlot = '';
      let itemName = selectedItem.name.toLowerCase();
      let itemHasLight = false;

      // a list of all possible items that have light. ships, sparrows, ghosts don't.
      [
        'hunter cloak',
        'titan mark',
        'warlock bond',
        'helmet',
        'gauntlets',
        'chest armor',
        'leg armor',
        'auto rifle',
        'pulse rifle',
        'hand cannon',
        'scout rifle',
        'sidearm',
        'sniper rifle',
        'sword',
        'rocket launcher',
        'fusion rifle',
        'submachine gun',
        'grenade launcher',
        'shotgun'
      ].forEach(item => {
        if (selectedItem.name.toLowerCase().indexOf(item) !== -1)
          itemHasLight = true;
      });

      if (itemHasLight) {
        const user = this.database.ref(`users/${userId}`);
        user.once('value', snapshot => {
          if (snapshot.val()) {
            // current light items
            let kineticLight = snapshot.val().itemLightLevels.kineticLight;
            let energyLight = snapshot.val().itemLightLevels.energyLight;
            let powerLight = snapshot.val().itemLightLevels.powerLight;
            let helmetLight = snapshot.val().itemLightLevels.helmetLight;
            let gauntletsLight = snapshot.val().itemLightLevels.gauntletsLight;
            let chestLight = snapshot.val().itemLightLevels.chestLight;
            let legsLight = snapshot.val().itemLightLevels.legsLight;
            let classLight = snapshot.val().itemLightLevels.classLight;
            let kineticName = snapshot.val().itemLightLevels.kineticName;
            let energyName = snapshot.val().itemLightLevels.energyName;
            let powerName = snapshot.val().itemLightLevels.powerName;
            let helmetName = snapshot.val().itemLightLevels.helmetName;
            let gauntletsName = snapshot.val().itemLightLevels.gauntletsName;
            let chestName = snapshot.val().itemLightLevels.chestName;
            let legsName = snapshot.val().itemLightLevels.legsName;
            let className = snapshot.val().itemLightLevels.className;

            // if we got an energy or kinetic weapon
            if (itemName.indexOf('hand cannon') !== -1 ||
                itemName.indexOf('auto rifle') !== -1 ||
                itemName.indexOf('scout rifle') !== -1 ||
                itemName.indexOf('pulse rifle') !== -1 ||
                itemName.indexOf('sidearm') !== -1) {
                  if (engramLightLevel > Math.min(kineticLight, energyLight)) {
                     let weaponToSet = kineticLight < energyLight ? 'kinetic' : 'energy';
                     if (weaponToSet == 'kinetic') {
                       kineticLight = engramLightLevel;
                       kineticName = selectedItem.name;
                     }
                     else {
                       energyLight = engramLightLevel;
                       energyName = selectedItem.name;
                     }
                  }
            }
            // if we got a power weapon
            if (itemName.indexOf('sniper rifle') !== -1 ||
                itemName.indexOf('fusion rifle') !== -1 ||
                itemName.indexOf('rocket launcher') !== -1 ||
                itemName.indexOf('grenade launcher') !== -1 ||
                itemName.indexOf('grenade launcher') !== -1 ||
                itemName.indexOf('shotgun') !== -1) {
                  if (engramLightLevel > powerLight) {
                    powerLight = engramLightLevel;
                    powerName = selectedItem.name;
                  }

            }
            // if we got a helmet
            if (itemName.indexOf('helmet') !== -1) {
              if (engramLightLevel > helmetLight) {
                helmetLight = engramLightLevel;
                helmetName = selectedItem.name;
              }
            }
            // if we got a chest piece
            if (itemName.indexOf('chest armor') !== -1) {
              if (engramLightLevel > chestLight) {
                chestLight = engramLightLevel;
                chestName = selectedItem.name;
              }
            }
            // if we got gauntlets
            if (itemName.indexOf('gauntlets') !== -1) {
              if (engramLightLevel > gauntletsLight) {
                gauntletsLight = engramLightLevel;
                gauntletsName = selectedItem.name;
              }
            }
            // if we got legs
            if (itemName.indexOf('leg armor') !== -1) {
              if (engramLightLevel > legsLight) {
                legsLight = engramLightLevel;
                legsName = selectedItem.name;
              }
            }
            // if we got a class item
            if (itemName.indexOf('hunter cloak') !== -1 ||
                itemName.indexOf('titan mark') !== -1 ||
                itemName.indexOf('warlock bond') !== -1) {
              if (engramLightLevel > classLight) {
                classLight = engramLightLevel;
                className = selectedItem.name;
              }
            }

            // object to represent users new light levels and loadouts
            let itemLightLevels = {
              helmetLight,
              chestLight,
              gauntletsLight,
              legsLight,
              classLight,
              kineticLight,
              energyLight,
              powerLight,
              kineticName,
              energyName,
              powerName,
              helmetName,
              gauntletsName,
              chestName,
              legsName,
              className
            };
            snapshot.ref.update({ itemLightLevels });
          }
        });
      }
    } 
    catch (e) {
      logger.error(`Error in updateLightLevel for ${userId}: ${e}.`);
    }
  }
  /* ------------------------------------------ *\
       &end light level/engram functions
  \* -------------------------------------------*/

  
  /* ----------------------- *\
       &vendor engrams
  \* ------------------------*/
  // @summary checks for 300 level gear from vendorengrams.xyz
  get300Vendors() {
    try {
      request(`${vendorEngramConfig.api}/getVendorDrops?key=${vendorEngramConfig.key}`, (error, response, body) => {
        try {
          // turn body into an array and filter to only vendors who have verified 300 drops
          let vendors = JSON.parse(body).filter(vendor => vendor.type === 3 && vendor.verified === 1);

          // if there are any dropping 300 level gear
          if (vendors.length > 0) {
            // tag our specific vendor engrams role
            let message = `${vendorEngramConfig.roleId} `;
            vendors.forEach(vendor => {
              message += `**${vendorEngramConfig.vendors[vendor.vendor]}** is currently dropping 300 Power Level gear.\n`;
            });

            // determine when this will likely expire (at the nearest half hour)
            message += `This will **likely** change in `;
            let thisMinute = moment().minute();
            let expireMinutes;
            if (thisMinute < 30) 
              expireMinutes = 30 - thisMinute;
            else
              expireMinutes = 60 - thisMinute;

            message += `**${expireMinutes} minutes**.`
            // send the message and set a timeout to delete the message later
            this.bot.sendMessage({
              to: this.channelId,
              message
            }, (error, response) => {
              setTimeout(() => {
                this.bot.deleteMessage({
                  channelID: response.channel_id,
                  messageID: response.id
                });
              }, expireMinutes * 1000 * 60);
            });
          }
        } 
        catch (e) {
          logger.error(`Error parsing JSON response from vendor engrams api: ${e}`);
        }
      });
    }
    catch (e) {
      logger.error(`Error in get300Vendors for: ${e}.`);
    }
  }

  /* ----------------------- *\
       &end vendor engrams
  \* ------------------------*/

  /* ----------------------- *\
       &battles
  \* ------------------------*/

  // @summar - gets the battle cooldown for a user
  // @param userId - calling user
  getBattleCooldown(userId) {
    try {
      const ref = this.database.ref(`users/${userId}`);
      ref.once('value', s => {
        let cooldown = Math.abs((moment().unix() - ((3 * 60) + s.val().battleCooldown)) / 60).toFixed(2);
        this.bot.sendMessage({
          to: this.channelId,
          message: `<@${userId}> you are exhausted from your previous battle. You must take time to recover. You can battle in **${cooldown}** minutes.`
        })
      });
    }
    catch (e) {
      logger.error(`Error in getBattleCooldown for ${userId}: ${e}`);
    }
  }

  // @summary battles an enemy from the selected tier
  // @param userId - calling user
  // @param tier - the tier of enemy to battle
  battle(userId, tier) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        try {
          if (utilities.minutesSince(snapshot.val().battleCooldown) < 3) {
            this.getBattleCooldown(userId, bot, channelId);
            return;
          }

          tier = tier - 1;
          let enemyRaceIndex = utilities.randomNumberBetween(0, battleConfig.enemyConfig.length - 1);
          let battleStartMessageIndex = utilities.randomNumberBetween(0, battleConfig.battleStartMessages.length - 1);
          let selectedEnemyRace = battleConfig.enemyConfig[enemyRaceIndex].name;
          let selectedEnemyType = battleConfig.enemyConfig[enemyRaceIndex].structure[tier];
          let selectedEnemy = `${selectedEnemyRace} ${selectedEnemyType}`;
          let enemyLocationIndex = utilities.randomNumberBetween(0, battleConfig.enemyConfig[enemyRaceIndex].locations.length - 1);
          let battleCryIndex = utilities.randomNumberBetween(0, battleConfig.battleCries.length - 1);
          let enemyLight = utilities.randomNumberBetween(battleConfig.enemyLightConfig[tier].min * lightLevelConfig.maxLight, battleConfig.enemyLightConfig[tier].max * lightLevelConfig.maxLight);
          let yourLight = lightLevelConfig.calculateLightLevel(snapshot.val());
          let chanceToWin = battleConfig.calculateChanceToWin(yourLight, enemyLight, tier);
          let won = false;

          let message = `<@${userId}>, ${battleConfig.battleStartMessages[battleStartMessageIndex]} ${battleConfig.enemyConfig[enemyRaceIndex].locations[enemyLocationIndex]}, you run across a **${selectedEnemy}** at **${enemyLight} light**. `;
          message += `At your current light of **${yourLight}** you have a **${chanceToWin}%** chance to win. `;

          message += `${battleConfig.battleCries[battleCryIndex]}. The battle begins.`;

          this.bot.sendMessage({
            to: this.channelId,
            message
          });

          let roll = utilities.randomNumberBetween(1, 100);
          if (roll <= chanceToWin)
            won = true;

          // battle is happening
          setTimeout(() => {
            this.bot.sendMessage({
              to: this.channelId,
              message: `Pew pew pew!`
            });
          }, 3000);

          setTimeout(() => {
            this.bot.sendMessage({
              to: this.channelId,
              message: `Bang bang!`
            });
          }, 5000);

          setTimeout(() => {
            this.bot.sendMessage({
              to: this.channelId,
              message: `...`
            });
          }, 7000);

          setTimeout(() => {
            this.bot.sendMessage({
              to: this.channelId,
              message: `The dust settles...`
            });
          }, 9000);

          let glimmerWonOrLost = 0;
          // if we won
          if (won) {
            glimmerWonOrLost = battleConfig.calculateGlimmerWon(chanceToWin, tier);
            let randomMessage = utilities.getRandomFrom(battleConfig.successMessages);
            let afterMessage = `After a difficult fight <@${userId}>, ${randomMessage} the **${selectedEnemy}**. You walk away the victor, and the Global Glimmer Bank pays **${glimmerWonOrLost} glimmer** for your valient effort.`;
            // bank pays
            this.addAmountToBank(Number(0 - glimmerWonOrLost));

            setTimeout(() => {
              this.bot.sendMessage({
                to: this.channelId,
                message: afterMessage
              });
            }, 11000);
          }
          else { // we lost
            glimmerWonOrLost = battleConfig.calculateGlimmerLost(chanceToWin, tier);
            let randomMessage = utilities.getRandomFrom(battleConfig.defeatMessages);
            let afterMessage = `After a difficult fight <@${userId}>, ${randomMessage} the **${selectedEnemy}**. You walk away defeated, losing **${glimmerWonOrLost} glimmer** in the process.`;

            // add what they lost to the bank
            this.addAmountToBank(glimmerWonOrLost);

            setTimeout(() => {
              this.bot.sendMessage({
                to: this.channelId,
                message: afterMessage
              });
            }, 11000);
          }

          // add a battle cooldown
          user.update({ battleCooldown: moment().unix() });

          user.update({ glimmer: snapshot.val().glimmer + (won ? Number(glimmerWonOrLost) : Number(0 - glimmerWonOrLost)) });
          this.fragmentGlimmerMainframe(glimmerWonOrLost);
        }
        catch (e) {
          logger.error(`Error in battle for user: ${userId}: ${e}.`);
        }
      });
    }
    catch (e) {
      logger.error(`Error in battle for user: ${userId}: ${e}.`);
    }
  }

  // @summary starts a raid battle. users will have 60 seconds to join in once the battle starts
  // @param userId - calling user
  raid(userId) {
    try {
      const raidRef = this.database.ref(`raid`);
      raidRef.once('value', snapshot => {
        // raid cooldown
        if (snapshot.val().raidCooldown) {
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> the Vanguard has forbidden raiding for a short time due to the recent raid activity.`
          });

          return;
        }
        // raid is about to start, add users to existing raid
        if (snapshot.val().starting) {
          let currentRaidMembers = snapshot.val().users;
          currentRaidMembers.push(userId);
          raidRef.update({ users: currentRaidMembers });

          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> has joined the raid group. Type **!raid** to join.`
          });
        }
        else {
          raidRef.update({ starting: true, users: [ userId ] });
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> has started a raid group, you have 60 seconds to join. Type **!raid** to join.`
          });

          // start the raid in 60 seconds
          setTimeout(() => {
            raidRef.update({ starting: false, raidCooldown: true });

            let userList = snapshot.val().users.reduce((list, user) => `${list} <@${user}>\n`, ``);
            let enemyLight = utilities.randomNumberBetween(battleConfig.raidLightConfig.min * lightLevelConfig.maxLight, battleConfig.raidLightConfig.max * lightLevelConfig.maxLight);
            let totalLight = snapshot.val().users.reduce((sum, user) => sum + lightLevelConfig.calculateLightLevel(user), 0);
            // calculate chance to win
            let chanceToWin = battleConfig.calculateChanceToWin(totalLight, enemyLight, 9);
            this.bot.sendMessage({
              to: this.channelId,
              message: `${userList} at your current combined light of **${totalLight}** you have a **${chanceToWin}%** chance to win`
            });
          }, 60000);

          // reset the raid cooldown
          setTimeout(() => {
            raidRef.update({ raidCooldown: false });
          }, 5 * 60 * 1000);
        }
      })
    }
    catch (e) {
      logger.error(`Error in raid for ${userId}: ${e}`);
    }
  }

   /* ----------------------- *\
       &end battles
  \* ------------------------*/

   /* ----------------------- *\
       &loans
  \* ------------------------*/

  // @summary loans glimmer from one user to another
  // @param loaner - calling user
  // @param amount - the amount the user chose to loan
  // @param loanTo - the user to loan amount to
  loan(loaner, amount, loanTo) {
    try {
      // make sure the user has that amount
      const userRef = this.database.ref(`users/${loaner}`);
      userRef.once('value', userSnapshot => {
        if (userSnapshot.val()) {
          if (userSnapshot.val().glimmer < amount) {
            this.bot.sendMessage({
              to: this.channelId,
              message: `<@${loaner}> you don't have that much to loan.`
            });

            return;
          }
          else {
            // make sure the user exists
            const loanToRef = this.database.ref(`users/${loanTo}`);
            loanToRef.once('value', loanToSnapshot => {
              if (loanToSnapshot.val()) {
                //loan the user the amount
                this.fragmentGlimmerMainframe(amount);
                // give loan to the other user
                this.giveLoanTo(loanTo, amount, loaner, userSnapshot.val().username);
                this.bot.sendMessage({
                  to: this.channelId,
                  message: `<@${loaner}> just loaned ${amount} to <@${loanTo}>, mediated by the Global Glimmer Bank.`
                });
              }
              else {
                this.bot.sendMessage({
                  to: this.channelId,
                  message: `<@${loaner}> that user doesn't exist, guess we'll give that glimmer to the Global Glimmer Bank! :)`
                });
                this.takeLoanFrom(loaner, amount);
                this.addAmountToBank(amount);
              }
            })
          }
        }
      });
    }
    catch (e) {
      logger.error(`Error in loan from ${loaner} to ${loanTo} for amount: ${amount}: ${e}`);
    }
  }

  // @summary takes a loan frmo userId
  // @param userId - calling user
  // @param amount - the amount the user chose to loan
  takeLoanFrom(userId, amount) {
    try {
      // make sure the user has that amount
      const userRef = this.database.ref(`users/${userId}`);
      userRef.once('value', snapshot => {
        if (snapshot.val()) {
          this.takeGlimerFromUser(userId, amount);
        }
      });
    }
    catch (e) {
      logger.error(`Error in takeLoanFrom for ${userId} for amount: ${amount}: ${e}`);
    }
  }

  // @summary adds a loan to a user
  // @param userId - user to add loan to
  // @param amount - the amount the user chose to loan
  // @param loaner - the id of the user who loaned them glimmer
  // @param loanerName - the name of the user who loaned them glimmer
  giveLoanTo(loanTo, amount, loaner, loanerName) {
    try {
      const userRef = this.database.ref(`users/${loanTo}`);
      userRef.once('value', snapshot => {
        if (snapshot.val()) {
          let oweTo = {};
          if (snapshot.val().oweTo)
            oweTo = snapshot.val().oweTo;
          if (snapshot.val().oweTo && snapshot.val().oweTo[loaner])
            oweTo[loaner] = { name: loanerName, amount: snapshot.val().oweTo[loaner].amount + amount };
          else 
            oweTo[loaner] = { name: loanerName, amount };

          userRef.update({ glimmer: snapshot.val().glimmer + amount, oweTo });

          // // update the loaners loans
          // const loanerRef = this.database.ref(`users/${loaner}`);
          // loanerRef.once('value', s => {
          //   if (s.val()) {
          //     let loans = {};
          //     if (s.val().loans)
          //       loans = snapshot.val().loans;
          //     if (s.val().loans && s.val().loans[loanTo])
          //       loans[loanTo] = { name: s.val().name, amount: s.val().loans[loanTo].amount + amount };
          //     else 
          //      loans[loanTo] = { name: s.val().name, amount };

          //     loanerRef.update({ loans });
          //   }
          // });
        }
      });

    }
    catch (e) {
      logger.error(`Error in giveLoanTo for ${loanTo} for amount: ${amount}: ${e}`);
    }
  }
 
  // @summary checks debt for a user
  // @param userId - user to check debt for
  getDebt(userId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          let owedAmount = 0;
          let message = `<@${userId}> you owe\n`;
          if (snapshot.val().oweTo) {
            for (let i in snapshot.val().oweTo) {
              if (snapshot.val().oweTo[i].amount > 0) {
                owedAmount += snapshot.val().oweTo[i].amount;
                message += `**${snapshot.val().oweTo[i].amount}** glimmer to **${snapshot.val().oweTo[i].name}**\n`;
              }
            }
          }

          if (owedAmount === 0)
            message = `<@${userId}> you are debt free!`;
          else 
            message += `**${owedAmount}** glimmer in debt total.`
          this.bot.sendMessage({
            to: this.channelId,
            message
          });
        }
      });
    } 
    catch (e) {
      logger.error(`Error in getDebt for user: ${userId}: ${e}`);
    }
  }

  // @summary adds a loan to a user
  // @param userId - user to collect from
  // @param amount - amount to collect
  // @param collectFromId - person to collect from
  collect(userId, amount, collectFromId) {
    try {
      const collectRef = this.database.ref(`users/${collectFromId}`);
        collectRef.once('value', collectSnapshot => {
        if (collectSnapshot.val() && collectSnapshot.val().oweTo && collectSnapshot.val().oweTo[userId]) {
          // if they dont owe them that much
          if (collectSnapshot.val().oweTo[userId].amount < amount) {
            this.bot.sendMessage({
              to: this.channelId,
              message: `<@${userId}> they don't owe you that much.`
            });
          }
          else {
            // update the users debt
            // user pays the full amount
            let oweTo = collectSnapshot.val().oweTo;
            oweTo[userId].amount -= amount;
            collectRef.update({ glimmer: collectSnapshot.val().glimmer - amount, oweTo });

            // bank takes its share
            let bankShare = Math.floor((amount * .2) > 1 ? (amount * .2) : 1);
            let collectedAmount = amount - bankShare;
            this.addAmountToBank(bankShare);

            // repay the user
            this.addGlimerToUser(userId, collectedAmount);
            this.bot.sendMessage({
              to: this.channelId,
              message: `<@${userId}> you collected **${collectedAmount}** glimmer from <@${collectFromId}>. The Global Glimmer Bank took its collection fee at **${bankShare}** glimmer.`
            });
          }
        }
        else {
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> they don't owe you anything.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in collect for ${userId} to ${collectFromId} for amount: ${amount}.`);
    }
  }

  // @summary repay debt to a user
  // @param userId - user who is repaying debt
  // @param amount - amount to repay
  // @param repayToId - user to repay to
  repay(userId, amount, repayToId) {
    try {
      const userRef = this.database.ref(`users/${userId}`);
      userRef.once('value', userSnapshot => {
        if (userSnapshot.val() && userSnapshot.val().oweTo && userSnapshot.val().oweTo[repayToId]) {
          // if they dont owe them that much
          if (userSnapshot.val().oweTo[repayToId].amount < amount) {
            this.bot.sendMessage({
              to: this.channelId,
              message: `<@${userId}> you don't owe ${userSnapshot.val().oweTo[repayToId].name} that much.`
            });
          }
          else {
            if (userSnapshot.val().glimmer < amount) {
              this.bot.sendMessage({
                to: this.channelId,
                message: `<@${userId}> you don't have enough glimmer to repay that much.`
              });
            }
            else {
              // update the users debt
              let oweTo = userSnapshot.val().oweTo;
              oweTo[repayToId].amount -= amount;

              // bank pays 20% of repayments, and adds 20% interest
              let bankShare = Math.floor((amount * .2) > 1 ? (amount * .2) : 1);
              let interest = bankShare;
              let payAmount = amount - bankShare;
              if (payAmount < 1) {
                payAmount = 1;
                bankShare = 0;
              }
              this.addAmountToBank(0 - bankShare - interest);
              userRef.update({ glimmer: userSnapshot.val().glimmer - payAmount, oweTo });


              // repay the user
              this.addGlimerToUser(repayToId, amount + interest);
              this.bot.sendMessage({
                to: this.channelId,
                message: `<@${userId}> you repayed **${payAmount}** glimmer to ${userSnapshot.val().oweTo[repayToId].name}. The Global Glimmer Bank payed **${bankShare}** glimmer of your debt for you, and added **${interest}** glimmer interest to the repayment.`
              });
            }
          }
        }
        else {
          this.bot.sendMessage({
            to: this.channelId,
            message: `<@${userId}> you don't owe them anything.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in repay for ${userId} to ${repayToId} for amount: ${amount}.`);
    }
  }

  /* ----------------------- *\
       &end loans
  \* ------------------------*/
}

