const yogaHTMLParser = require('../src/yoga-parse.js');

marginTests = [
  `
  <div id="test" style="width: 100px; height: 100px;">
    <div style="background:blue; margin-top: 10px; margin-right: 20px; margin-bottom: 30px; margin-left: 40px;"></div>
  </div>
  `,
  `
  <div style="width: 100px; height: 100px;">
    <div style="margin-top: 10%; margin-right: 20%; margin-bottom: 30%; margin-left: 40%;"></div>
  </div>
  `,
  `
  <div style="width: 100px; height: 100px;">
    <div style="margin: 10px"></div>
  </div>
  `,
  `
  <div style="width: 100px; height: 100px;">
    <div style="margin: 10px 20px;"></div>
  </div>
  `,
  `
  <div style="width: 100px; height: 100px;">
    <div style="margin: 10px 20px 30px 40px;"></div>
  </div>
  `,

];

let allTests = [marginTests];


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

let yhp = new yogaHTMLParser();
yhp.parse(marginTests[0])
let { layout, userData } = yhp.getById('test')
console.log('\nbyID Test:', layout, userData.idx);