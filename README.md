# json-enc-custom

This is a [custom extension](https://github.com/bigskysoftware/htmx-extensions/tree/main?tab=readme-ov-file#defining-an-extension) for [htmx](https://htmx.org/), it takes the parameters from `encodeParameters`, and parse the names of the forms like the examples below.
Reference: [W3C HTML JSON form submission](https://www.w3.org/TR/html-json-forms/).

## Install

```html
<script src="https://cdn.jsdelivr.net/gh/Emtyloc/json-enc-custom@main/json-enc-custom.js"></script>
<!-- Pointing to release (More production-safe) -->
<script src="https://cdn.jsdelivr.net/gh/Emtyloc/json-enc-custom@v0.1.0/json-enc-custom.js"></script>
```

## Examples

NB! You can see more example in `test.html`.

By default, the JSON sent uses the browser's form-encoding convention, which means everything is sent as a string. If you want to send parsed data, such as numbers or booleans for checkboxes, use `parse-types="true"`. (The parsing applies for inputs of type `checkbox`, `number`, `range`, `select`).

```html
EXAMPLE 1: Basic Keys
<form hx-ext='json-enc-custom' parse-types="false">
  <input name='name' value='Bender'>
  <select name='hind'>
    <option selected>Bitable</option>
    <option>Kickable</option>
  </select>
  <input type='checkbox' name='shiny' checked>
</form>

// produces
{
  "name":   "Bender",
  "hind":   "Bitable",
  "shiny":  "on"
}
// parse-types="true"
{
  "name":   "Bender",
  "hind":   "Bitable",
  "shiny":  true   
}

NOTES: Unchecked inputs are ignored; this is due to how HTMX and browsers behave.
```
```html
EXAMPLE 2: Multiple Values
<form hx-ext='json-enc-custom' parse-types="true">
  <input type='number' name='bottle-on-wall' value='1'>
  <input type='number' name='bottle-on-wall' value='2'>
  <input type='number' name='bottle-on-wall' value='3'>
</form>

// produces
{
  "bottle-on-wall":   [1, 2, 3]
}
// parse-types="false", with other value or absent
{
  "bottle-on-wall":   ["1", "2", "3"]
}
```
```html
EXAMPLE 3: Deeper Structure
<form hx-ext='json-enc-custom'>
  <input name='pet[species]' value='Dahut'>
  <input name='pet[name]' value='Hypatia'>
  <input name='kids[1]' value='Thelma'>
  <input name='kids[0]' value='Ashley'>
</form>

// produces
{
    "pet":  {
        "species":  "Dahut",
        "name":     "Hypatia"
    },
    "kids":   ["Ashley", "Thelma"]
}
```

```html
EXAMPLE 4: Sparse Arrays
<form hx-ext='json-enc-custom'>
  <input name='hearbeat[0]' value='thunk'>
  <input name='hearbeat[2]' value='thunk'>
</form>

// produces
{
    "hearbeat":   ["thunk", null, "thunk"]
}
```

```html
EXAMPLE 5: Even Deeper
<form hx-ext='json-enc-custom'>
  <input name='pet[0][species]' value='Dahut'>
  <input name='pet[0][name]' value='Hypatia'>
  <input name='pet[1][species]' value='Felis Stultus'>
  <input name='pet[1][name]' value='Billie'>
</form>

// produces
{
    "pet":  [
        {
            "species":  "Dahut",
            "name":     "Hypatia"
        },
        {
            "species":  "Felis Stultus",
            "name":     "Billie"
        }
    ]
}
```

```html
EXAMPLE 6: Such Deep
<form hx-ext='json-enc-custom'>
  <input name='wow[such][deep][3][much][power][!]' value='Amaze'>
</form>

// produces
{
    "wow":  {
        "such": {
            "deep": [
                null,
                null,
                null,
                {
                    "much": {
                        "power": {
                            "!":  "Amaze"
                        }
                    }
                }
            ]
        }
    }
}
```

```html
EXAMPLE 7: Number parsing on select 
<form hx-ext='json-enc-custom'>
  <select name="roles[0]" type="number">
    <option value="1" selected>Role 1</option>
    <option value="2">Role 2</option>
  </select>
</form>

// Produces:
{
  "roles": [1]
}
```

```html
EXAMPLE 10: Bad input
<form hx-ext='json-enc-custom'>
  <input name='error[good]' value='BOOM!'>
  <input name='error[bad' value='BOOM BOOM!'>
</form>

// Produces:
{
    "error": {
        "good":   "BOOM!"
    },
    "error[bad":  "BOOM BOOM!"
}
```

## Testing

To run the tests, simply open `test.html` in your browser.

The tests function by automatically submitting a form from each test case. The resulting HTTP request that HTMX generates is then intercepted and compared against an expected request.

**Isolating a Specific Test Case (Debugging):**

For debugging purposes, you can isolate a specific test case. To do this, add the `isolate-test` query parameter equal to the number of test case you want to isolate.
For example: `http://127.0.0.1:5500/test.html?isolate-test=13`