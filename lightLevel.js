import utilities from './utilities';

// Light level calculation is as follows:
// Kinetic: 14.3%
// Energy: 14.3%
// Power: 14.3%
// Helmet: 11.9%
// Gauntlets: 11.9%
// Chest: 11.9%
// Legs: 11.9%
// Class item: 9.5%


const lightLevelConfig = {
  maxLight: 300,
  
  // config for current destiny calculation of light levels
  kineticMult: .143,
  energyMult: .143,
  powerMult: .143,
  helmetMult: .119,
  gauntletsMult: .119,
  chestMult: .119,
  legsMult: .119,
  classMult: .095,

  calculateLightLevel(user) {
    const kineticLight = user.itemLightLevels.kineticLight * this.kineticMult;
    const energyLight = user.itemLightLevels.energyLight * this.energyMult;
    const powerLight = user.itemLightLevels.powerLight * this.powerMult;
    const helmetLight = user.itemLightLevels.helmetLight * this.helmetMult;
    const gauntletsLight = user.itemLightLevels.gauntletsLight * this.gauntletsMult;
    const chestLight = user.itemLightLevels.chestLight * this.chestMult;
    const legsLight = user.itemLightLevels.legsLight * this.legsMult;
    const classLight = user.itemLightLevels.classLight * this.classMult;
    return Math.floor(kineticLight + energyLight + powerLight + helmetLight + gauntletsLight + chestLight + legsLight + classLight);
  },

  rarityTiers: [
    { name: 'Common',
      min: 0,
      max: 100,
      color: 'white',
      level: 0,
      minInc: 5,
      maxInc: 26
    },
    { name: 'Uncommon',
      min: 80,
      max: 180,
      color: 'green',
      level: 1,
      minInc: 5,
      maxInc: 12
    },
    { name: 'Rare',
      min: 160,
      max: 240,
      color: 'blue',
      level: 2,
      minInc: 2,
      maxInc: 8
    },
    { name: 'Legendary',
      min: 220,
      max: 290,
      color: 'purple',
      level: 3,
      minInc: 0,
      maxInc: 5
    },
    { name:'Exotic',
      min: 280,
      max: 300,
      color: 'gold',
      specialChance: .2,
      level: 4,
      minInc: 0,
      maxInc: 4
    }
  ],

  /// @summary determines which tier of engram a user will earn based on their current light level
  /// @param currentLight - calling user's current light level
  /// @return the tier of engram the user has earned
  determineEarnedEngram(currentLight) {
    let eligibleTiers = this.rarityTiers.filter(tier => {
      return (currentLight <= tier.max && currentLight >= tier.min);
    });

    if (eligibleTiers.length == 1)
      return eligibleTiers[0];

    // determine which tier we will get an engram in
    // (currentLight - lowerMin) / (higherMax - lowerMin)
    let higherTier = eligibleTiers[0].level < eligibleTiers[1].level ? eligibleTiers[1] : eligibleTiers[0];
    let lowerTier = eligibleTiers[0].level < eligibleTiers[1].level ? eligibleTiers[0] : eligibleTiers[1];
    // progress to max of highest eligible tier
    let progress = ((currentLight - lowerTier.min) / (higherTier.max - lowerTier.min)) * 100;
    let roll = Math.floor(utilities.randomNumberBetween(0, 100));
    let tier = roll <= progress ? higherTier : lowerTier;

    // chance we get an exotic
    if (higherTier.specialChance)
      tier = roll <= higherTier.specialChance ? higherTier : lowerTier;

    return tier;
  },

  /// @summary determines light level of earned engram based on users current light level
  /// @param currentLight - calling user's current light level
  /// @param engramTier - the tier of engram the user earned from the above function
  /// @return the tier of engram the user has earned
  determineEngramLightLevel(currentLight , engramTier) {
    let inc = Math.floor(utilities.randomNumberBetween(engramTier.minInc, engramTier.maxInc));
    let newLight = currentLight + inc;
    // dont let engrams go over their max, unless we are at or above 290 light
    if (newLight > engramTier.max && currentLight < 290)
      newLight = engramTier.max;

    return newLight > 300 ? 300 : newLight;
  }
}

export default lightLevelConfig;
