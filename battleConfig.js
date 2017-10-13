export default {
  enemyConfig: [
    {
      name: 'Cabal',
      structure: ['War Beast', 'Psion', 'Legionaire', 'Phalanx', 'Incendior', 'Gladiator', 'Centurion', 'Colossus'],
      locations: ['Earth', 'IO', 'Nessus', 'The Almighty']
    },
    {
      name: 'Hive',
      structure: ['Thrall', 'Cursed Thrall', 'Acolyte', 'Wizard', 'Knight', 'Shrieker', 'Ogre', 'Abyssal Champion'],
      locations: ['Titan']
    },
    {
      name: 'Fallen',
      locations: ['Earth', 'Titan', 'Nessus'],
      structure: ['Shank', 'Dreg', 'Vandal', 'Marauder', 'Captain', 'Baron', 'Archon', 'Kell']
    },
    {
      name: 'Vex',
      locations: ['Nessus'],
      structure: ['Harpy', 'Goblin', 'Hobgoblin', 'Fanatic', 'Minotaur', 'Hydra', 'Cyclops', 'Gorgon']
    },
  ],

  enemyLightConfig: [
    {
      min: .75,
      max: .95,
      c1: .2642,
      c2: 19.736
    },
    {
      min: .95,
      max: 1.2,
      c1: .2508,
      c2: 14.749
    },
    {
      min: 1.1,
      max: 1.4,
      c1: .2341,
      c2: 9.7659
    },
    {
      min: 1.3,
      max: 1.6,
      c1: .2074,
      c2: 7.7926
    },
    {
      min: 1.4,
      max: 1.9,
      c1: .180602,
      c2: 5.8194
    },
    {
      min: 1.7,
      max: 2.3,
      c1: .153846,
      c2: 3.84615
    },
    {
      min: 2,
      max: 7.5,
      c1: .0936455,
      c2: 1.90635
    },
    {
      min: 6.5,
      max: 10,
      c1: .0468227,
      c2: .653177
    }
  ],

  /// @summary - calculates the users chance to win a battle based on their light, the enemy light and the enemy tier
  // @param yourlight - current users light
  // @param enemyLight - enemyLight, between min/max of tier above
  // @param tier - tier of enemy, can be seen above
  // @returns chance user has to win battle against enemy
  calculateChanceToWin(yourLight, enemyLight, enemyTier) {
    let chanceToWin = (((this.enemyLightConfig[enemyTier].c1 * yourLight + this.enemyLightConfig[enemyTier].c2) + (yourLight * 100 / enemyLight)) / 2).toFixed(2);
    return chanceToWin >= 100 ? 99.99 : chanceToWin;
  },

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
    'The enemgy seems threatening, but you don\'t want Cayde to make fun of you',
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