const utilities = {
  // @summary returns a random number between min and max inclusive
  // @param - min number
  // @param - max number
  // @returns - random number between min and max
  randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  },

  // @summary gets a random item from an array
  // @param arr - array to get random item from
  // @returns - random item from arr
  getRandomFrom(arr) {
    return arr[this.randomNumberBetween(0, arr.length - 1)];
  }
}

export default utilities;
