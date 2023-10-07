# json-enc-custom
This is a custom extension for htmx, it takes the parameters from encodeParameters https://htmx.org/extensions/#defining, and parse the names of the forms like the examples below:
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
<form hx-ext='json-enc-custom'>
  <input name='pet[species]' value='Dahut'>
  <input name='pet[name]' value='Hypatia'>
  <input name='kids[1]' value='Thelma'>
  <input name='kids[0]' value='Ashley'>
</form>

// produces
{
    "pet":  {
        "species":  "Dahut"
    ,   "name":     "Hypatia"
    }
,   "kids":   ["Ashley", "Thelma"]
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
            "species":  "Dahut"
        ,   "name":     "Hypatia"
        }
    ,   {
            "species":  "Felis Stultus"
        ,   "name":     "Billie"
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
                null
            ,   null
            ,   null
            ,   {
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
EXAMPLE 10: Bad input
<form hx-ext='json-enc-custom'>
  <input name='error[good]' value='BOOM!'>
  <input name='error[bad' value='BOOM BOOM!'>
</form>

// Produces:
{
    "error": {
        "good":   "BOOM!"
    }
,   "error[bad":  "BOOM BOOM!"
}
```
references: https://www.w3.org/TR/html-json-forms/


