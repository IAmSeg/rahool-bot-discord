import moment from 'moment';

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
  },

  // @summary gets the minutes since time
  minutesSince(time) {
    return Math.abs((moment().unix() - time) / 60).toFixed(2);
  }
}

export default utilities;
