const StyleDictionaryPackage = require('style-dictionary');

  StyleDictionaryPackage.registerTransform({
    name: 'vsCodeName',
    type: 'name',
    transformer: (token) => {
      // syntax tokens we remove the first part of the object path
      if (token.path[0] === 'syntax') {
        // This allows you to have tokens at multiple levels
        // like `comment` and `comment.line`
        if (token.name === '*') {
          // removes the first and last parts of the path
          return token.path.slice(1,-1).join('.')
        } else {
          // removes the first part of the path which would be 'syntax'
          return token.path.slice(1).join('.')
        }
      } else {
        // Used for application colors
        return token.path.join('.');
      }
    }
  });

// StyleDictionaryPackage.registerTransform({
//     name: 'sizes/px',
//     type: 'value',
//     matcher: function(prop) {
//         // You can be more specific here if you only want 'em' units for font sizes    
//         return ["fontSize", "spacing", "borderRadius", "borderWidth", "sizing"].includes(prop.attributes.category);
//     },
//     transformer: function(prop) {
//         // You can also modify the value here if you want to convert pixels to ems
//         return parseFloat(prop.original.value) + 'px';
//     }
//     });



    // StyleDictionaryPackage.registerFormat({
    //     name: 'css/variables',
    //     formatter: function (dictionary, config) {
    //       return `${this.selector} {
    //         ${dictionary.allProperties.map(prop => `  --${prop.name}: ${prop.value};`).join('\n')}
    //       }`
    //     }
    //   });  
    
// Add a custom format that will generate the VSCode theme JSON
StyleDictionaryPackage.registerFormat({
    name: 'vsCodeTheme',
    formatter: (dictionary, config) => {
      // VSCode theme JSON files have this structure
      const theme = {
        "name": `Arduino ${config.themeType}`,
        "type": config.themeType,
        "colors": {},
      }
      
      // Filter out the design tokens we don't want to add to the
      // 'colors' object. This includes core colors defined in tokens/core.json5
      // and syntax tokens defined in tokens/syntax
      dictionary.allProperties.filter((token) => {
        return !['color','syntax'].includes(token.path[0])
      }).forEach((token) => {
        // Add each token to the colors object, the name is generated by the custom
        // transform defined above
        theme.colors[token.name] = token.value;
      });
      
      // Map the syntax styles
      theme.tokenColors = dictionary.allProperties.filter((token) => {
        return token.path[0] === 'syntax'
      }).map((token) => ({
        scope: token.name,
        settings: {
          foreground: token.value,
          fontStyle: token.fontStyle,
        }
      }));
      
      // Style Dictionary formats expect a string that will be then written to a file
      return JSON.stringify(theme, null, 2);
    }
  });



function getStyleDictionaryConfig(theme) {
  return {
    "source": [
      `tokens/${theme}.json`,
    ],
    "platforms": {
        "vscode": {
            // Directory to build files to
            "buildPath": `theia-themes/`,
            themeType: theme,
            // The name of the custom transform we defined above
            "transforms": ["attribute/cti", "name/cti/kebab","vsCodeName"],
            "files": [{
              // The path the file will be created at. Make sure this matches
              // the file paths defined in the package.json
              "destination": `${theme}.color-theme.json`,
              // The name of the custom format defined above
              "format": "vsCodeTheme",
              "selector": `${theme}-theme`
              
            }]
          }
    //   "web": {
    //     "transforms": ["attribute/cti", "name/cti/kebab", "sizes/px"],
    //     "buildPath": `output/`,
    //     "files": [{
    //         "destination": `${theme}.json`,
    //         "format": "css/variables",
    //         "selector": `.${theme}-theme`
    //       }]
    //   }
    }
  };
}

console.log('Build started...');

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

['default', 'dark'].map(function (theme) {

    console.log('\n==============================================');
    console.log(`\nProcessing: [${theme}]`);

    const StyleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(theme));

    StyleDictionary.buildPlatform('vscode');

    console.log('\nEnd processing');
})

console.log('\n==============================================');
console.log('\nBuild completed!');
