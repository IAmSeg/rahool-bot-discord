const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
import Api from './api';
import utilities from './utilities';
import vendorEngramsConfig from './vendorEngramsConfig';

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

var randomGames = [
  'Stealing your glimmer...',
  'Try !commands',
  'Hoarding exotics...',
  'Snorting bright dust',
  'Rubbing Ikora\'s head',
  'Polishing Zavala\'s armor',
  'Stealing Cayde\'s cloak',
  'Thinking of Petra',
  'Dismantling shaders',
  'Teabagging Tyra Karn'
];

bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');

  setInterval(() => {
    let rand = utilities.randomNumberBetween(0, randomGames.length - 1);
    bot.setPresence({ status: 'online', game: { name: randomGames[rand] }});
  }, 60000);
});


bot.on('message', function (user, userId, channelId, message, evt) {
  const api = new Api(bot, channelId);
  try {
    // dont respond to ourself
    if (userId == bot.id)
      return;

    // add 5 glimmer to user per message
    if (message[0] !== '!' && message.length >= 10)
      api.updateGlimmer(userId, user);

    // gamble
    if (message.split(' ')[0] === '!gamble') {
      let amount = message.split(' ')[1];
      api.gambleGlimmer(userId, amount);
    }

    // get current glimmer for a user
    if (message === '!glimmer')
      api.getCurrentGlimmer(userId);

    // get current light for a user
    if (message === '!light')
     api.getCurrentLight(userId);

    if (message === '!buyengram') {
      let roll = Math.floor(utilities.randomNumberBetween(1, 100));
      if (roll < 5)
        api.rahoolIsADick(userId);
      else
        api.getEngram(userId);
    }

    if (message === '!lightrank')
      api.getLightRank();

    if (message === '!loadout')
      api.getLoadout(userId);

    if (message === '!gamblehelp') {
      let message = `<@${userId}> type !gamble amount to gamble your glimmer. The bot will roll a number between 1 and 100. The higher the number, the better payout you will receive. If the number is very low, you may lose your glimmer. Gamble wisely!`;
       bot.sendMessage({
         to: channelId,
         message
      });
    }

    if (message === '!bankamount')
      api.getBankAmount();

    if (message === '!howtorobbank') {
      let message =`The global glimmer bank is protected by a secret number that is randomized between 1 and 100 constantly. `;
      message += `You can attempt to rob the glimmer bank by guessing the secret number. If you guess it correctly, you will open the vault and escape with all the glimmer. `;
      message += `If you guess wrong and are caught by the glimmer police, you will be fined. Type **!robbank guess** to attempt.`;
       bot.sendMessage({
         to: channelId,
         message
      });
    }

    // try to rob the bank
    if (message.split(' ')[0] === '!robbank') {
      let guess = message.split(' ')[1];
      if (!guess) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}>, you should probably guess a secret number (1-100) if you wanna rob the bank. **!robbank SECRET_NUMBER**`
        });
      }
      api.robBank(userId, guess);
    }


    if (message === '!gambleodds') {
      // 17% chance of winning your gamble, 
      // 12% chance of doubling your wager, 
      // 5% chance of tripling it
      // 23% chance of breaking even, 
      // 36% chance of losing the gamble,
      // 7% chance of losing double your gamble
      // the higher the roll the better
      let message = `<@${userId}> the gambling odds are: \n` +
                    `7% chance to lose double your glimmer (1-7).\n`+
                    `36% chance to lose your original amount (8-43).\n`+
                    `23% chance of breaking even (44-66).\n` +
                    `17% chance of winning your original amount (67-83).\n` +
                    `12% chance of winning double your gamble (84-95).\n` +
                    `5% chance of tripling your gamble (96-100).`;
      bot.sendMessage({
        to: channelId,
        message
      });
    }

    // battle
    if (message.split(' ')[0] === '!battle') {
      let tier = message.split(' ')[1];
      if (!tier || isNaN(tier) || tier < 1 || tier > 8) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}>, please select a tier (1-8) of enemy to battle. **!battle ENEMY_TIER**`
        });
      }
      else 
        api.battle(userId, tier);
    }

    if (message === '!battlelog') 
      api.getBattleLog(userId);

    if (message === '!battlecooldown')
      api.getBattleCooldown(userId);

    //loan
    if (message.split(' ')[0] === '!loan') {
      if (message.split(' ').length < 3) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}> please specify an amount and someone to loan to. **!loan amount @user**.`
        })
      }
      else {
        let amount = Number(message.split(' ')[1]);
        if (amount < 1) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}> you can't loan less than 1 glimmer.`
          });
        }
        else {
          let loanTo = message.split(' ')[2];

          // extract the loanTo id from the <@id> string
          // sometimes there's a random ! at the beginning also
          let loanToId = loanTo.substring(2, loanTo.length - 1);
          if (loanToId[0] == '!') 
            loanToId = loanToId.substring(1, loanTo.length - 1);

          if (isNaN(loanToId)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that user doesn't exist.`
            });
          }
          else if (isNaN(amount)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that isn't a number, dumbass.`
            });
          }
          else 
            api.loan(userId, amount, loanToId);
        }
      }
    }

    // repay loan
    if (message.split(' ')[0] === '!repay') {
      if (message.split(' ').length < 3) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}> please specify an amount and someone to repay. **!repay amount @user**.`
        })
      }
      else {
        let amount = Number(message.split(' ')[1]);
        if (amount < 1) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}> you can't repay less than 1 glimmer.`
          });
        }
        else {
          let repayTo = message.split(' ')[2];

          // extract the repayTo id from the <@id> string
          // sometimes there's a random ! at the beginning also
          let repayToId = repayTo.substring(2, repayTo.length - 1);
          if (repayToId[0] == '!') 
            repayToId = repayToId.substring(1, repayTo.length - 1);

          if (isNaN(repayToId)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that user doesn't exist.`
            });
          }
          else if (isNaN(amount)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that isn't a number, dumbass.`
            });
          }
          else 
            api.repay(userId, amount, repayToId);
        }
      }
    }

    // collect loan
    if (message.split(' ')[0] === '!collect') {
      if (message.split(' ').length < 3) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}> please specify an amount and someone to collect from. **!collect amount @user**.`
        })
      }
      else {
        let amount = Number(message.split(' ')[1]);

        if (amount < 1) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}> you can't collect less than 1 glimmer.`
          });
        }
        else {
          let collectFrom = message.split(' ')[2];

          // extract the collectFrom id from the <@id> string
          // sometimes there's a random ! at the beginning also
          let collectFromId = collectFrom.substring(2, collectFrom.length - 1);
          if (collectFromId[0] == '!') 
            collectFromId = collectFromId.substring(1, collectFrom.length - 1);

          if (isNaN(collectFromId)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that user doesn't exist.`
            });
          }
          else if (isNaN(amount)) {
            bot.sendMessage({
              to: channelId,
              message: `<@${userId}> that isn't a number, dumbass.`
            });
          }
          else 
            api.collect(userId, amount, collectFromId);
        }
      }
    }

    // check who you owe to
    if (message === '!debt') 
      api.getDebt(userId);

     // check who you owe to
    if (message === '!loans') 
      api.getLoans(userId);

    // more info on loan system
    if (message === '!loansystem') {
      let message = `The Global Glimmer Bank mediates all loans between users.\n`;
      message += `If you !loan an amount to someone, the full amount is taken from your glimmer and added to theirs immediately.\n`;
      message += `If you !collect on a loan, the loanee pays the full amount, but the Global Glimmer Bank takes 20% of the collection amount from the loaner as a collection fee.\n`;
      message += `If you !repay on a loan, the Global Glimmer Bank is pleased about your repayment and will pay 20% of your debt for you. The loanee pays 80% of the debt. The loaner will also receive 20% interest on the repayment from the Global Glimmer Bank.\n`;
      message += `Loanees cannot !repay if they do not have enough glimmer, but collectors can !collect no matter how much glimmer the loanee has. Be responsible with other people's glimmer!`;
      bot.sendMessage({
        to: channelId,
        message
      });
    }

    // mainframe fragementation rate
    if (message === '!frag') {
      api.getFragmentationRate();
    }

    if (message.split(' ')[0] === '!defrag') {
      if (message.split(' ').length < 2) {
        bot.sendMessage({
          to: channelId,
          message: `<@${userId}> please specify an amount to donate to defragmentation repairs. **!defrag AMOUNT**`
        });
      }
      else {
        let amount = Number(message.split(' ')[1]);
        if (amount< 1 ) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}> come on. **!defrag AMOUNT**`
          });
        }
        if (isNaN(amount)) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}> that isn't a number. **!defrag AMOUNT**`
          });
        }
        else 
          api.defragGlimmerMainframe(userId, amount);
      }
    }

    // raid protocol
    if (user.indexOf('Seg') != -1 || user.indexOf('king') != -1) {
      if (message === '!raid') 
        api.raid(userId);

      if (message.split(' ')[0] === '!joinraid') {
        if (message.split(' ').length < 2) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}>, please specify a raid id to join. **!joinraid RAID_ID**`
          });

          return;
        }

        let raidId = message.split(' ')[1];
        if (isNaN(raidId)) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}>, that is not a valid raid id. **!joinraid RAID_ID**`
          });

          return;
        }

        api.joinRaid(userId, raidId);
      }

      if (message.split(' ')[0] === '!startraid') {
        if (message.split(' ').length < 2) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}>, please specify a raid id to start. **!startraid RAID_ID**`
          });

          return;
        }

        let raidId = message.split(' ')[1];
        if (isNaN(raidId)) {
          bot.sendMessage({
            to: channelId,
            message: `<@${userId}>, that is not a valid raid id. **!startraid RAID_ID**`
          });

          return;
        }

        api.startRaid(userId, raidId);
      }
    }

    if (message === '!aboutfrag') {
      let message = `Glimmer is a programmable currency which is kept track of in the Glimmer Mainframe. With each glimmer transaction, the Mainframe hardware fragments, and the volatility of the glimmer economy rises. If the Mainframe reaches 100% fragmentation, it will crash, `;
      message += `destroying the glimmer economy and wiping all glimmer from the system. Larger transactions fragment the Mainframe faster. Type **!frag** to check the current fragmentation rate.`;
      bot.sendMessage({
        to: channelId,
        message
      });
    }

    if (message === '!glimmereconomy') {
      let message = `Glimmer is a programmable currency which is kept track of in the Glimmer Mainframe (like a ledger to a crypto currency). Each time you type a message of at least a certain length, you "mine" or "farm" glimmer and it is distributed by the Glimmer Mainframe.\n`;
      message += `Half of the farmed glimmer goes to you, half goes to the Global Glimmer Bank.\n`
      message += `The Global Glimmer Bank helps you with transactions and keeps track of loans/debts/collections/repayments. It will also pay you for certain endeavors, such as eliminating threats to our people by winning battles.\n`
      message += `Glimmer can be used to buy engrams, loaned, gambled, or donated to the Glimmer Mainframe to help with defragmentation repairs.\n`;
      message += `With each glimmer transaction, the Glimmer Mainframe becomes slightly more fragmented, based on the amount of glimmer being transacted. If the Mainframe hits 100% fragmentation, the economy will collapse and all glimmer will be lost.\n`;
      message += `The only way to generate new glimmer is to farm it, or to win it from gambling (gambling is an advanced mining/farming protocol that can generate glimmer extremely fast).\n`;
      message += `The only way to remove glimmer from the economy is to use it to repair fragmentation within the Glimmer Mainframe.\n`;
      bot.sendMessage({
        to: channelId,
        message
      });
    }

    // list all commands
    if (message === '!commands') {
      let message = `Current available commands: \n`;
      message += `**!glimmer** - Check your current glimmer.\n`;
      message += `**!glimmereconomy** - More information about how the glimmer economy works.\n`;
      message += `**!buyengram**- Buy an engram from Rahool for 100 glimmer.\n`;
      message += `**!light** - Check your current light level.\n`;
      message += `**!lightrank** - Check the light level of everyone in the server, ranked highest to lowest.\n`;
      message += `**!loadout** - Check your current loadout.\n`;
      message += `**!gamble AMOUNT** - Gamble AMOUNT of glimmer.\n`;
      message += `**!gamblehelp** - More information on how gambling wins or losses are determined.\n`;
      message += `**!gambleodds** - Check the current house gambling odds.\n`;
      message += `**!robbank SECRET_GUESS** - Attempt to rob the Global Glimmer Bank by guessing the secret vault number (1-100).\n`;
      message += `**!howtorobbank** - More informatoin on how to rob the Global Glimmer Bank.\n`;
      message += `**!bankamount** - Check the current Global Glimmer Bank amount.\n`;
      message += `**!battle ENEMY_TIER** - Battles an enemy in your selected tier (1-8).\n`;
      message += `**!battlecooldown** - Check your current battle cooldown time.\n`;
      message += `**!battlelog** - Check your total battle wins/losses/glimmer.\n`;
      message += `**!loan AMOUNT @user** - Loan AMOUNT glimmer to a user.\n`;
      message += `**!collect AMOUNT @user** - Collect a loan of AMOUNT glimmer from @user who you have loaned to.\n`;
      message += `**!repay AMOUNT @user** - Repay a loan of AMOUNT glimmer to @user who has loaned glimmer to you.\n`;
      message += `**!loans** - Check the amount of glimmer you have loaned out.\n`;
      message += `**!debt** - Check how much glimmer you are in debt (how much you have been loaned).\n`;
      message += `**!loansystem** - More information about how the loan/repay/collect system works.\n`;
      message += `**!frag** - Check the current Glimmer Mainframe fragmentation rate.\n`;
      message += `**!defrag AMOUNT** - Donate AMOUNT glimmer to defragmentation repairs of the Glimmer Mainframe.\n`;
      message += `**!aboutfrag** - More information about how the Glimmer Mainframe fragmentation works.\n`;

      bot.sendMessage({
        to: channelId,
        message
      });
    }
  }
  catch (e) {
    api.error();
    logger.error(`Error in general bot commands: ${e}.`);
  }
});

// set interval to check for 300 level vendor engrams
setInterval(() => {
  try {
    let vendorApi = new Api(bot, vendorEngramsConfig.channelId)
    vendorApi.get300Vendors();
  }
  catch (e) {
    logger.error(`Error getting vendor engrams: ${e}.`);
  }
}, 480000);


// disconnect
bot.on('disconnect', function(msg, code) {
  logger.info(`Bot disconnected from Discord with code ${code}, message: ${msg}.`)
  bot.connect();
});
