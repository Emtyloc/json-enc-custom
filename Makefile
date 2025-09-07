minify:
	npx terser json-enc-custom.js -o jec.min.js --compress --mangle
	cat test.html | sed 's/src="json-enc-custom.js"/src="jec.min.js"/' > test.min.html

test-minify: 
	open test.min.html

test:
	open test.html
