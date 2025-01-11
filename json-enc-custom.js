htmx.defineExtension('json-enc-custom', {
    onEvent: function(name, evt) {
      if (name === "htmx:configRequest") {
        evt.detail.headers['Content-Type'] = "application/json";
      }
    },
    encodeParameters: function(xhr, parameters, elt) {
      xhr.overrideMimeType('text/json');
      const config = {
        "booleanCheckbox": elt.attributes.hasOwnProperty("jec-boolean-checkbox")
      }
      let encoded_parameters = encodingAlgorithm(config, parameters, elt);
      return encoded_parameters;
    }
  });
  
  function encodingAlgorithm(config, parameters, elt) {
    let resultingObject = Object.create(null);
  
    for (let [name, value] of Object.entries(parameters)) {
      const input = elt.elements[name];
      let inputType;
      if (Array.isArray(value)) {
        inputType = input[0].type
      } else {
        inputType = input.type
      }
  
      setValueByPath(config, resultingObject, name, value, inputType)
    }
  
    clearFlagArray(resultingObject)
    const result = JSON.stringify(resultingObject);
    return result
  }
  
  function convertToInt(input) {
    if (Array.isArray(input)) {
      // Convert array of strings to array of integers
      let data = new Array(input.length)
      for (let i = 0; i < input.length; ++i) {
        data[i] = parseInt(input[i])
      }
      return data;
    } else {
      // Convert single string to integer
      return parseInt(input);
    }
  }
  
  function convertValue(config, value, inputType) {
    if (inputType == "number" || inputType == "range") {
      return convertToInt(value);
    } else if (config.booleanCheckbox && inputType == "checkbox") {
      value = value == "on";
    }
    return value;
  }
  
  function setValueByPath(config, obj, path, value, inputType) {
    value = convertValue(config, value, inputType);
  
    // Convert string path like "a[b][c]" or "a.b[c]" to an array ["a", "b", "c"]
    const pathParts = path.replace(/\]/g, '').split(/\[|\./);
  
    let current = obj;
    for (let i = 0; i < pathParts.length; i++) {
      const key = pathParts[i];
  
      // If "key" is a number, then mark the parent as an array.
      if (!isNaN(key)) {
        current[":flagArray"] = true;
      }
  
      // Last part of the path, set the value
      if (i === pathParts.length - 1) {
        current[key] = value;
      } else {
        // If the key doesn't exist or isn't an object, create an empty object
        if (typeof current[key] !== 'object' || current[key] === null) {
          current[key] = {};
        }
        current = current[key]; // Move deeper into the object
      }
    }
  }
  
  function clearFlagArray(obj) {
    for (const key in obj) {
      const current = obj[key]
      // Check if the value is an object, call the function recursively
      if (typeof current === 'object' && current !== null) {
        if (current.hasOwnProperty(":flagArray")) {
          delete(current[":flagArray"])
  
          // find max of index to create array with this size
          const length = Math.max(...Object.keys(current)) + 1;
          const arr = new Array(length);
  
          // set array value and call 
          for (const i in current) {
            arr[i] = current[i]
            convertIsArray(current[i])
          }
  
          // save Array to object
          obj[key] = arr
        } else {
          // call the function recursively for nested object
          convertIsArray(obj[key]);
        }
      }
    }
  }