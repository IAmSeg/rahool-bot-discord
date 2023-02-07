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
  maxLight: 550,
  
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
    return Math.round(kineticLight + energyLight + powerLight + helmetLight + gauntletsLight + chestLight + legsLight + classLight);
  },

  rarityTiers: [
    { name: 'Common',
      min: 0,
      max: .3333,
      color: 'white',
      level: 0,
      minInc: 15,
      maxInc: 100
    },
    { name: 'Uncommon',
      min: .2667,
      max: .6,
      color: 'green',
      level: 1,
      minInc: 25,
      maxInc: 60
    },
    { name: 'Rare',
      min: .5333,
      max: .8,
      color: 'blue',
      level: 2,
      minInc: 5,
      maxInc: 48
    },
    { name: 'Legendary',
      min: .7333,
      max: .9667,
      color: 'purple',
      level: 3,
      minInc: 5,
      maxInc: 15 
    },
    { name:'Exotic',
      min: .9333,
      max: 1,
      color: 'gold',
      specialChance: 40,
      level: 4,
      minInc: 3,
      maxInc: 9
    }
  ],

  /// @summary determines which tier of engram a user will earn based on their current light level
  /// @param currentLight - calling user's current light level
  /// @return the tier of engram the user has earned
  determineEarnedEngram(currentLight) {
    let eligibleTiers = this.rarityTiers.filter(tier => {
      return (currentLight <= (tier.max * this.maxLight) && currentLight >= (tier.min * this.maxLight));
    });

    if (eligibleTiers.length == 1) {
      // if they're only in exotic range, we need to include legendaries also
      if (eligibleTiers[0].name === 'Exotic')
        eligibleTiers = this.rarityTiers.filter(tier => tier.name === 'Exotic' || tier.name === 'Legendary');
      else
        return eligibleTiers[0];
    }

    let higherTier = eligibleTiers[0].level < eligibleTiers[1].level ? eligibleTiers[1] : eligibleTiers[0];
    let lowerTier = eligibleTiers[0].level < eligibleTiers[1].level ? eligibleTiers[0] : eligibleTiers[1];
    // progress to max of highest eligible tier
    // determine which tier we will get an engram in
    // (currentLight - lowerMin) / (higherMax - lowerMin)
    let progress = ((currentLight - (lowerTier.min * this.maxLight)) / ((higherTier.max * this.maxLight) - (lowerTier.min * this.maxLight))) * 100;
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
    // dont let engrams go over their max, unless we are at or above 96.667% to max light
    if (newLight > Math.floor(engramTier.max * this.maxLight) && currentLight < Math.floor(this.maxLight * 0.9667))
      newLight = (engramTier.max * this.maxLight);

    // if the engram tier is exotic, it can go above max light
    if (engramTier.name === 'Exotic') {
      let exoticMax = Math.floor(this.maxLight * engramTier.max);
      return Math.floor(newLight > exoticMax ? exoticMax : newLight);
    }
    else
      return Math.floor(newLight > this.maxLight ? this.maxLight : newLight);
  }
}

export default lightLevelConfig;
