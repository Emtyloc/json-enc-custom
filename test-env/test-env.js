const formIndex = 1;
const expectedResultIndex = 2;
const actualResultIndex = 3;
const diffIndex = 4;

const waitForRequestToHappenTimeout = 50; // milliseconds
const waitForAllTestsToComplete = 250; // milliseconds
let lastTestIndex = 0; // last test case index (changed when new test cases are added)

function addTestCase(testCaseKey, testCase, expectedResult) {
    lastTestIndex++;
    if (testCaseKey != lastTestIndex) {
        throw new Error(`Test case key doesn't match test case index: ${testCaseKey} != ${lastTestIndex}`);
    }

    const testCases = document.getElementById('test-cases');
    const newTestCase = document.createElement('tr');
    newTestCase.id = `test-case-${lastTestIndex}`;

    expectedResult = JSON.stringify(JSON.parse(expectedResult)) // minifies json
    newTestCase.innerHTML = `
        <th>${lastTestIndex}</th>
        <th>
            ${testCase}
        </th>
        <th>${expectedResult}</th>
        <th></th>
        <th></th>
    `;

    newTestCase.children[formIndex].querySelector("form").setAttribute("hx-target", `#test-case-${lastTestIndex}`)
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
    testCases.forEach(function(testCase) {
        const form = testCase.querySelector("tr th form");
        form.requestSubmit();
    })
}

function setActualResult(testCase, result) {
    testCase.children[actualResultIndex].innerHTML = result;
}

function checkTestResult(testCase) {
    const form = testCase.children[formIndex];
    const expected = testCase.children[expectedResultIndex];
    const actual = testCase.children[actualResultIndex];
    const diff = testCase.children[diffIndex];

    const diffContent = diffString(expected.innerHTML, actual.innerHTML);
    if (diffContent.length === 0) {
        diff.innerHTML = "✅";
        form.classList.add("pass");
        return true
    } else {
        diff.innerHTML = diffContent;
        form.classList.add("fail");
        return false
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
    results.innerHTML = `Passed ${passed}/${total} tests - ${(passed * 100 / total).toFixed(2)}% success rate`
}

window.onload = function() {
    let passedCount = 0;    

    document.addEventListener("htmx:beforeSend", function(evt) {
        const testCase = evt.detail.target; // the hx-target in form is always set to the parent element on purpose
        setTimeout(function() {
            setActualResult(testCase, evt.detail.xhr.capturedBody); // filling the Actual Result column
            passed = checkTestResult(testCase); // coloring test case and filling the Diff column 
            if (passed) {
                passedCount++;
            }
        }, waitForRequestToHappenTimeout);
    })

    replaceDefaultRequestSender(); // replacing XMLHTTPRequest sender
    submitAllForms(); // submitting all forms to run the test

    setTimeout(
        function() {
            setTestResults(passedCount, lastTestIndex)
        }, waitForAllTestsToComplete
    );
}