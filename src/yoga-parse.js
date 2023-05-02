const cheerio = require('cheerio');
const yoga = require('yoga-layout-prebuilt');
const enums = require('../node_modules/yoga-layout-prebuilt/yoga-layout/dist/YGEnums.js');

// yoga-wasm-web

class yogaHTMLParser {
  constructor(debug) {
    this.debug = debug;
    this.entryIdx = 0;
    this.yogaRootNode = null;
    this.userData = {};
  }

  /**
   * Parses a CSS rule and applies it to the corresponding Yoga method on the provided HTML node object.
   *
   * @param {object} node - The HTML node object to apply the CSS rule to.
   * @param {string} key - The CSS key.
   * @param {string} value - The CSS value.
   * @returns {void}
   */
  callYogaMethod(node, key, value) {
    value = value.toLowerCase(); // normalize Ex: 10Px, 10pX, etc.

    // default
    let mName = 'set' + key.replace(/^([a-z])|-([a-z])/g, function(match) {
      return match[match.length - 1].toUpperCase();
    });
    let mArg = [value];

    // specified edges
    let dEdge = function(name, arg) {
      name = name.replace(/(Top|Left|Bottom|Right)$/, d => {
        arg = [yoga['EDGE_' + d.toUpperCase()], ...arg]
        return "";
      });
      if (name == 'set') name = 'setPosition';
      return [name, arg];
    }

    // convert value into yoga enum style
    let toYEnum = function(k, v) {
      k = k.replace(/Content|Items|Self/, '');
      k = k.replace(/([A-Z])/g, '_$1').slice(4).toUpperCase()
      v = v.replace('-', '_').toUpperCase()
      return enums[k + '_' + v];
    }

    // parse % and px args
    let cvtScalar = function(vt, v) {
      return v.map(d => vt.test(d) ? parseFloat(d) : d);
    }

    // test keys and values and change method names &| args
    // Includes: enum lookups, enums changing the method name, and setDisplayType
    // BUG: NO TEST FOR SETPOSITION W TWO DIFFERENT SCALARS
    // margin 1px 1% 1px 1%
    let callMods = [
      // setPosition
      // { kTest: /^setPosition$/, xlate: (k, v) => [k, [yoga.EDGE_ALL, ...v]] },
      // add default edge
      { kTest: /^set(Border|Margin|Padding)$/, xlate: (k, v) => [k, [yoga.EDGE_ALL, ...v]] },
      // add specified edge & setPositionType
      { kTest: /(Top|Right|Bottom|Left)$/, xlate: dEdge },
      // percent  width
      { vTest: /^\d+%$/, xlate: (k, v) => [k + 'Percent', cvtScalar(/^\d+%$/, v)] },
      // px
      { kTest: /(?!Percent)$/, vTest: /^\d+px$/, xlate: (k, v) => [k, cvtScalar(/^\d+px$/, v)] },
      // value: auto - must be parsed before other enums
      { kTest: /^(?!setAlign).*$/, vTest: /auto/, xlate: (k, v) => [k + 'Auto', []] },
      // other enums
      { vTest: /^[a-z-]+$/, xlate: (k, v) => [k, [toYEnum(k, v[0])]] },
    ];

    callMods.forEach(d => {
      let kt = (d.kTest || /.*/).test(mName);
      let vt = mArg.map(e => (d.vTest || /.*/).test(e)).includes(true); // run on every element
      if (kt && vt)[mName, mArg] = d.xlate(mName, mArg, d.kTest, d.vTest);
    });

    if (Object.keys(node.__proto__).includes(mName)) {
      if (this.debug) console.log('INVOKE', mName, mArg);
      node[mName](...mArg);
    } else {
      if (this.debug) console.warn(`Yoga Method ${mName} not supported.`);
      this.getUserData(node).unparsedCSS.push({ key, value });
    }
  }

  /**
   * Decomposes a compound CSS rule into its individual components.
   *
   * @param {array} rule - The key-value CSS rule to decompose.
   * @return {array} An array of key-value pairs representing the individual components of the CSS rule.
   */
  decomposeCSSRule(rule) {
    const key = rule[0];
    const values = rule[1].split(' ');

    // if not decomposable then throw an error
    if (/^(?!border-width$|margin$|padding$)/.test(key) && values.length > 1)
      throw new Error(`Cannot decompose compound rule.: ${rule}`);

    if (/^(border-width|margin|padding)/.test(key)) {
      switch (values.length) {
        case 1:
          return [rule];

        case 2:
          return [
            [`${key}-top`, values[0]],
            [`${key}-right`, values[1]],
            [`${key}-bottom`, values[0]],
            [`${key}-left`, values[1]]
          ];

        case 3:
          return [
            [`${key}-top`, values[0]],
            [`${key}-right`, values[1]],
            [`${key}-bottom`, values[2]],
            [`${key}-left`, values[1]]
          ];

        case 4:
          return [
            [`${key}-top`, values[0]],
            [`${key}-right`, values[1]],
            [`${key}-bottom`, values[2]],
            [`${key}-left`, values[3]]
          ];

        default:
          return [
            [`${key}-top`, '0px'],
            [`${key}-right`, '0px'],
            [`${key}-bottom`, '0px'],
            [`${key}-left`, '0px']
          ];
      }
    } else {
      return [rule];
    }
  }

