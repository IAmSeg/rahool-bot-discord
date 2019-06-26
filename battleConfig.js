import utilities from './utilities';

export default {
  enemyConfig: [
    {
      name: 'Cabal',
      structure: ['War Beast', 'Psion', 'Legionaire', 'Phalanx', 'Incendior', 'Gladiator', 'Centurion', 'Colossus'],
      locations: ['Earth', 'IO', 'Nessus', 'The Almighty, Mars, Mercury']
    },
    {
      name: 'Hive',
      structure: ['Thrall', 'Cursed Thrall', 'Acolyte', 'Wizard', 'Knight', 'Shrieker', 'Ogre', 'Abyssal Champion'],
      locations: ['Titan, Mars']
    },
    {
      name: 'Fallen',
      locations: ['Earth', 'Titan', 'Nessus'],
      structure: ['Shank', 'Dreg', 'Vandal', 'Marauder', 'Captain', 'Baron', 'Archon', 'Kell']
    },
    {
      name: 'Vex',
      locations: ['Nessus', 'Mercury'],
      structure: ['Harpy', 'Goblin', 'Hobgoblin', 'Fanatic', 'Minotaur', 'Hydra', 'Cyclops', 'Gorgon']
    },
    {
      name: 'Scorn',
      locations: ['Tangled Shore', 'Dreaming City'],
      structure: ['Screeb', 'Stalker', 'Ravager', 'Wraith', 'Raider', 'Abomination', 'Chieftain']
    },
    {
      name: 'Taken',
      locations: ['IO', 'Dreaming City'],
      structure: ['Vandal', 'Thrall', 'Acolyte', 'Captain', 'Wizard', 'Knight', 'Ogre', 'Hydra', 'Centurion']
    }
  ],

  raidBosses: [
    { 
      name: 'The Vault of Glass',
      bosses: [
        'The Oracles',
        'The Templar',
        'The Gorgons',
        'The Gatekeepers',
        'Atheon, Time\'s Conflux',
      ],
      successMessage: 'you conquer time and emerge victorious. *Now how do we leave?* .......\n *Where are we...?*\n*When are we...?*',
      defeatMessage: 'You are forever lost in the dark corners of time.'
    },
    { 
      name: 'The Ocean of Storms',
      bosses: [
        'The Gatekeeper Knights',
        'Ir Yut, The Deathsinger',
        'The Oversoul',
        'Crota, Son of Oryx'
      ],
      successMessage: 'you quell the Hive abominations and stop their rituals... *For now.*',
      defeatMessage: 'You fall to the Hive, doomed to dwell in their pit of darkness forever.'
    },
    { 
      name: 'The Prison of Elders',
      bosses: [
        'Skolas, Kell of Kells'
      ],
      successMessage: 'you defeat the Prisoner and descend below the Prison to claim your rewards.',
      defeatMessage: 'You are a disgrace to House Judgement'
    },
    { 
      name: 'The Dreadnaught',
      bosses: [
        'The Warpriest',
        'Golgoroth',
        'The Daughters of Oryx',
        'Oryx, The Taken King'
      ],
      successMessage: 'you emerge victorious in the Hive Throne World and claim strength by the Sword Logic.',
      defeatMessage: 'You fail in the Hive Throne World and dissolve into the blade of your superior, your strength taken by the Sword Logic.'
    },
    { 
      name: 'The Perfection Complex',
      bosses: [
        'Vosik, the Archpriest',
        'The Siege Engine',
        'Aksis, Archon Prime'
      ],
      successMessage: 'you quell the corruption of SIVA and defeat those who have been augmented with its abilities.',
      defeatMessage: 'You are consumed by SIVA, lost to the corruption of this all powerful organism.'
    },
    { 
      name: 'The Leviathan',
      bosses: [
        'Emperor Calus',
        'Argos, Planetary Core',
        'Val Ca\'uor'
      ],
      successMessage: 'You have pleased Emperor Calus once again.',
      defeatMessage: 'You have failed Emperor Calus and will be punished accordingly.'
    },
    { 
      name: 'The Dreaming City',
      bosses: [
        'Kalli',
        'Shuro Chi',
        'Riven of A Thousand Voices'
      ],
      successMessage: 'Your wish of victory and riches has been granted.',
      defeatMessage: 'You have been defeated and are doomed to suffer your death over and over for eternity.'
    },
    { 
      name: 'The Leviathan',
      bosses: [
        'Gahlran',
      ],
      successMessage: 'The Emporer is pleased with your performance and grants you riches of opulence. ',
      defeatMessage: 'You have disappointed the Emperor.'
    }
  ],

  raidLightConfig: {
    min: 10,
    max: 20,
    c1: .0579176,
    c2: -1.5444,
  },

  raidGlimmerConfig: {
    min: 50000,
    max: 200000
  },

  enemyLightConfig: [
    {
      min: .05,
      max: .15,
      c1: .2642,
      c2: 19.736
    },
    {
      min: .15,
      max: .35,
      c1: .2508,
      c2: 14.749
    },
    {
      min: .40,
      max: .65,
      c1: .2341,
      c2: 9.7659
    },
    {
      min: .6,
      max: .9,
      c1: .2074,
      c2: 7.7926
    },
    {
      min: .85,
      max: 1.2,
      c1: .180602,
      c2: 5.8194
    },
    {
      min: 1,
      max: 1.55,
      c1: .153846,
      c2: 3.84615
    },
    {
      min: 1.85,
      max: 2.5,
      c1: .0936455,
      c2: 1.90635
    },
    {
      min: 2,
      max: 3.5,
      c1: .0468227,
      c2: .653177
    }
  ],

  enemyGlimmerConfig: [
    {
      min: 1,
      max: 100,
    },
    {
      min: 100,
      max: 200,
    },
    {
      min: 200,
      max: 300
    },
    {
      min: 300,
      max: 500
    },
    {
      min: 500,
      max: 700
    },
    {
      min: 700,
      max: 900
    },
    {
      min: 900,
      max: 2000 
    },
    {
      min: 2500, 
      max: 5000 
    }
  ],

  // @summary - calculates the users chance to win a battle based on their light, the enemy light and the enemy tier
  // @param yourlight - current users light
  // @param enemyLight - enemyLight, between min/max of tier above
  // @param tier - tier of enemy, can be seen above
  // @returns chance user has to win battle against enemy
  calculateChanceToWin(yourLight, enemyLight, enemyTier) {
    // raid boss
    if (enemyTier === 9) {
      let chanceToWin = (((this.raidLightConfig.c1 * yourLight + this.raidLightConfig.c2) + (yourLight * 100 / enemyLight)) / 2).toFixed(2);
      if (chanceToWin < 0)
        return .01;
      if (chanceToWin > 100)
        return 99.99;

      return chanceToWin;
    }
    else {
      let chanceToWin = (((this.enemyLightConfig[enemyTier].c1 * yourLight + this.enemyLightConfig[enemyTier].c2) + (yourLight * 100 / enemyLight)) / 2).toFixed(2);
      return chanceToWin >= 100 ? 99.99 : chanceToWin;
    }
  },

  // @summary - calculates the users glimmer they will win 
  // @param chanceToWin - users chance to win, calculated above
  // @param tier - tier of enemy, can be seen above
  // @returns glimmer won against the enemy
  calculateGlimmerWon(chanceToWin, tier) {
    // raid boss
    if (tier === 9) {
      return Math.floor(utilities.randomNumberBetween(this.raidGlimmerConfig.min, this.raidGlimmerConfig.max) * (1 + (1 - (chanceToWin / 100))));
    }
    return Math.floor(utilities.randomNumberBetween(this.enemyGlimmerConfig[tier].min, this.enemyGlimmerConfig[tier].max) * (1 + (1 - (chanceToWin / 100))));
  },

  // @summary - calculates the users glimmer they will lose
  // @param chanceToWin - users chance to win, calculated above
  // @param tier - tier of enemy, can be seen above
  // @returns glimmer lost against the enemy
  calculateGlimmerLost(chanceToWin, tier) {
    // raid boss
    if (tier === 9) {
      return Math.floor(utilities.randomNumberBetween(this.raidGlimmerConfig.min, this.raidGlimmerConfig.max / 8) * (1 + (chanceToWin / 100)));
    }
    return Math.floor(utilities.randomNumberBetween(this.enemyGlimmerConfig[tier].min, this.enemyGlimmerConfig[tier].max / 5) * (1 + (chanceToWin / 100)));
  },

  battleStartMessages: [
    'While patrolling on',
    'After landing on the transmat zone on',
    'While farming for materials on',
    'After tbagging your dead teammate on',
    'Upon exiting the brothel on',
    'While grocery shopping on'
  ],

  battleCries: [
    'You are not scared',
    '*This will be an easy fight*, you think to yourself',
    '*Watch this*, you say to your ghost',
    'The enemy seems threatening, but you don\'t want Cayde to make fun of you',
    'You are frightened, but you don\'t want to let the Vanguard down.',
    'You are scared out of your mind, but you want to make Shaxx proud'
  ],

  successMessages: [
    'you ultimately defeat',
    'you single-handedly destroy',
    'you win against',
    'you claim victory over',
    'you emerge victorious over',
    'you come out unscathed against' 
  ],

  defeatMessages: [
    'you ultimately fall to',
    'you are defeated by',
    'you lose against',
    'your light is defeated by',
    'you simply cannot handle',
    'you barely escape alive against' 
  ]
}