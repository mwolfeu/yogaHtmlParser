const yogaHTMLParser = require('../src/yoga-parse.js');
tests = [
  `
  <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; height: 500px;">
    <div style="background-color: #FFA07A; padding: 20px;">Div 1</div>
    <div style="background-color: #98FB98; padding: 20px;">Div 2</div>
    <div style="background-color: #87CEEB; padding: 20px;">Div 3</div>
  </div>
  `,
  `
  <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 500px;">
    <div style="background-color: #FFA07A; padding: 20px;">Div 1</div>
    <div style="background-color: #98FB98; padding: 20px;">Div 2</div>
    <div style="background-color: #87CEEB; padding: 20px;">Div 3</div>
  </div>
  `
];

let allTests = [tests];


allTests.forEach(d => {
  d.forEach((e, i) => {
    console.log('\nTEST:', i);
    let yhp = new yogaHTMLParser();
    yhp.parse(e, (node, layout, userData) => {
      console.log('IDX', userData.idx)
      console.log(layout);
    });
  })
})