/**
 * Tokenizes string to try to find mandates or beginning of mandates
 *
 * @method tokenize
 *
 * @param {String} 'Felix  ruiz  '
 * @param {Integer} min amount of string length to be considered a token
 * @param {Integer} max size of word group to be considered beloninging to a mandate
 *
 * @return {Array}
 *
 *  [ { "location":[0,6],
 *      "sanitizedString":"Felix"
 *      },
 *    { "location":[0,12],
 *      "sanitizedString": "Felix ruiz"}
 *  ]
 *
 *  @public
 */
const tokenize = function tokenize(string, minTokenStringLength = 3 , maxGroupSize = 4){
  let words = string.match(/\S+\s*/g);
  let tokens = [];

  if(!words){
    return tokens;
  }

  for(let i=0; i < words.length; ++i){
    for(let j=i+1; j < i + 1 + maxGroupSize && j <= words.length; ++j){
      let wordsGroup =  words.slice(i, j);
      let token = {location: mapLocationOfWordsGroup(string, words, wordsGroup, i), sanitizedString: wordsToSanitizedString(wordsGroup)};
      if(!token.sanitizedString || token.sanitizedString.length < minTokenStringLength){
        break;
      }
      tokens.push(token);
    }
  }

  return tokens;
};

/**
 * helper function:
 * given a sub array of a words array, we want to know what the location is of these words in the original string
 * @method mapLocationOfWordsGroup
 *
 * @param {string} 'felix  ruiz de arcaute'
 * @param {array} ['felix  ', 'ruiz ', 'de ', 'arcaute']
 * @param {array} ['ruiz ', 'de ']
 * @param {int}   e.g 1 (index of the words array where the location should start)
 *
 * @return {array} [7, 14]
 *
 * @private
 */
const mapLocationOfWordsGroup = function mapLocationOfWordsGroup(origString, words, wordsGroup, currentWordsIndex){
  let subString = wordsGroup.join("").trim();
  let startIndex = words.slice(0, currentWordsIndex).join("").length;
  let origStringIndex = origString.indexOf(subString, startIndex);
  return [origStringIndex, origStringIndex + subString.length];
};

/**
 * Joins array of words and trims them and make nice string
 *
 *   @method wordsToSanitizedString
 *
 *   @param {array} words
 *
 *   @return {string}
 *
 *   @private
*/
const wordsToSanitizedString = function wordsToSanitizedString(words){
  return words.map(word => word.trim()).join(" ");
};

export {
  tokenize
}
