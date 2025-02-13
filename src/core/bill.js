import _ from "lodash";

const YMD_RE = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}\s/;
const HIS_RE = /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/;
const AMOUNT_RE = /^[0-9]+\.[0-9]{2}$/;

function isInline ( cur, next ){
	let x = Math.ceil(cur.transform[4]);
	let w = cur.width;
	let nX = Math.ceil(next?.transform[4]);
	return (x - 4 <= nX) && (x + w >= nX);
}

//1. 交易单号
//2. 交易时间
//3. 交易类型
//4. 收/支/其他
//5. 交易方式
//6. 金额
//7. 交易方
//8. 商户单号
const WECHAT_TYPE_REG = /^(收入|支出|其他)$/;

export function WechatBillParser ( items ){
	
	//去除交易单号和商户单号的原始数据
	let orders = [];
	//先把同一行的数据合并
	let nextMerge = false;

	for( let i = 0, len = items.length; i < len; i++ ) {
		if( nextMerge ) {
			if( HIS_RE.test(items[i].str) ) {
				//如果拼装的是时间
				orders[ orders.length - 1 ] += ' ' + items[ i ].str;
			}
			else {
				orders[ orders.length - 1 ] += items[ i ].str; 
			}
		}
		else {
			orders.push(items[ i ].str);
		}
		nextMerge = isInline( items[ i ], items[ i + 1 ] );
	}

	//用时间拆分数据
	const splitIndex = [];
	orders.forEach((order,index) => {
		if( YMD_RE.test(order) ) {
			splitIndex.push( index );
		}
	});

	//0. 收/支
	//1. 交易方
	//2. 交易类型
	//3. 交易方式
	//4. 交易金额
	//5. 时间
	const repairOrders = splitIndex.map((index, i) => {
		let _tmpOrder = orders.slice( splitIndex[i], splitIndex[i+1] );
		let _resultOrder = new Array(6).fill('/');
		
		//时间是第一位，直接填充到最后一位
		let _time = _tmpOrder[0];
		_resultOrder.splice(5, 1, _time);
		//收/支类型, 插入第一位
		let typeIndex = _tmpOrder.findIndex( item => WECHAT_TYPE_REG.test(item) );
		_resultOrder.splice(0, 1, _tmpOrder[typeIndex]);
		//金额先填充
		let amountIndex = _tmpOrder.findIndex( item => AMOUNT_RE.test(item) );
		_resultOrder.splice(4, 1, _tmpOrder[amountIndex]);

		//如果收支类型是第2位，说明交易方式为空
		if( typeIndex === 1 ) {
			_resultOrder.splice(3, 1, _tmpOrder[2]);
			_resultOrder.splice(2, 1, '/');
			_resultOrder.splice(1, 1, _tmpOrder[4]);
		}
		else {
			_resultOrder.splice(3, 1, _tmpOrder[3]);
			_resultOrder.splice(2, 1, _tmpOrder[1]);
			_resultOrder.splice(1, 1, _tmpOrder[5]);
		}

		return _resultOrder;
	});

	return normalizeOrders(repairOrders);
}

//1. 收/支
//2. 交易方
//3. 商品说明
//4. 交易方式
//5. 交易金额
//6. 订单号
//7. 商家单号
//8. 商家订单号
//9. 交易时间
const ALIPAY_TYPE_REG = /^(收入|支出|不计收支)$/;

