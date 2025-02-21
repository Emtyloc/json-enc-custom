/**
 * @typedef onEvent
 * Register a handler for all htmx events. Override the request Content-Type to `application/json` 
 * @param {string} name Event name
 * @param {Event|CustomEvent} evt Event object
 * 
 * @typedef encodeParameters
 * Takes FormData specified by the user and returns an encoded string.
 * @param {XMLHttpRequest} xhr Request object to send to the server
 * @param {FormData} parameters Raw form data
 * @param {Node} elt Node that owns the request
 * @returns *|string|null
 * 
 * @typedef encodingAlgorithm
 * Merge form data and hx-include data and encode to a JSON string. Apply type parsing if requested.
 * @param {FormData} parameters Raw form data as provided by the user
 * @param {Node} elt Node that owns the request
 * @param {NodeList} includedElt Other elements that shall be considered for this request (hx-include)
 * @returns *|string|null
 * 
 * @typedef parseValues
 * Parse the value of one FormData parameter
 * @param {Node} elt Node that owns the request
 * @param {NodeList} includedElt Other elements that shall be considered for this request (hx-include)
 * @param {string} name Parameter name
 * @param {*} value Parameter value
 * @returns Parsed values with correct types
 * 
 * @typedef parseElementValue
 * Parse value based on element type. Deals with special handling for checkbox, number, range, select-one, and select-multiple.
 * @param {Node} elt Element owning the parameter
 * @param {*} value Parameter value that shall be parsed
 * @returns Parsed value with correct type
 * 
 * @typedef JSONEncodingPath
 * Parse the parameter name to assess the nesting level needed for construcing the JSON
 * @param {string} name Parameter name
 * @returns {Array} List of nesting instructions
 * 
 * @typedef setValueFromPath
 * Construct the nested object according to the step instrtuctions
 * @param {Object} context Container processed FormData parameters
 * @param {Object} step Nesting instructions for the parameter
 * @param {*} value Parameter value
 * 
 * @typedef getIncludedElement
 * Collect all nodes specified in `hx-include`
 * @param {Node} elt Node owning the request
 * @returns List of extra nodes with parameters to include in this request
 */