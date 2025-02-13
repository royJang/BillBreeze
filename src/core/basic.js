import dayjs from 'dayjs';
import IDValidator from 'id-validator';
import { billRangeParser, eachPDF, getMonthsBetweenDates } from "../utils/index";
import { AlipayBillParser, WechatBillParser } from "./bill";
import { GB2260 } from '../utils/gb2660';

const Validator = new IDValidator( GB2260 );

function parseIDCard ( idcard ){
    let card_info = Validator.getInfo(idcard);
    return {
        "age": dayjs().diff(card_info.birth, 'year'),
        "gender": card_info.sex == 0 ? 'F' : 'M',
        "birth": card_info.birth,
        "addr": card_info.addr
    }
}

export function parsePDF ( content ){

    let isWechatBill = false;
    let userInfo = {};

    return eachPDF( content ).then( data => {

        let allPages = data.map((items, index) => {

            if( index === 0 ) {

                isWechatBill = /微信/.test(items[1].str);

                if( isWechatBill ) {
                    
                    let [ _, name, idcard, wechatID ] = items[2]?.str?.match(/兹证明：([\u4e00-\u9fa5]{2,4})\(居民身份证：([0-9xX]{18})\)，在其微信号：(.+)中的交易明细信息如下：/);
                    let billTimeRange = items[5].str;
                    let billTimeRangeYMD = billTimeRange.replace(/\s\d{1}\d{1}:\d{1}\d{1}:\d{1}\d{1}/g, '');
                    let _range = billRangeParser(billTimeRange);
                    let allMonths = getMonthsBetweenDates(_range.start, _range.end);

                    userInfo = {
                        name,
                        idcard,
                        isWechat: true,
                        isAlipay: false,
                        wechatID,
                        billTimeRange,
                        billTimeRangeYMD,
                        billAllMonths: allMonths,
                        billMonthlyLength: allMonths.length
                    };

                    Object.assign( userInfo, parseIDCard(idcard) );

                    return WechatBillParser( items.concat([]).slice(15) );
                }
                else {
                    let [ _, name, idcard, alipayID ] = items[3]?.str?.match(/\s+兹证明:([\u4e00-\u9fa5]{2,4})\(证件号码:([0-9xX]{18})\)在其支付宝账号(.+)中明细信息如下:/);
                    let billTimeRange = items[7]?.str?.slice(6); 
                    let billTimeRangeYMD = billTimeRange.replace(/\s\d{1}\d{1}:\d{1}\d{1}:\d{1}\d{1}/g, '');
                    let _range = billRangeParser(billTimeRange);
                    let allMonths = getMonthsBetweenDates(_range.start, _range.end);

                    userInfo = {
                        name,
                        idcard,
                        isAlipay: true,
                        isWechat: false,
                        alipayID,
                        billTimeRange,
                        billTimeRangeYMD,
                        billAllMonths: allMonths,
                        billMonthlyLength: allMonths.length
                    };

                    Object.assign( userInfo, parseIDCard(idcard) );

                    let _items = items.concat([]).slice(17);

                    return AlipayBillParser( _items.slice(0, _items.length - 1) );
                }
            }
            else {
                if( isWechatBill ) {
                    return WechatBillParser( items );
                }
                //支付宝账单的最后一页没有用
                else if( index < data.length - 2 ){ 
                    return AlipayBillParser( items.slice(0, items.length - 1) );
                }
            }
        });
        return {
            "userInfo": userInfo,
            "content": allPages.filter(n=>!!n).flat()
        };
    })
}