/**
 * Initializes the extension and registers it with HTMX.
 *
 * @see https://htmx.org/api/#defineExtension
 *
 * @param {string} name - The extension name
 * @param {Partial<HtmxExtension>} extension - The extension definition object.
 */
htmx.defineExtension('json-enc-custom', {
    /**
     * Init saves the provided reference to the internal HTMX API.
     *
     * @param {import("../htmx").HtmxInternalApi} api
     * @returns void
     */
    init: function(apiRef) {
      // store a reference to the internal API.
      this._api = apiRef;
  
      // Define the flag as a possess property
      this._flagArray = ':flagArray';
    },
  
    onEvent: function(name, evt) {
      if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json';
      }
    },
  
    encodeParameters: function(xhr, parameters, elt) {
      xhr.overrideMimeType('text/json');
  
      // User configuration options.
      this._config = {
        'ignoreParseTypes': this._api.hasAttribute(elt, 'ignore-parse-types')
      };
  
      return this._encodingAlgorithm(parameters, elt);
    },
  
    /**
     * Encodes form data into a JSON object using the custom algorithm.
     *
     * @param {FormData} parameters - Form data to encode.
     * @param {Element} elt - The element providing the context for encoding.
     * @returns {Object} A JSON string representing the encoded parameters.
     */
    _encodingAlgorithm: function(parameters, elt) {
      let resultingObject = Object.create(null);
  
      for (let [name, value] of Object.entries(parameters)) {
        const input = elt.elements[name];
        let inputType;
        if (Array.isArray(value)) {
          inputType = input[0].type
        } else {
          inputType = input.type
        }
  
        this._setValueByPath(resultingObject, name, value, inputType)
      }
  
      this._clearFlagArray(resultingObject);
      return JSON.stringify(resultingObject);
    },
  
    /**
     * Sets a value in the resulting object at the specified path.
     *
     * @param {Object} obj - The target object to set the value in.
     * @param {String} path - The path where the value should be set (e.g., 'a.b[0].c').
     * @param {String} value - The value to set at the specified path.
     * @param {String} inputType - The type of input element (e.g., "text", "number").
     * @returns void
     */
    _setValueByPath: function(obj, path, value, inputType) {
      if (!this._config.ignoreParseTypes) {
        value = this._convertValue(value, inputType);
      }
  
      // Convert 'a[b][c]' or 'a.b[c]' to ['a', 'b', 'c']
      const pathParts = path.replace(/\]/g, '').split(/\[|\./);
  
      let current = obj;
      for (let i = 0; i < pathParts.length; i++) {
        const key = pathParts[i];
  
        // If 'key' is a number, mark the parent as an array.
        if (!isNaN(key)) {
          current[this._flagArray] = true;
        }
  
        if (i === pathParts.length - 1) {
          current[key] = value; // Set the value at the final path part
        } else {
          // If the key doesn't exist or isn't an object, create an empty object
          if (typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
          }
          current = current[key]; // Move deeper into the object
        }
      }
    },
  
    /**
     * Converts a form input value to the appropriate data type.
     *
     * @param {Object|String} value - The element values
     * @param {String} inputType - The type of the input element (e.g., "number", "checkbox").
     * @returns {Object|Number|Boolean} The converted value.
     * @returns void
     */
    _convertValue: function(value, inputType) {
      if (inputType == 'number' || inputType == 'range') {
        return Array.isArray(value) ? value.map(Number) : Number(value);
      } else if (inputType === 'checkbox') {
        return value === 'on';
      }
      return value;
    },
  
    /**
     * Converts flagged objects into arrays where applicable.
     *
     * If an object contains the this._flagArray property, it is converted to an array
     * with the appropriate size based on the maximum index in the object.
     *
     * @param {Object} obj - The object to process.
     * @returns void
     */
    _clearFlagArray: function(obj) {
      for (const key in obj) {
        const current = obj[key]
  
        if (typeof current === 'object' && current !== null) {
          if (current.hasOwnProperty(this._flagArray)) {
            delete(current[this._flagArray])
  
            const length = Math.max(...Object.keys(current)) + 1;
            const arr = new Array(length);
  
            for (const i in current) {
              arr[i] = current[i]
              this._clearFlagArray(current[i])
            }
  
            obj[key] = arr
          } else {
            // call the function recursively for nested object
            this._clearFlagArray(obj[key]);
          }
        }
      }
    }
  });