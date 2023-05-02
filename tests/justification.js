const yogaHTMLParser = require('../src/yoga-parse.js');
tests = [
  `	
  <div style="width: 500px; height: 500px; display: flex; justify-content: center;">
    <div style="width: 100px; height: 100px; border: 1px;">Box 1</div>
    <div style="width: 100px; height: 100px; border: 1px;">Box 2</div>
    <div style="width: 100px; height: 100px; border: 1px;">Box 3</div>
  </div>
  `,
  // `	
  // <div style="width: 500px; height: 500px; display: flex; justify-content: center;">
  //   <div style="width: 100px; height: 100px; border: 1px;">Box 1</div>
  //   <div style="width: 100px; height: 100px; border: 1px;">Box 2</div>
  //   <div style="width: 100px; height: 100px; border: 1px solid black;">Box 3</div>
  // </div>
  // ` // uncomment to see error when hitting compound rule "border"
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