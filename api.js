import config from './firebaseConfig';
import lightLevel from './lightLevel';
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

const api = {
  database: firebase.database(),

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
  },

  /// @summary - adds an amount of glimmer to the global glimmer bank
  /// @param amount - amount to add
  addAmountToBank(amount) {
    try {
      const ref = this.database.ref(`glimmerBank`);
      ref.once('value', snapshot => {
        snapshot.ref.update({ amount: snapshot.val().amount + amount });
      });
    }
    catch (e) {
      logger.error(`Error in addAmountToBank: ${e}`);
    }
  },

  // @summary gets current mount of glimmer in global bank
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getBankAmount(bot, channelId) {
    try {
      const ref = this.database.ref(`glimmerBank`);
      ref.once('value', snapshot => {
        bot.sendMessage({
          to: channelId,
          message: `Current global glimmer bank amount: **${snapshot.val().amount}** glimmer.`
        })
      });
    }
    catch (e) {
      logger.error(`Error in getBankAmount: ${e}`);
    }
  },

  // @summary gets current mount of glimmer in global bank
  // @param userId - calling user
  // @param guess- the users guess for the secret number
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  robBank(userId, guess, bot, channelId) {
    try {
      const secret = utilities.randomNumberBetween(1, 100);
      const userRef = this.database.ref(`users/${userId}`);
      const bankRef = this.database.ref(`glimmerBank`);
      userRef.once('value', snapshot => {
        let userGlimmer = snapshot.val().glimmer; 
        if (userGlimmer < -100) {
          bot.sendMessage({
            to: channelId,
            message: `Sorry <@${userId}>, you don't have enough glimmer to attempt a bank robbery.`
          });
          return;
        }

        // successful bank rob
        if (guess == secret) {
          bankRef.once('value', snapshot => {
            let amount = snapshot.val().amount;

            bot.sendMessage({
              to: channelId,
              message: `Congratulations <@${userId}>! You guessed the secret number and successfully robbed the global glimmer bank of **${amount}** glimmer!`
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
          bot.sendMessage({
            to: channelId,
            message: `Sorry <@${userId}>, you guessed incorrectly. The secret number was **${secret}**. You've been fined **${fineAmount}** glimmer by the glimmer police.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in robBank: ${e}`);
    }
  },

  // @summary gets current loadout for user. this includes their specific item names and light levels
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getLoadout(userId, bot, channelId) {
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
          `Total Light: **${lightLevel.calculateLightLevel(snapshot.val())}**`;

        bot.sendMessage({
          to: channelId,
          message
        });
     });
    }
    catch (e) {
      logger.error(`Error in getLoadout for ${userId}: ${e}`);
    }
  },

  // @summary gets a list of users and their light levels and sorts them from highest to lowest
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getLightRank(bot, channelId) {
    try {
      const users = this.database.ref('users/');
      users.once('value', snapshot => {
        const snapVal = snapshot.val();
        const userList = [];
        let message = `Light ranks:\n`;
        for (let user in snapVal)
          userList.push(snapVal[user]);

        userList.sort((a, b) => lightLevel.calculateLightLevel(b) - lightLevel.calculateLightLevel(a));

        userList.forEach((user, i) => {
          message += `${i + 1}: ${user.username}, light: ${lightLevel.calculateLightLevel(user)}\n`; 
        });

        bot.sendMessage({
          to: channelId,
          message
        });
      });
    }
    catch (e) {
      logger.error(`Error in getLightRank: ${e}`);
    }
  },

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
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  gambleGlimmer(userId, amount, bot, channelId) {
    try {
      if (isNaN(amount)) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}> ${amount} isn't a number, dumbass.`
        });

        return;
      }

      if (amount < 0) {
        bot.sendMessage({
          to: channelId,
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
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> you don't have that much glimmer to gamble.`
            });
            return;
          }
          bot.sendMessage({
            to: channelId,
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
  },

  // @summary updates glimmer for a particular user when they type
  // +5 glimmer for each message
  // @param userId - calling user
  // @username - human friendly username of the user
  updateGlimmer(userId, username) {
    try {
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
  },

  // @summary sometimes rahool is a dick and your engrams decrypt into nothing
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  rahoolIsADick(userId, bot, channelId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val())
          snapshot.ref.update({ glimmer: snapshot.val().glimmer - 100 });
          bot.sendMessage({
            to: channelId,
            message: `As a special "fuck you" from me to you, <@${userId}>, your engram decrypted into nothing but shards. Sorry!`
          });
      });
    }
    catch (e) {
      logger.error(`Error in rahoolIsADick for ${userId}: ${e}.`);
    }
  },

  // @summary gets current glimmer for the calling user
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getCurrentGlimmer(userId, bot, channelId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val())
          bot.sendMessage({
            to: channelId,
            message: `Current glimmer for <@${userId}>: ${snapshot.val().glimmer}.`
          });
        else
          bot.sendMessage({
            to: channelId,
            message: `No glimmer for <@${userId}>.`
          });
      });
    }
    catch (e) {
      logger.error(`Error in getCurrentGlimmer for ${userId}: ${e}.`);
    }
  },

  // @summary gets current light level only (no loadout) for the calling user
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getCurrentLight(userId, bot, channelId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          const currentLight = lightLevel.calculateLightLevel(snapshot.val());
          bot.sendMessage({
            to: channelId,
            message: `Current light level for <@${userId}>: **${currentLight}**.`
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in getCurrentLight for ${userId}: ${e}.`);
    }
  },

  // @summary buys an engram for the calling user
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  getEngram(userId, bot, channelId) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val()) {
          if (snapshot.val().glimmer < 100) {
            bot.sendMessage({
              to: channelId,
              message: `I'm sorry. You don't have enough glimmer to buy an engram. Engrams cost **100** glimmer. You have **${snapshot.val().glimmer}** glimmer.`
            });

            return;
          }

          snapshot.ref.update({ glimmer: snapshot.val().glimmer - 100 });
          let currentLight = lightLevel.calculateLightLevel(snapshot.val())
          let engramTier = lightLevel.determineEarnedEngram(currentLight);
          // grab a random item from the armory of this tier
          const items = this.database.ref(`armory/${engramTier.name}`);
          items.once('value', itemSnapshot => {
            const tierItems = [];
            const snapshotVal = itemSnapshot.val();
            for (let item in snapshotVal)
              tierItems.push(snapshotVal[item]);

            let random = utilities.randomNumberBetween(0, tierItems.length - 1);
            let selectedItem = tierItems[random];
            let engramLightLevel = lightLevel.determineEngramLightLevel(currentLight, engramTier);

            this.updateLightLevel(userId, selectedItem, engramLightLevel);

            // send the message
            let message = `Oh I have a nice ${engramTier.color} ${engramTier.name} engram for you, <@${userId}>! ` +
                          `It it a **${selectedItem.name}** that decrypted at **${engramLightLevel}** light. ` +
                          `*${selectedItem.description}* ` +
                          `${selectedItem.link}`;
            bot.sendMessage({
              to: channelId,
              message
            })
          });
        }
      }); 
    }
    catch (e) {
      logger.error(`Error in getEngram for ${userId}: ${e}.`);
    }
  },

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
  },

  // @summary checks for 300 level gear from vendorengrams.xyz
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  get300Vendors(bot, channelId) {
    try {
      request(`${vendorEngramConfig.api}/getVendorDrops?key=${vendorEngramConfig.key}`, (error, response, body) => {
        // turn body into an array and filter to only vendors who have verified 300 drops
        let vendors = JSON.parse(body).filter(vendor => vendor.type === 3 && vendor.verified === 1);

        // if there are any dropping 300 level gear
        if (vendors.length > 0) {
          // tag our specific vendor engrams role
          let message = `${vendorEngramConfig.roleId} `;
          vendors.forEach(vendor => {
            message += `${vendorEngramConfig.vendors[vendor.vendor]} is currently dropping 300 Power Level gear.\n`;
          });

          // determine when this will likely expire (at the nearest half hour)
          message += `This will **likely** change in `;
          let thisMinute = moment().minute();
          let expireMinutes;
          if (thisMinute < 30) 
            expireMinutes = 30 - thisMinute;
          else
            expireMinutes = 60 - thisMinute;

          message += `**${30 - thisMinute} minutes**.`
          // send the message and set a timeout to delete the message later
          bot.sendMessage({
            to: channelId,
            message
          }, (error, response) => {
            setTimeout(() => {
              bot.deleteMessage({
                channelID: channelId,
                messageID: response.id
              });
            }, expireMinutes * 1000 * 60);
          });
        }
      });
    }
    catch (e) {
      logger.error(`Error in get300Vendors for: ${e}.`);
    }
  },

  // @summary battles an enemy from the selected tier
  // @param userId - calling user
  // @param bot - this bot, duh
  // @channelId - id of the channel to write to
  // @param tier - the tier of enemy to battle
  battle(userId, bot, channelId, tier) {
    try {
      const user = this.database.ref(`users/${userId}`);
      user.once('value', snapshot => {
        if (snapshot.val().battleCooldown) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}>, you are exhausted from your previous battle. You must take time to recover.`
          });

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
        let enemyLight = utilities.randomNumberBetween(battleConfig.enemyLightConfig[tier].min * lightLevel.maxLight, battleConfig.enemyLightConfig[tier].max * lightLevel.maxLight);
        let yourLight = lightLevel.calculateLightLevel(snapshot.val());
        let chanceToWin = battleConfig.calculateChanceToWin(yourLight, enemyLight, tier);
        let won = false;

        let message = `<@${userId}>, ${battleConfig.battleStartMessages[battleStartMessageIndex]} ${battleConfig.enemyConfig[enemyRaceIndex].locations[enemyLocationIndex]}, you run across a **${selectedEnemy}** at **${enemyLight} light**. `;
        message += `At your current light of **${yourLight}** you have a **${chanceToWin}%** chance to win. `;

        message += `${battleConfig.battleCries[battleCryIndex]}. The battle begins.`;

        bot.sendMessage({
          to: channelId,
          message
        });

        let roll = utilities.randomNumberBetween(1, 100);
        if (roll <= chanceToWin)
          won = true;

        // battle is happening
        setTimeout(() => {
          bot.sendMessage({
            to: channelId,
            message: `Pew pew pew!`
          });
        }, 3000);

        setTimeout(() => {
          bot.sendMessage({
            to: channelId,
            message: `Bang bang!`
          });
        }, 5000);

        setTimeout(() => {
          bot.sendMessage({
            to: channelId,
            message: `...`
          });
        }, 7000);

        setTimeout(() => {
          bot.sendMessage({
            to: channelId,
            message: `The dust settles...`
          });
        }, 9000);

        let glimmerWonOrLost = 0;
        // if we won
        if (won) {
          glimmerWonOrLost = battleConfig.calculateGlimmerWon(chanceToWin);
          let randomMessage = battleConfig.successMessages[utilities.randomNumberBetween(0, battleConfig.successMessages.length - 1)];
          let afterMessage = `After a difficult fight <@${userId}>, ${randomMessage} the **${selectedEnemy}**. You walk away the victor, earning **${glimmerWonOrLost} glimmer** in the process.`;
          setTimeout(() => {
            bot.sendMessage({
              to: channelId,
              message: afterMessage
            });
          }, 11000);
        }
        else { // we lost
          glimmerWonOrLost = battleConfig.calculateGlimmerLost(chanceToWin);
          let randomMessage = battleConfig.defeatMessages[utilities.randomNumberBetween(0, battleConfig.defeatMessages.length - 1)];
          let afterMessage = `After a difficult fight <@${userId}>, ${randomMessage} the **${selectedEnemy}**. You walk away defeated, losing **${glimmerWonOrLost} glimmer** in the process.`;
          setTimeout(() => {
            bot.sendMessage({
              to: channelId,
              message: afterMessage
            });
          }, 11000);
        }

        console.log(glimmerWonOrLost);
        // add a battle cooldown
        user.update({ battleCooldown: true });

        user.update({ glimmer: snapshot.val().glimmer + (won ? Number(glimmerWonOrLost) : Number(0 - glimmerWonOrLost)) });

        // remove the battle cooldown in minutes
        setTimeout(() => {
          user.update({ battleCooldown: false });
        }, (tier <= 3 ? 180000 : tier * 100000));
      });
    }
    catch (e) {
      logger.error(`Error in battle for user: ${userId}: ${e}.`);
    }
  }
}

export default api;
