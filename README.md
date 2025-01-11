# json-enc-custom
This is a [custom extension](https://github.com/bigskysoftware/htmx-extensions/tree/main?tab=readme-ov-file#defining-an-extension) for htmx, it takes the parameters from encodeParameters, and parse the names of the forms like the examples below:
## Install
```html
<script src="https://cdn.jsdelivr.net/gh/Emtyloc/json-enc-custom@main/json-enc-custom.js"></script>
```
## Examples
```html
EXAMPLE 1: Basic Keys
<form hx-ext='json-enc-custom'>
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
  "shiny":  true
}
```

```html
EXAMPLE 2: Multiple Values
<form hx-ext='json-enc-custom'>
  <input type='number' name='bottle-on-wall' value='1'>
  <input type='number' name='bottle-on-wall' value='2'>
  <input type='number' name='bottle-on-wall' value='3'>
</form>

// produces
{
  "bottle-on-wall":   [1, 2, 3]
}
```
```html
EXAMPLE 3: Deeper Structure
Support Array and Object (index split by [] or dot)
<form hx-ext='json-enc-custom'>
  <input name='pet[species]' value='Dahut'>
  <input name='pet.name' value='Hypatia'>
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
  <input name='hearbeat[3]' value='thunk'>
</form>

// produces
{
    "hearbeat":   ["thunk", null, null, "thunk"]
}
```
```html
EXAMPLE 5: return boolean for Checkbox by attribute "jec-boolean-checkbox"
<form hx-ext='json-enc-custom' ignore-parse-types >
  <input name='name' value='Bender'>
  <input name='age' type="number" value='18'>
  <input type='checkbox' name='shiny' checked>
</form>

// produces
{
  "name":   "Bender",
  "age":    "18",
  "shiny":  "on"
}
```

```html
EXAMPLE 6: Even Deeper
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
EXAMPLE 7: Such Deep
<form hx-ext='json-enc-custom'>
  <input name='wow[such][deep][3][much][power][!]' value='Amaze'>
  <input name='wow.such.deep.3.much.power.dot' value='Amaze-Dot'>
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
                            "!":   "Amaze",
                            "dot": "Dot-Amaze",
                        }
                    }
                }
            ]
        }
    }
}
```
```html
EXAMPLE 8: Bad input
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
references: https://www.w3.org/TR/html-json-forms/


