'use strict';

htmx.defineExtension('json-enc', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            evt.detail.headers['Content-Type'] = "application/json";
        }
    },

    encodeParameters: function (xhr, parameters, elt) {
        xhr.overrideMimeType('text/json');
        encodingAlgorithm(parameters);
        return (JSON.stringify(parameters));
    }
});


function encodingAlgorithm(parameters) {
    let resultingObject = Object.create(null);
    const PARAM_NAMES = Object.keys(parameters);
    const PARAM_VALUES = Object.values(parameters);
    const PARAM_LENGHT = PARAM_NAMES.length;

    for (let param_index = 0; param_index < PARAM_LENGHT; param_index++) {
        let name = PARAM_NAMES[param_index];
        // Let steps be the result of running the steps to parse a JSON encoding path on the entry's name
        let steps = JSONEncodingPath(name);
        // Let context be set to the value of resulting object.
        let context = resultingObject;


        // For each step in the list of steps, run the following subsubsteps
        for (let step_index = 0; step_index < steps.length; step_index++) {
            // Let the current value be the value obtained by getting the step's key from the current context.
            let current_value = Object.keys(context)[step_index];
            // Run the steps to set a JSON encoding value with the current context, the step, the current value, the entry's value
            // Update context to be the value returned by the steps to set a JSON encoding value ran below.
            context = JSONEncodingValue(context, current_value, steps[step_index], PARAM_VALUES[param_index]);
        }
    }
    // Let result be the value returned from calling the stringify operation with resulting object as its first parameter and the two remaining parameters left undefined.
    // Encode result as UTF-8 and return the resulting byte stream
    let result = JSON.stringify(resultingObject, undefined, undefined);

    console.log(result);
    const encoder = new TextEncoder;
    const encodedBytes = encoder.encode(result);
    console.log(encodedBytes);
}

function JSONEncodingPath(name) {
    // Let path be the path we are to parse.
    let path = name;
    // Let original be a copy of path
    let original = path;
    // Object that represents the failure situation
    const FAILURE = [{ "type": "object", "key": original, "last": true, "append": false, "next_type": null }];
    // Let steps be an empty list of steps.
    let steps = Array();
    // Let first key be the result of collecting a sequence of characters that are not U+005B LEFT SQUARE BRACKET ("[") from the path
    let first_key = String();
    for (let i = 0; i < path.length; i++) {
        if (path[i] !== "[") first_key += path[i];
        else break;
    }
    // If first key is empty, return the failure object.
    if (first_key === "") return FAILURE;
    // Otherwise remove the collected characters from path 
    path = path.slice(first_key.length);
    // and push a step onto steps with its type set to "object",
    // its key set to the collected characters, and its last flag unset
    steps.push({ "type": "object", "key": first_key, "last": false, "append": false, "next_type": null });
    // Loop: While path is not an empty string, run these substeps
    while (path !== "") {
        // If the first two characters in path are
        // U+005B LEFT SQUARE BRACKET ("[") followed by U+005D RIGHT SQUARE BRACKET ("]"),
        // run these subsubsteps
        if (path.length >= 2) {
            if (path[0] === "[" && path[1] === "]") {
                // Set the append flag on the last step in steps.
                let last_step = steps[steps.length - 1];
                last_step["append"] = true;
                steps[steps.length - 1] = last_step;
                // Remove those two characters from path.
                path = path.slice(2);
                // If there are characters left in path, return failure object
                if (path.length > 0) return FAILURE;
                // Otherwise jump to the step labelled loop above
                else continue;
            }
        }
        // If the first character in path is U+005B LEFT SQUARE BRACKET ("["),
        // followed by one or more ASCII digits, 
        // followed by U+005D RIGHT SQUARE BRACKET ("]"), run these subsubsteps
        if (path.length >= 3) {
            if (/^\[\d+\]/.test(path)) {
                // Remove the first character from path.
                path = path.slice(1);
                // Collect a sequence of characters being ASCII digits,
                let collected_digits = path.match(/\d+/)[0]
                // remove them from path,
                path = path.slice(collected_digits.length);
                // and let numeric key be the result of interpreting them as a base-ten integer.
                let numeric_key = parseInt(collected_digits, 10);
                // Remove the following character from path.
                path = path.slice(1);
                // Push a step onto steps with its type set to "array",
                // its key set to the numeric key, and its last flag unset.
                steps.push({ "type": "array", "key": numeric_key, "last": false, "append": false, "next_type": null });
                // Jump to the step labelled loop above
                continue
            }
        }
        // If the first character in path is U+005B LEFT SQUARE BRACKET ("["),
        // followed by one or more characters that are not U+005D RIGHT SQUARE BRACKET,
        // followed by U+005D RIGHT SQUARE BRACKET ("]"), run these subsubsteps
        if (path.length >= 3) {
            if (/^\[[^\]]+\]/.test(path)) {
                // Remove the first character from path.
                path = path.slice(1);
                // Collect a sequence of characters that are not U+005D RIGHT SQUARE BRACKET,
                let collected_characters = path.match(/[^\]]+/)[0];
                // remove them from path, and let object key be the result
                path = path.slice(collected_characters.length);
                let object_key = collected_characters;
                // Remove the following character from path
                path = path.slice(1);
                // Push a step onto steps with its type set to "object",
                // its key set to the object key, and its last flag unset.
                steps.push({ "type": "object", "key": object_key, "last": false, "append": false, "next_type": null });
                // Jump to the step labelled loop above.
                continue;
            }
        }
        // If this point in the loop is reached, return the failure object.
        return FAILURE;
    }
    // For each step in steps, run the following substeps
    for (let step_index = 0; step_index < steps.length; step_index++) {
        // If the step is the last step, set its last flag
        if (step_index === steps.length - 1) {
            let tmp_step = steps[step_index];
            tmp_step["last"] = true;
            steps[step_index] = tmp_step;
        }
        // Otherwise, set its next type to the type of the next step in steps
        else {
            let tmp_step = steps[step_index];
            tmp_step["next_type"] = steps[step_index + 1]["type"];
            steps[step_index] = tmp_step;
        }
    }
    return steps;
}

