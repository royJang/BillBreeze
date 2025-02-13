import { BillBreeze } from '../dist/index.mjs';
import fs from 'fs';

var buffer = fs.readFileSync('./example/wechat-01.pdf', 'utf8');

const billBreeze = new BillBreeze();
billBreeze.load(buffer).then(data => {
    console.log(data);
});