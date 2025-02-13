//四舍五入保留2位小数
export function parseAmount ( number ) {
    return Math.round(number * 100) / 100; 
}

//判断是否是node环境
export const isNodeJS = typeof window === 'undefined';

export async function eachPDF ( content ){

    if( isNodeJS ) {

        const CMAP_URL = './server/cmaps/'
        const STANDARD_FONT_DATA_URL = './server/standard_fonts/'
        const CMAP_PACKED = true;
        const {getDocument} = (await import('pdfjs-dist/build/pdf.js')).default;

        const pdf = await getDocument({
            "data": content,
            "cMapUrl": CMAP_URL,
            "cMapPacked": CMAP_PACKED,
            "standardFontDataUrl": STANDARD_FONT_DATA_URL,
        }).promise;

        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(pdf.getPage(i).then(async (page) => {
                return await page.getTextContent().then( content => {
                    return content.items;
                });
            }));
        }
        return Promise.all(pagePromises);
    }
    else {
        return window.pdfjsLib.getDocument({"data": content}).promise.then(function(pdf) {
            return Promise.all(new Array(pdf.numPages).fill(0).map((_, i) => {
                return pdf.getPage(i + 1).then(function(e) {
                    return e.getTextContent().then( content => {
                        return content.items;
                    });
                });
            }));
        });
    }
}

export function formattedAmount ( number ){
    if(!number) return '0.00';
    return number.toLocaleString('zh-CN', { 
        style: 'currency', 
        currency: 'CNY', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

export function billRangeParser ( text ){
    let range = text.split('至');
    let start = new Date(range[0]);
    let end = new Date(range[1]);

    return {
        start: {
            year: start.getFullYear(),
            month: start.getMonth() + 1,
            date: start.getDate()
        },
        end: {
            year: end.getFullYear(),
            month: end.getMonth() + 1,
            date: end.getDate()
        }
    }
}

// 获取2个日期之间的月份
export function getMonthsBetweenDates(start, end) {
    
    var months = [];
    var distance = (end.year - start.year) * 12 - start.month + end.month + 1;
    var _curYear = start.year;
    var _curMonth = start.month;

    for( let i = 0; i < distance; i++ ) {

        if( _curMonth > 12 ) {
            _curYear++;
            _curMonth = 1;
        }

        months.push({
            year: _curYear,
            month: _curMonth
        });

        _curMonth++;
    }
    
    return months;
}