function JSONEncodingValue(context, current_value, step, value) {
    // Let context be the context this algorithm is called with
    // Let step be the step of the path this algorithm is called with.
    // Let current value be the current value this algorithm is called with.
    // Let entry value be the entry value this algorithm is called with
    let entry_value = value;

    // If step has its last flag set, run the following substeps:
    if (step["last"] === true) {
        // If current value is undefined, run the following subsubsteps:
        if (current_value === undefined) {
            // If step's append flag is set,
            // set the context's property named by the step's key to a new Array containing
            // entry value as its only member.
            if (step["append"] === true) {
                context[step["key"]] = [entry_value];
            }
            // Otherwise, set the context's property named by the step's key to entry value.
            else {
                context[step["key"]] = entry_value;
            }
        }
        // Else if current value is an Array, then get the context's property named by the step's key
        // and push entry value onto it.
        else if (Array.isArray(current_value)) {
            let context_property = context[step["key"]];
            context_property.push(entry_value);
        }
        // Else if current value is an Object and the is file flag is not set,
        // then run the steps to set a JSON encoding value with context set to the current value;
        // a step with its type set to "object", its key set to the empty string,
        // and its last flag set; current value set to the current value's property named by the empty string;
        // the entry value; and the is file flag. Return the result.
        else if (typeof current_value === "object" && current_value !== null) {
            let tmp_step = step;
            tmp_step["type"] = "object";
            tmp_step["key"] = "";
            tmp_step["last"] = true;
            JSONEncodingValue(current_value, current_value[""], tmp_step, entry_value);
        }
        // Otherwise, set the context's property named by 
        // the step's key to an Array containing current value and entry value, in this order.
        else {
            context[step["key"]] = [current_value, entry_value];
        }
        return context;
    }
    // Otherwise, run the following subsubsteps:
    else {
        // If current value is undefined, run the following subsubsteps:
        if (current_value === undefined) {
            // If step's next type is "array",
            // set the context's property named by the step's key to a new empty Array and return it.
            if (step["next_type"] === "array") {
                context[step["key"]] = [];
                return context;
            }
            // Otherwise,set the context's property named by the step's key to a new empty Object and return it.
            else {
                context[step["key"]] = Object.create(null);
                return context;
            }
        }
        // Else if current value is an Object,
        // then return the value of the context's property named by the step's key.
        else if (typeof current_value === "object" && current_value !== null) {
            return context[step["key"]];
        }
        // Else if current value is an Array, then rub the following subsubsteps:
        else if (Array.isArray(current_value)) {
            // If step's next type is "array", return current value.
            if (step["next_type"] === "array") return current_value;
            // Otherwise, run the following subsubsubsteps:
            else {
                // Let object be a new empty Object.
                let object = Object.create(null);
                // For each item and zero-based index i in current value,
                // if item is not undefined then set a property of object named i to item.
                for (let i = 0; i < current_value.length; i++) {
                    let item = current_value[i];
                    if (item !== undefined) object[i] = item;
                    else context[step["key"]] = object;
                }
                return object;
            }
        }
        // Otherwise, run the following subsubsteps
        else {
            // Let object be a new Object with a property named by the empty string set to current value.
            let object = Object.create(null);
            object[""] = current_value;
            // Set the context's property named by the step's key to object.
            context[step["key"]] = object;
            // Return object.
            return object;
        }

    }

}