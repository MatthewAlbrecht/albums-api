module.exports.getMean = (array) => array.reduce((object, element, i) => {
    if (object.hasOwnProperty(element)) {
      object[element]++
    } else {
      object[element] = 1
    }
    if (array.length - 1 === i) {
      let result = { prop: null, value: null }
      for (const prop in object) {
        const value = object[prop];
        result = !result.value ? { prop, value } : value > result.value ? { prop, value } : result 
      }
      return result.prop
    }
    return object
  }, {})