import moment from 'moment';

const utilities = {
  // @summary returns a random number between min and max inclusive
  // @param - min number
  // @param - max number
  // @returns - random number between min and max
  randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  // @summary returns a random number between min and max inclusive, not floored, to 2 decimal places
  // @param - min number
  // @param - max number
  // @returns - random number between min and max
  randomNumberBetweenTo2(min, max) {
    return (Math.random() * (max - min + 1) + min).toFixed(2);
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
  },
  
  // @summary determines a users level based on their messageCount in the server
  determineLevel(messageCount) {
    return Math.floor(messageCount / 10);
  }
}

export default utilities;
