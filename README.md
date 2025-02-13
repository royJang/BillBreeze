## Bill Breeze

## 1. Introduction
The Bill Breeze project mainly provides the parsing of WeChat and Alipay bills, converting PDFs that are not easy to read and write into JSON format. After completing the PDF parsing, we offer some basic functions, such as converting the address on the ID card into the actual address. In addition to these basic functions, we also provide some plugins, and you can decide whether to load them or not. For example, it can classify the content of the bills, including categories like transportation, daily life, healthcare, entertainment, financial activities, and so on.

## 2. How to use

You can use it in either a Node.js environment or a browser environment.
Of course, you need to read the PDF content by yourself first and then pass the buffer to Bill Breeze.

```
yarn add bill-breeze

&

import { BillBreeze } from 'bill-breeze';

// That's the basic usage. We've provided the basic data 
// structure, and you can build your own bill analysis system, 
// tables, and so on.

const billBreeze = new BillBreeze();
billBreeze.load( buffer ).then( data => {
    /**

        userInfo: {
            name: '',
            age: 20,
            gender: 'M',
            birth: ''
            addr: '', 
            idcard: '',
            isWechat: true,
            isAlipay: false,
            wechatID: '',
            billTimeRange: ''
        },
        content: [
            {
                TIME_YMD: '2024-10-07',
                TIME_HIS: '19:31:09',
                TIME_YEAR: '2024'
                TIME_MONTH: '10',
                TIME_DATE: '07',
                TIME: '2024-10-07 19:31:09',
                TYPE: '扫二维码付款',
                IE: '支出',
                _IE: 1,
                TRADING: '银行储蓄卡(9571)',
                AMOUNT: 15,
                PARTY: '张三'
            },
            {
                ....
            }
        ]
     */
});
```


## 3. Plugins
Coming soon, Of course, you can also use our [free online bill parsing service](https://bill.sanxiangti.com/
). Next, we'll provide an online API, which enables a quicker integration. 

This bill parsing service is mainly provided for the leasing industry. If your industry also has similar needs, you can contact us for customized services. Our phone number is the same as our WeChat number: 18058810726.

