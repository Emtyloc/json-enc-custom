(function () {
    let api;
    htmx.defineExtension('json-enc-custom', {
        init: function (apiRef) {
            api = apiRef
        },
        onEvent: function (name, evt) {
            if (name === "htmx:configRequest") {
                let element = evt.detail.elt;
                if (element.hasAttribute("hx-multipart")) {
                    evt.detail.headers["Content-Type"] = "multipart/form-data";
                } else {
                    evt.detail.headers["Content-Type"] = "application/json";
                }
            }
        },
        encodeParameters: function (xhr, parameters, elt) {
            if (!elt.hasAttribute("hx-multipart")) {
                xhr.overrideMimeType('text/json');
            }

            let encoded_parameters = encodingAlgorithm(parameters, elt);

            return encoded_parameters;
        }
    });

    function encodingAlgorithm(parameters, elt, includedElt) {
        let files = [];
        let resultingObject = Object.create(null);
        const parseTypes = api.getAttributeValue(elt, "parse-types") === "true";

        const names = new Set(Array.from(elt.elements, (e) => e.name));

        for (const name of names) {
            if (name.length === 0) {
                continue;
            }

            let value = parameters.getAll(name);

            if (value.length === 0) {
                value = null;
            } else if (value.length === 1) {
                value = value[0];
            }

            if (value instanceof File) {
                files.push(value);
            } else if (
                Array.isArray(value) &&
                Object.values(value).every((val) => val instanceof File)
            ) {
                files = Object.values(value);
            } else {
                const elements = getChildrenByName(elt, name);

                console.log(elements);

                if (isCheckbox(elements) && value === null) {
                    value = "off";
                } else if (isCheckboxArray(elements) && value === null) {
                    value = [];
                } else if (isSelectMultiple(elements) && !Array.isArray(value)) {
                    if (value === null) {
                        value = [];
                    } else {
                        value = [value];    
                    }
                }
                
                if (parseTypes) {
                    let includedElt = getIncludedElement(elt);
                    value = parseValues(elements, includedElt, value);
                }

                let steps = JSONEncodingPath(name);
                let context = resultingObject;

                for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
                    const step = steps[stepIndex];
                    context = setValueFromPath(context, step, value);
                }
            }
        }

        let result = JSON.stringify(resultingObject);
        if (elt.hasAttribute("hx-multipart")) {
            const formData = new FormData();
            formData.append("data", result);
            for (const file of files) {
                formData.append("file", file);
            }
            return formData;
        } else {
            return result;
        }
    }

    function getChildrenByName(original, name) {
        const match = `[name="${name}"]`;
        // find the closest owning form and use this as the root element for finding matches
        return original.closest('form').querySelectorAll(match);
    }

    function isSelectMultiple(elements) {
        return (
            elements.length === 1 &&
            elements[0] instanceof HTMLSelectElement &&
            elements[0].type === "select-multiple"
        )
    }

    function isCheckbox(elements) {
         return (
            elements.length === 1 &&
            elements[0] instanceof HTMLInputElement &&
            elements[0].type === "checkbox"
        )
    }

    function isCheckboxArray(elements) {
        if (elements.length === 0) {
            return false;
        }
        for (const element of elements) {
            if (!(element instanceof HTMLInputElement && element.type === "checkbox")) {
                return false;
            }
        }
        return true;
    }

    function parseValues(elements, includedElt, value) {
        if (!elements.length && includedElt !== undefined) {
            // "hx-include" allows CSS query selectors which may return an specific node, e.g a single input
            if (includedElt.matches(match)) {
                elements = [includedElt]
            } else {
                elements = includedElt.querySelectorAll(match);
            }
        }

        if (!Array.isArray(value)) return parseElementValue(elements[0], value);

        if (isSelectMultiple(elements)) {
            const elt = elements[0];
            const convertToNumber = checkAllPossibleOptionsAreNumbers(elt);
            for (let index = 0; index < value.length; index++) {
                let arrayValue = value[index]
                if (convertToNumber) {
                    arrayValue = Number(arrayValue);
                }
                value[index] = parseElementValue(elt, arrayValue);
            }
            return value;
        }
        
        if (isCheckboxArray(elements)) {
            for (let index = 0; index < elements.length; index++) {
                let array_elt = elements[index];
                value[index] = parseElementValue(array_elt, null);
            }
        } else {
            for (let index = 0; index < value.length; index++) {
                let array_elt = elements[index];
                let array_value = value[index];
                value[index] = parseElementValue(array_elt, array_value);
            }
        }

        return value;
    }

    function parseElementValue(elt, value) {
        switch (true) {
        case elt instanceof HTMLInputElement:
            switch (elt.type) {
            case "checkbox":
                return elt.checked;
            case "number":
            case "range": 
                return Number(value);
            }
            break;
        case elt instanceof HTMLSelectElement:
            if (elt.type === "select-one" && checkAllPossibleOptionsAreNumbers(elt)) {
                return Number(value);
            }
            break;
        }        
        return value;
    }

    function checkAllPossibleOptionsAreNumbers(elt) {
        const values = [...elt.options].map(o => o.value);
        if (values.length == 0) {
            return true;
        }
        for (const value of values) {
            if (isNaN(Number(value))) {
                return false;
            }
        }
        return true;
    }

    function JSONEncodingPath(name) {
        let path = name;
        let original = path;
        const FAILURE = [{ "type": "object", "key": original, "last": true, "next_type": null }];
        let steps = Array();
        let first_key = String();
        for (let i = 0; i < path.length; i++) {
            if (path[i] !== "[") first_key += path[i];
            else break;
        }
        if (first_key === "") return FAILURE;
        path = path.slice(first_key.length);
        steps.push({ "type": "object", "key": first_key, "last": false, "next_type": null });
        while (path.length) {
            // []
            if (path.startsWith("[]")) {
                path = path.slice(2);
                steps.push({ "type": "array", "key": null, "last": false, "next_type": null })
                continue;
            }
            // [123...]
            if (/^\[\d+\]/.test(path)) {
                path = path.slice(1);
                let collected_digits = path.match(/\d+/)[0]
                path = path.slice(collected_digits.length);
                let numeric_key = parseInt(collected_digits, 10);
                path = path.slice(1);
                steps.push({ "type": "array", "key": numeric_key, "last": false, "next_type": null });
                continue
            }
            // [abc...]
            if (/^\[[^\]]+\]/.test(path)) {
                path = path.slice(1);
                let collected_characters = path.match(/[^\]]+/)[0];
                path = path.slice(collected_characters.length);
                let object_key = collected_characters;
                path = path.slice(1);
                steps.push({ "type": "object", "key": object_key, "last": false, "next_type": null });
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
            if (step.key === null) {
                if (value === null) {
                    return context
                }
                if (step.type === "array") {
                    if (!Array.isArray(value)) {
                        context[0] = value;
                    } else {
                        for (const i in value) {
                            context[i] = value[i];
                        }
                    }
                }
                return context;
            } else if (value !== null) {
                context[step.key] = value;  
                return context[step.key];
            }
        }

        //TODO: make merge functionality.

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
        } else {
            return context[step.key];
        }
    }

    function getIncludedElement(elt) {
        let includedSelector = api.getClosestAttributeValue(elt, "hx-include");

        if (includedSelector) {
            // "hx-include" can be inherited so `elt` will not always be the root element
            let eltWithInclude = api.getClosestMatch(elt, function(e) {
                return e.matches(`[hx-include="${includedSelector}"]`);
            })

            return api.querySelectorExt(eltWithInclude, includedSelector)
        }
    }
})()