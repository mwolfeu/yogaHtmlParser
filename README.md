# yogaHtmlParser
A Node library that takes an HTML string and parses/decomposes css rules and returns the layout. 

Note: The flex library does not handle compound css rules.  In general, stick to "one rule one argument" forms.  That said, for margin, border-width, and padding the 2, 3, and 4 argument versions are parsable.  

Note: Yoga can only use px and % units.

Note: Use border-width instead of border

## Usage

npm i yogaHtmlParser

### Add to your node project:

const yogaHTMLParser = require('yoga-html-parser.js');

let yhp = new yogaHTMLParser();

## API

`genNodeTree(node)`: Generates a tree of Yoga nodes corresponding to the parsed HTML.

`parse(htmlString)`: Parses an HTML string and returns a Cheerio object.

`getCalculatedLayout(node)`: Calculates and returns the layout information for a given root node.

`getNodes(node, callback)`: Retrieves all the nodes in a tree and invokes the callback function for each node found.

`getById(HtmlID)`: Retrieves a nodes by HTML id and returns the layout and user data.

`parseWithCallback(htmlStr, callback)`: Parses the given HTML string into Cheerio/Yoga objects and invokes the callback function with Yoga node, layout, and userdata arguments.

User data is attached to every node.  By default it is populated with a node index and an array of unparsed CSS rules.

Calling parse and getCalculatedLayout is the equivalent of just calling parseWithCallback.

The callback will be called once per HTML element with the arguments (YogaNode, Layout, UserData).

See examples in the test directory.