export function AlipayBillParser ( items ){
	//去除交易单号和商户单号的原始数据
	let orders = [];
	//先把同一行的数据合并
	let nextMerge = false;

	for( let i = 0, len = items.length; i < len; i++ ) {
		//如果需要合并, 是时间的则加一个空格好区分，如果不是时间的则直接拼接
		if( nextMerge ) {
			if( HIS_RE.test(items[i].str) ) {
				orders[ orders.length - 1 ] += ' ' + items[ i ].str;
			}
			else {
				orders[ orders.length - 1 ] += items[ i ].str; 
			}
		}
		else {
			orders.push(items[ i ].str);
		}
		nextMerge = isInline( items[ i ], items[ i + 1 ] );
	}

	//根据规则记录每一条记录的索引
	let splitIndex = [];

	//支付宝账单的收/付款方式可能为空，所以需要判断这里是不是为空，如果是则补充一个数据进来
	orders.forEach((order,index) => {
		if( ALIPAY_TYPE_REG.test(order) ) {
			splitIndex.push( index );
		}
	});

	//拆分数据
	const repairOrders = splitIndex.map((index, i) => {

		let _tmpOrder = orders.slice( splitIndex[i], splitIndex[i+1] );

		//0. 收/支
		//1. 交易方
		//2. 商品说明
		//3. 交易方式
		//4. 交易金额
		//5. 时间
		let _resultOrder = new Array(6).fill('/');

		//收/支类型是第1位，直接填充
		_resultOrder.splice(0, 1, _tmpOrder[0]);
		//时间是最后1位，直接填充
		let _time = _tmpOrder[_tmpOrder.length - 1];
		_resultOrder.splice(5, 1, _time);
		//查找金额的位置, 先填充
		let amountIndex = _tmpOrder.findIndex( item => AMOUNT_RE.test(item) );
		_resultOrder.splice(4, 1, _tmpOrder[amountIndex]);

		//如果金额位置是第2位， 交易对方为空，商品说明为空，收/付款方式为空
		//目前发现有的客户在导出账单时，关闭了交易对方和商品说明信息，这种情况才会出现
		if( amountIndex === 1 ){
			_resultOrder.splice(1, 1, '/');
			_resultOrder.splice(2, 1, '/');
			_resultOrder.splice(3, 1, '/');
		}
		//这种情况基本是有交易说明的，但是没有交易对方和收/付款方式
		else if( amountIndex === 2 ) {
			_resultOrder.splice(1, 1, '/');
			_resultOrder.splice(2, 1, _tmpOrder[1]);
			_resultOrder.splice(3, 1, '/');
		}
		//这里有两种情况, 一种是交易对方为空，收/付款方式为空，另一种是收/付款方式为空
		//目前还没想道怎么区分这两种情况
		else if( amountIndex === 3 ) {
			_resultOrder.splice(1, 1, _tmpOrder[1]);
			_resultOrder.splice(2, 1, _tmpOrder[2]);
			_resultOrder.splice(3, 1, '/');
		}
		//正常情况
		else {
			_resultOrder.splice(1, 1, _tmpOrder[1]);
			_resultOrder.splice(2, 1, _tmpOrder[2]);
			_resultOrder.splice(3, 1, _tmpOrder[3]);
		}
		return _resultOrder;
	});

    return normalizeOrders(repairOrders);
}

function normalizeOrders ( orders ){

	return orders.map((order,index) => {

		let _time = order[5]?.split(' ');
		let TIME_YMD = _time[0];
		let TIME_HIS = _time[1];
		let _TIME_YEAR_MONTH_ARRAY = TIME_YMD?.split('-') || [];
        //收入-0，支出-1，其他-2
		let _IE = order[0] === '收入' ? 0 : order[0] === '支出' ? 1 : 2;

		let record = {
			"TIME_YMD":	TIME_YMD,
			"TIME_HIS": TIME_HIS, 
			"TIME_YEAR": _TIME_YEAR_MONTH_ARRAY[0],
			"TIME_MONTH": _TIME_YEAR_MONTH_ARRAY[1],
			"TIME_DATE": _TIME_YEAR_MONTH_ARRAY[2],
			"TIME": _time[0] + ' ' + _time[1],
			"TYPE": order[2],
			"IE": order[0],
			"_IE": _IE,
			"TRADING": order[3],
			"AMOUNT": _.toFinite(order[4]),
			"PARTY": order[1]
		};
		
		return record;
    });
}