  /**
   * Sets arbitrary user data for the given Yoga node.
   * @param {Object} key - The Yoga node to set the user data for.
   * @param {Object} value - The user data to set for the Yoga node.
   * @returns {void}
   */
  setUserData(key, value) {
    this.userData[key.__nbindPtr] = value;
  }

  /**
   * Gets the arbitrary user data for the given Yoga node.
   * @function
   * @name getUserData
   * @param {Object} node - The Yoga node object for which to get the user data.
   * @returns {Object} The data stored for the given Yoga node.
   */
  getUserData(key) {
    return this.userData[key.__nbindPtr];
  }

  /**
   * Parses HTML attributes
   *
   * @param {string array} attrs - The attributes
   * @return {object} The root yoga node
   */
  parseHtmlAttrs(attrs) {
    // create node & put in dict by path
    let node = yoga.Node.create();
    if (!this.yogaRootNode) this.yogaRootNode = node;
    this.setUserData(node, { idx: this.entryIdx++, unparsedCSS: [] });

    (attrs || []).forEach(d => { // only id or style
      if (d.name == 'style') {
        // parse rule arrays, decompose compound rules
        let ruleArray = d.value.replace(/;\s*$/, '')
          .split(';').flatMap(d => {
            d.trim();
            return this.decomposeCSSRule(d.split(':').map(d => d.trim()));
          });

        ruleArray.forEach(e => {
          this.callYogaMethod(node, ...e)
        })
      }
    })
    return node;
  }


  /**
   * Generates a tree of yoga nodes corresponding to the parsed HTML. 
   * 
   * @param {object} node - The HTML node to generate the yoga node tree for.
   * @param {array} parents - An array containing the parent HTML tags.
   * @param {object} parentYogaNode - The parent yoga node if any.
   * 
   * @returns {object} - The root yoga node of the generated tree.
   */
  genNodeTree(node = this.$root, parents = [], parentYogaNode) {
    // Get the tag name and attributes of the current node
    const tagName = node.name;
    const attributes = node.attribs;

    // Create an array of objects containing attribute names and values
    const attributeArray = Object.keys(attributes).map(key => ({ name: key, value: attributes[key] }));

    // Print out the tag name, parent names, and attribute array
    if (this.debug) {
      console.log();
      console.log(`Tag: ${tagName}`);
      console.log(`Parents: ${parents.join(' > ')}`);
      console.log(`Attributes: ${JSON.stringify(attributeArray)}`);
    }

    let yogaNode = this.parseHtmlAttrs(attributeArray);
    // attach yoga node to html node for querying
    node.yogaNode = yogaNode;

    if (parentYogaNode) {
      let cCount = parentYogaNode.getChildCount();
      parentYogaNode.insertChild(yogaNode, cCount);
    }

    // Recursively traverse the children of the current node
    node.children.forEach(childNode => {
      if (childNode.type === 'tag') {
        this.genNodeTree(childNode, [...parents, tagName], yogaNode);
      }
    });
  }

  /**
   * Parses an HTML string and returns a Cheerio object.
   *
   * @param {string} htmlString - The HTML string to parse.
   * @returns {void} 
   */
  loadHTML(htmlString) {
    const options = {
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
    };

    // Load the HTML string into Cheerio
    this.$ = cheerio.load(htmlString, options, false);
    this.$root = this.$('*').get(0)
  }

  /**
   * Calculates and returns the layout information for a given root node.
   * @param {Object} node - The node for which to calculate the layout.
   * @returns {Object} - An object containing the layout information for the root node.
   **/
  getCalculatedLayout(node = this.yogaRootNode) {
    // node.calculateLayout();
    return node.getComputedLayout();
  }

  /**
   * Retrieves all the nodes in a tree, and invokes the callback function for each node.
   * 
   * @param {YogaNode} node - The root node of the tree.
   * @param {function(YogaNode)} callback - The function to invoke for each node found.
   * 
   * @returns {void}
   */
  getNodes(callback, node = this.yogaRootNode) {
    const childCount = node.getChildCount();
    this.yogaRootNode.calculateLayout();
    if (callback) callback(node, this.getCalculatedLayout(node), this.getUserData(node));

    for (let i = 0; i < childCount; i++) {
      const childNode = node.getChild(i);
      this.getNodes(callback, childNode);
    }
  }

  /**
   * Parses the given HTML string into Cheerio / Yoga objects and does the callback.
   *
   * @param {string} htmlStr - The HTML string to be parsed.
   * @param {Function} callback - The function to be called yoga node, layout, userdata arguments.
   * @returns {void}
   */
  parse(htmlStr, callback) {
    this.loadHTML(htmlStr);
    this.genNodeTree();
    this.getNodes(callback);
  }

  getById(query) {
    let htmlEl = this.$('#' + query).get(0);
    this.yogaRootNode.calculateLayout();
    if (htmlEl)
      return { layout: this.getCalculatedLayout(htmlEl.yogaNode), userData: this.getUserData(htmlEl.yogaNode) }
    return { layout: undefined, userData: undefined };
  }
}

module.exports = yogaHTMLParser;