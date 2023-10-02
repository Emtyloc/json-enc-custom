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
        let steps = parseJSONPath(name);
        // Let context be set to the value of resulting object.
        let context = resultingObject;


        // For each step in the list of steps, run the following subsubsteps
        for (let step_index = 0; step_index < steps.length; step_index++) {
            // Let the current value be the value obtained by getting the step's key from the current context.
            let current_value = Object.keys(context)[step_index];
            // Run the steps to set a JSON encoding value with the current context, the step, the current value, the entry's value
            // Update context to be the value returned by the steps to set a JSON encoding value ran below.
            context = encodingJSONValue(context, current_value, steps[step_index], PARAM_VALUES[param_index]);
        }

        // Let result be the value returned from calling the stringify operation with resulting object as its first parameter and the two remaining parameters left undefined.
        // Encode result as UTF-8 and return the resulting byte stream
        let result = JSON.stringify(resultingObject, undefined, undefined);
        const encoder = new TextEncoder;
        const encodedBytes = encoder.encode(result);
        console.log(encodedBytes);
    }
}

function parseJSONPath(parameter_name) {
    console.log(parameter_name);
}

function encodingJSONValue(context, current_value, step) {
    console.log()
}