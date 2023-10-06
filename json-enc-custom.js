htmx.defineExtension('json-enc-custom', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            evt.detail.headers['Content-Type'] = "application/json";
        }
    },
    encodeParameters: function (xhr, parameters, elt) {
        xhr.overrideMimeType('text/json');
        let encoded_parameters = encodingAlgorithm(parameters);
        return (JSON.stringify(encoded_parameters));
    }
});

function encodingAlgorithm(parameters) {
    let resultingObject = Object.create(null);
    const PARAM_NAMES = Object.keys(parameters);
    const PARAM_VALUES = Object.values(parameters);
    const PARAM_LENGHT = PARAM_NAMES.length;

    for (let param_index = 0; param_index < PARAM_LENGHT; param_index++) {
        let name = PARAM_NAMES[param_index];
        let value = PARAM_VALUES[param_index];
        let steps = JSONEncodingPath(name);
        let context = resultingObject;

        for (let step_index = 0; step_index < steps.length; step_index++) {
            let step = steps[step_index];
            context = setValueFromPath(context, step, value);
        }
    }

    let result = JSON.stringify(resultingObject);
    return result
}


function JSONEncodingPath(name) {
    let path = name;
    let original = path;
    const FAILURE = [{ "type": "object", "key": original, "last": true, "append": false, "next_type": null }];
    let steps = Array();
    let first_key = String();
    for (let i = 0; i < path.length; i++) {
        if (path[i] !== "[") first_key += path[i];
        else break;
    }
    if (first_key === "") return FAILURE;
    path = path.slice(first_key.length);
    steps.push({ "type": "object", "key": first_key, "last": false, "append": false, "next_type": null });
    while (path.length) {
        // []
        if (path[0] === "[" && path[1] === "]") {
            let last_step = steps[steps.length - 1];
            last_step["append"] = true;
            steps[steps.length - 1] = last_step;
            path = path.slice(2);
            if (path.length > 0) return FAILURE;
            else continue;
        }
        // [1...]
        if (/^\[\d+\]/.test(path)) {
            path = path.slice(1);
            let collected_digits = path.match(/\d+/)[0]
            path = path.slice(collected_digits.length);
            let numeric_key = parseInt(collected_digits, 10);
            path = path.slice(1);
            steps.push({ "type": "array", "key": numeric_key, "last": false, "append": false, "next_type": null });
            continue
        }
        // [key]
        if (/^\[[^\]]+\]/.test(path)) {
            path = path.slice(1);
            let collected_characters = path.match(/[^\]]+/)[0];
            path = path.slice(collected_characters.length);
            let object_key = collected_characters;
            path = path.slice(1);
            steps.push({ "type": "object", "key": object_key, "last": false, "append": false, "next_type": null });
            continue;
        }
        return FAILURE;
    }
    for (let step_index = 0; step_index < steps.length; step_index++) {
        if (step_index === steps.length - 1) {
            let tmp_step = steps[step_index];
            tmp_step["last"] = true;
            steps[step_index] = tmp_step;
        }
        else {
            let tmp_step = steps[step_index];
            tmp_step["next_type"] = steps[step_index + 1]["type"];
            steps[step_index] = tmp_step;
        }
    }
    return steps;
}

function setValueFromPath(context, step, value) {
    if (step.last) {
        context[step.key] = value;
    }

    //TODO: make append, merge functionality and file suport.

    //check if the context value already exists
    if (context[step.key] === undefined) {
        if (step.type === "object") {
            if (step.next_type === "object") {
                context[step.key] = {};
                return context[step.key];
            }
            if (step.next_type === "array") {
                context[step.key] = [];
                return context[step.key];
            }
        }
        if (step.type === "array") {
            if (step.next_type === "object") {
                context[step.key] = {};
                return context[step.key];
            }
            if (step.next_type === "array") {
                context[step.key] = [];
                return context[step.key];
            }
        }
    }
    else {
        return context[step.key];
    }


}

