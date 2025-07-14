const formIndex = 1;
const expectedResultIndex = 2;
const actualResultIndex = 3;
const diffIndex = 4;

const waitForRequestToHappenTimeout = 50; // milliseconds
const waitForAllTestsToCompleteTimeout = 250; // milliseconds

let lastTestIndex = 0; // last test case index (changed when new test cases are added)
let allowedToFailTestCount = 0; // amount of tests that are allowed to fail

function prettyJSON(jsonString) {
    return JSON.stringify(JSON.parse(jsonString), null, 4)
}

function addTestCase(testCaseKey, testCaseDesc, testCase, expectedResult, allowedToFail) {
    lastTestIndex++;
    if (testCaseKey != lastTestIndex) {
        throw new Error(`Test case key doesn't match test case index: ${testCaseKey} != ${lastTestIndex}`);
    }

    const testCases = document.getElementById('test-cases');
    const newTestCase = document.createElement('tr');
    newTestCase.id = `test-case-${lastTestIndex}`;

    let allowedToFailText = "";
    if (allowedToFail === true) {
        allowedToFailTestCount++;
        newTestCase.classList.add("allowed-to-fail");
        allowedToFailText = "!!! ALLOWED TO FAIL - to fix in the future";
    }

    newTestCase.innerHTML = `
        <th>${lastTestIndex}</th>
        <th>
            <h3 class="allowed-to-fail-text">${allowedToFailText}</h3>
            <p>${testCaseDesc}</p>
            ${testCase}
        </th>
        <th><pre>${prettyJSON(expectedResult)}</pre></th>
        <th></th>
        <th></th>
    `;

    const newTestCaseHTMLPre = document.createElement(`pre`);
    const newTestCaseHTMLContent = document.createTextNode(testCase);
    newTestCaseHTMLPre.appendChild(newTestCaseHTMLContent);

    newTestCase.children[formIndex].appendChild(newTestCaseHTMLPre);
    newTestCase.children[formIndex].querySelector("form").setAttribute("hx-target", `#test-case-${lastTestIndex}`);
    testCases.appendChild(newTestCase);
}

// replaces default XMLHttpRequest send method so when htmx tries 
// to send a request, instead of actually sending it, browser will just 
// add a request body to the object (for using in htmx:beforeSend event listener)
function replaceDefaultRequestSender() {
    XMLHttpRequest.prototype.send = function(body) {
        this.capturedBody = body;
    };
}

// submits all forms in test-cases element
// requestSubmit() method is used because ordinary sumbit()
// method doesn't trigger htmx:beforeSend event
function submitAllForms() {
    const testTable = document.getElementById("test-cases");
    const testCases = Array.from(testTable.children);
    testCases.forEach(function(testCase, index) {
        let elt = testCase.querySelector("tr th div button");
        if (!elt) elt = testCase.querySelector("tr th form");
        if (elt.tagName === "FORM") {
            const inputTypeFile = elt.querySelector('input[type="file"]');
            if (inputTypeFile) {
                let numberOfFiles;
                if (inputTypeFile.hasAttribute("multiple")) {
                    numberOfFiles = 2;
                } else {
                    numberOfFiles = 1;
                }
                simulateFileUpload(inputTypeFile, `test-case-${index + 1}`, "text/plain", numberOfFiles);
            }
            elt.requestSubmit();
        } else if (elt.tagName === "BUTTON") {
            elt.click();
        }
    })
}

function simulateFileUpload(inputElement, fileNameBase, fileType, numberOfFiles) {
    // Create a DataTransfer to simulate the file selection
    const dataTransfer = new DataTransfer();

    for (let i = 0; i < numberOfFiles; i++) {
        const file = new File(["dummy content"], `${fileNameBase}-${i}.txt`, {
            type: fileType,
        });
        dataTransfer.items.add(file);
    }

    inputElement.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    inputElement.dispatchEvent(event);
}

function setActualResult(testCase, result) {
    testCase.children[actualResultIndex].innerHTML = `<pre>${prettyJSON(result)}</pre>`;
}

function checkTestResult(testCase) {
    const form = testCase.children[formIndex];
    const expected = testCase.children[expectedResultIndex];
    const actual = testCase.children[actualResultIndex];
    const diff = testCase.children[diffIndex];

    const diffContent = diffString(
        expected.querySelector("pre").innerHTML, 
        actual.querySelector("pre").innerHTML,
    );
    if (diffContent.length === 0) {
        diff.innerHTML = "✅";
        form.classList.add("pass");
        return true;
    } else {
        diff.innerHTML = diffContent;
        form.classList.add("fail");
        return false;
    }
}

// produces colored diff of two strings
function diffString(expected, actual) {
    if (expected === actual) {
        return "";
    }

    let diff = "";
    let i = 0;
    let j = 0;
  
    while (i < expected.length || j < actual.length) {
      if (i < expected.length && j < actual.length && expected[i] === actual[j]) {
        diff += expected[i];
        i++;
        j++;
      } else if (i < expected.length) {
        diff += `<span class="diff-removed">${expected[i]}</span>`;
        i++;
      } else if (j < actual.length) {
        diff += `<span class="diff-added">${actual[j]}</span>`;
        j++;
      }
    }
    
    return diff;
}

function setTestResults(passed, total) {
    const results = document.getElementById("test-results");
    results.innerHTML = `Passed ${passed}/${total} tests - ${(passed * 100 / total).toFixed(2)}% success rate`;
    results.innerHTML += "<br>(allowed to fail test cases are not counted)";
}

window.onload = function() {
    let passedCount = 0;    

    document.addEventListener("htmx:beforeSend", function(evt) {
        const testCase = evt.detail.target; // the hx-target in form is always set to the parent element on purpose
        setTimeout(function() {
            if (
                evt.detail.requestConfig.headers["Content-Type"] ===
                "multipart/form-data"
            ) {
                // since we will have formData, in the Actual Result column
                // we set formData.get('data') with file name
                const formData = evt.detail.xhr.capturedBody;
                const dataResult = JSON.parse(formData.get("data"));
                const fileResult = formData.getAll("file").map((file) => file.name);
                const result = JSON.stringify({ data: dataResult, files: fileResult });
                setActualResult(testCase, result);
            } else {
                setActualResult(testCase, evt.detail.xhr.capturedBody); // filling the Actual Result column
            }
            passed = checkTestResult(testCase); // coloring test case and filling the Diff column 
            if (passed && !testCase.classList.contains("allowed-to-fail")) { // don't count allowed to fail tests
                passedCount++;
            }
        }, waitForRequestToHappenTimeout);
    })

    replaceDefaultRequestSender(); // replacing XMLHTTPRequest sender
    submitAllForms(); // submitting all forms to run the test

    setTimeout(
        function() {
            setTestResults(passedCount, lastTestIndex - allowedToFailTestCount);
        }, waitForAllTestsToCompleteTimeout
    );
}
