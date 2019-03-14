var datalist;
var upLoadingImgSrc = '../../image/loading_more.gif';
var version = "1.0.0";
var datalistModel = function (drawingData, url, getData, downNum, upNum, threshold,openUpAction,overload) {
    this.orgGetData=deepCopy(getData);
    this.user = quakooUser.getUserInfo();
    this.drawingData = drawingData;
    this.url = url;
    this.getData = getData;
    this.getData.token = this.user.token;
    this.downNum = downNum || 10;
    this.upNum = upNum || 5;
    this.currentNum = 0;//当前页面上拉加载的游标
    this.preloadNumSize = 40;//预加载个数
    this.isGetDataByUp = false;
    this.isGetDataByDown = false;
    this.isGetDataByPerload = false;
    this.hasWaitingGetUp = false;//如果上拉加载和异步预加载冲突，上拉加载会开启等待效果，等到异步加载的结果
    this.hasNoMoreData = false;
    this.cacheKey = createCacheKey(url, this.orgGetData);
    this.cursorOnDbError = 0;//db错误的时候的游标
    this.isInit=false;
    this.ext = null;
    this.threshold=threshold||100;

    this.openUpAction=openUpAction||false;

    datalist = this;
    for (var m in overload) {
        if (this[m]) {
            this[m] = overload[m];
        }
    }

    this.init();
};

datalistModel.prototype = {
    init: function () {
//      api.setCustomRefreshHeaderInfo({
//          bgColor: '#fff',
////  		isScale: true,
//  		image: {
//  			pull: 'widget://image/refresh/1.jpg',
//		        transform: [
//		            'widget://image/refresh/1.jpg',
//		            'widget://image/refresh/2.jpg',
//		            'widget://image/refresh/3.jpg',
//		            'widget://image/refresh/4.jpg',
//		            'widget://image/refresh/5.jpg',
//		            'widget://image/refresh/6.jpg',
//		            'widget://image/refresh/7.jpg',
//		            'widget://image/refresh/8.jpg'
//		        ],
//		        load: [
//		            'widget://image/refresh/8.jpg',
//		            'widget://image/refresh/7.jpg',
//		            'widget://image/refresh/6.jpg',
//		            'widget://image/refresh/5.jpg',
//		            'widget://image/refresh/4.jpg',
//		            'widget://image/refresh/3.jpg',
//		            'widget://image/refresh/2.jpg',
//		            'widget://image/refresh/1.jpg'
//		        ]
//		    }
		api.setRefreshHeaderInfo({
            visible: true,
            bgColor: 'rgba(0,0,0,0)',
            textColor: '#666',
            textDown: '下拉刷新...',
            textUp: '松开刷新...'
        }, function (ret, err) {
            if(datalist.isInit){
                datalist.refresh();
            }else{
                datalist.isInit = true;
                datalist.getDataByDown(function (result,serverResult) {
                    datalist.drawingData(result, false,serverResult);
                    datalist.afterRefresh(result);
                    api.sendEvent({
					    name: 'refresh_data_' + api.frameName,
					    extra: {
					        refresh : 'isInit'
					    }
					});
                }, function (result) {
                    datalist.drawingData(result, false);
                });
            }
        });

        api.addEventListener({
            name: 'scrolltobottom',
            extra: {
                threshold: datalist.threshold   //设置距离底部多少就触发
            }
        }, function (ret, err) {
            datalist.loadMore();
        });

        this.initData();
    },
    initData: function () {
        this.beforeInitData();
        api.refreshHeaderLoading();
    },
    beforeInitData: function () {

    },
    refresh: function () {
        this.beforeRefresh();
        var loadMoreDiv = document.getElementById("loadMoreDiv");
        if (loadMoreDiv) {
            document.body.removeChild(loadMoreDiv);
        }
        
        this.getDataByDown(function (result,serverResult) {
            datalist.drawingData(result, false,serverResult);
            datalist.afterRefresh(result);
            api.sendEvent({
                name: 'refresh_data_' + api.frameName,
                extra: {
                    refresh : 'refresh_done'
                }
            });
        });
    },
    beforeRefresh: function () {

    },
    afterRefresh : function (result) {
    		
    },
    loadMore: function () {
        this.beforeLoadMore();
        this.getDataByUp(function (result) {
            datalist.drawingData(result, true)
        });
    },
    beforeLoadMore: function () {

    },
    getDataByDown: function (callBackOnGetDatas, callBackOnGetCacheDatas) {
        var startTime=new Date().getTime();
        //判断当前是否正在下拉刷新
        if (this.isGetDataByDown) {
            return;
        }
        this.isGetDataByDown = true;

        //如果有上拉，下拉也不生效（防止上拉后重置数据库，之前的下拉请求返回的数据扰乱本地数据库）
        if (this.isGetDataByUp) {
            this.downEnd();
            return;
        }
        var getData = deepCopy(this.getData);
        getData.token = this.user.token;
        getData.cursor = 0;
        getData.size =this.preloadNumSize; //默认加载2倍
        //从缓存拉取数据

        if (callBackOnGetCacheDatas) {
            var cacheDataResult = [];
            getItem(this.cacheKey, function (ret, err) {
                if (ret.status) {

                    var storageStr = "{}";
                    if (quakooUtils.isNotBlack(ret.data)) {
                        storageStr = ret.data;
                    }
                    var value = JSON.parse(storageStr);
                    if (value.data) {
                        var j = 0;
                        var k = j + datalist.downNum;
                        //加载数据
                        for (; j < k && j < value.data.length; j++) {
                            cacheDataResult.push(value.data[j]);
                        }
                        datalist.currentNum = cacheDataResult.length;
                        callBackOnGetCacheDatas(cacheDataResult);
                    }
                }
            });
        }

        //去服务器拉取数据
        this.getPagerDataFormServer(getData, true, true, function (ret, err) {
            datalist.hasNoMoreData = false;
            if (ret.status) {
                var serverResult = ret.data;
                //如果写入数据库成功展示一半的数据
                if (ret.cached) {
                    var dataResult = [];
                    for (var n = 0; n < datalist.downNum && n < serverResult.data.length; n++) {
                        dataResult.push(serverResult.data[n]);
                    }

					datalist.currentNum = dataResult.length;
                    callBackOnGetDatas(dataResult,serverResult);

                    if (!serverResult.hasnext && serverResult.data.length <= datalist.downNum) {
                        datalist.hasNoMoreData = true;
                    }
                } else {
                    //写入数据库失败，在页面上一次展示多一倍的数据
                    callBackOnGetDatas(serverResult.data,serverResult);
                    datalist.cursorOnDbError = serverResult.nextCursor;
                    if (!serverResult.hasnext) {
                        datalist.hasNoMoreData = true;
                    }
                }
            }
            datalist.downEnd();
        });
    },
    getDataByUp: function (callBackOnGetDatas) {
        //检查当前是否正在上拉或者下拉.
        if (this.isGetDataByDown || this.isGetDataByUp) {
            return;
        }
        this.isGetDataByUp = true;
        //如果已经没有数据了 直接返回
        if (this.hasNoMoreData) {
            this.isGetDataByUp = false;
            return;
        }
        var dataResult = [];
        var getData = deepCopy(this.getData);

        //开始上拉效果
        this.startUpEffect();
        setTimeout(function(){
            //如果数据库存入失败,pageCursor有值
            if (datalist.cursorOnDbError > 0) {
                getData.cursor = datalist.cursorOnDbError;
                getData.size = datalist.upNum;
                datalist.getPagerDataFormServer(getData,false, true, function (ret, err) {
                    if (ret.status) {
                        var serverResult = ret.data;
                        callBackOnGetDatas(serverResult.data);
                        datalist.cursorOnDbError = serverResult.nextCursor;
                    }
                    datalist.upEnd();
                });
                return;
            }

            //从缓存中加载数据
            getItem(datalist.cacheKey, function (ret, err) {
                if (!ret.status || quakooUtils.isBlack(ret.data)) {
                    datalist.upEnd();
                    return;
                }
                var value = JSON.parse(ret.data);
                //获取当前上拉数据在缓存当中得位置
                //游标数据的开始位置
                var j = datalist.currentNum;
                var k = datalist.currentNum + datalist.upNum;
                //加载数据
                for (; j < k && j < value.data.length; j++) {
                    dataResult.push(value.data[j]);
                }

                //没有数据
                if (dataResult.length == 0) {

                    //如果当前正在异步加载，那么上拉加载的效果不停，不调用end方法，由异步加载后的程序来调用。
                    if (datalist.isGetDataByPerload) {
                        datalist.hasWaitingGetUp = true;
                        return;
                    }
                    //设置游标为当前游标。开始异步拉取数据
                    getData.cursor = value.nextCursor;
                    getData.size = datalist.upNum * 2;
                    datalist.getPagerDataFormServer(getData, true, true, function (ret, err) {
                        if (ret.status) {
                            var serverResult = ret.data;
                            //如果写入数据库成功展示一半的数据
                            if (ret.cached) {
                                var dataResult = [];
                                for (var n = 0; n < datalist.upNum && n < serverResult.data.length; n++) {
                                    dataResult.push(serverResult.data[n]);
                                }

                                datalist.currentNum = datalist.currentNum + dataResult.length;
                                callBackOnGetDatas(dataResult);

                                if (serverResult.hasnext == false && serverResult.data.length <= datalist.upNum) {
                                    datalist.hasNoMoreData = true;
                                }
                            } else {
                                //写入数据库失败，在页面上一次展示多一倍的数据
                                callBackOnGetDatas(serverResult.data);
                                if (serverResult.hasnext == false) {

                                    datalist.hasNoMoreData = true;
                                }
                                datalist.cursorOnDbError = serverResult.nextCursor;
                            }
                        }

                        datalist.upEnd();
                    });

                } else {
                    //有数据
                    datalist.currentNum = datalist.currentNum + dataResult.length;
                    callBackOnGetDatas(dataResult);
                    if (!value.hasnext) {
                        if(dataResult.length < datalist.upNum){
                            datalist.hasNoMoreData = true;
                        }
                        if(dataResult.length == datalist.upNum&&j>=value.data.length){
                            datalist.hasNoMoreData = true;
                        }
                    }
                    datalist.upEnd();

                    if (value.hasnext == false) {
                        return;
                    }
                    //异步加载
                    if (value.data.length - j <= datalist.upNum&&!datalist.isGetDataByPerload) {
                        datalist.isGetDataByPerload = true;
                        getData.cursor = value.nextCursor;
                        getData.size = datalist.preloadNumSize;

                        datalist.getPagerDataFormServer(getData, true, false, function (ret, err) {
                            if (ret.status) {
                                var serverResult = ret.data;
                                //如果写入数据库成功展示一半的数据
                                if (ret.cached) {
                                    var dataResult = [];
                                    for (var n = 0; n < datalist.upNum && n < serverResult.data.length; n++) {
                                        dataResult.push(serverResult.data[n]);
                                    }
                                    if (datalist.hasWaitingGetUp) {
                                        datalist.currentNum = datalist.currentNum + dataResult.length;
                                        callBackOnGetDatas(dataResult);
                                        if (!serverResult.hasnext && serverResult.data.length <= datalist.upNum) {
                                            datalist.hasNoMoreData = true;
                                        }
                                    }
                                } else {
                                    //写入数据库失败，在页面上一次展示多一倍的数据
                                    if (datalist.hasWaitingGetUp) {
                                        callBackOnGetDatas(serverResult.data);
                                    }
                                    if (serverResult.hasnext == false) {
                                        datalist.hasNoMoreData = true;
                                    }
                                    datalist.cursorOnDbError = serverResult.nextCursor;
                                }
                            } else {
                                if (datalist.hasWaitingGetUp) {
                                    api.toast({msg: "获取信息失败"});
                                }
                            }

                            if (datalist.hasWaitingGetUp) {
                                datalist.upEnd();
                            }
                            datalist.isGetDataByPerload = false;
                            datalist.hasWaitingGetUp = false;
                        });

                    }

                }
            });
        },0);


    },
    downEnd: function (nomoreData) {
        this.endUpEffect();
        api.refreshHeaderLoadDone();
        this.isGetDataByDown = false;
        this.afterDownEnd();
    },
    afterDownEnd: function () {

    },
    upEnd: function (nomoreData) {
        this.endUpEffect();
        this.isGetDataByUp = false;
    },
    startUpEffect: function () {
        var loadMoreDiv = document.getElementById("loadMoreDiv");
        if (loadMoreDiv) {
        }else{
            if(this.openUpAction){
                var div = document.createElement("div");
                div.setAttribute("id", "loadMoreDiv");
                // div.innerHTML = '<img  src="' + upLoadingImgSrc + '"/> 全力加载中...';
                div.innerHTML = '全力加载中...';
                document.body.appendChild(div);
            }
        }
    },
    endUpEffect: function () {
        var loadMoreDiv = document.getElementById("loadMoreDiv");
        if (loadMoreDiv) {
            if (this.hasNoMoreData) {
                setTimeout(function(){
                    loadMoreDiv.innerHTML='已显示全部信息';
                },200);
            }
        }else{
            if (this.hasNoMoreData && this.openUpAction) {
//              setTimeout(function(){
                    var div = document.createElement("div");
                    div.setAttribute("id", "loadMoreDiv");
                    div.innerHTML = '已显示全部信息';
                    document.body.appendChild(div);
//              },200);
            }
        }
    },
    getPagerDataFormServer: function (getData, saveToDb, alertServerFail, callback) {
        if(this.isGetDataByDown){
            this.ext = null;
        }
        if(quakooUtils.isNotBlack(this.ext)){
            getData.ext = this.ext;
        }
        api.ajax({
            url: datalist.url,
            method: 'post',
            timeout: 120,
            dataType: 'json',
            returnAll: false,
            headers: {
	        		"Accept-Encoding": "gzip",
	        		"version" : version,
	        		"type" : 1
	        	},
            data: {
                values: getData
            }
        }, function (ret, err) {
            //读取数据失败。。
            if (err) {
            	var msg = err.msg || "网络连接错误，请稍后再试！";
            	quakooMsg.toast(msg);
            	callback({status: false, cached: false}, err);
            	return;
            }
            var isLoginRepeat = $api.getStorage("isLoginRepeat");
            if(ret&&ret.code == 400&&quakooUtils.isBlack(isLoginRepeat)){
                $api.setStorage("isLoginRepeat","isLoginRepeat");
                quakooUser.setUserInfo("");
                //清除这些存咋本地的
                $api.rmStorage("PhotoBrowser_flag");
                $api.rmStorage("listdetails");
                $api.rmStorage("Replycomments");
                $api.rmStorage("StgName");
                $api.rmStorage("topText");
                $api.rmStorage("activeFrame");
                $api.rmStorage("more");
                showOneDialog("温馨提示","您的账号在其他手机上登录，您被迫下线！","确定",function(){
                    $api.setStorage("isLoginRepeat","");
                    var obj = {
                        imei : api.deviceId,
                        plat : api.systemType,
                        platVersion : api.systemVersion
                    };
                    openNewOfIndex("login", "../../html/RegisterLogin/login.html", {}, {slidBackEnabled: false});
                });
	    		return;
	    	}else if(ret&&ret.code == 401&&quakooUtils.isBlack(isLoginRepeat)){
                $api.setStorage("isLoginRepeat","isLoginRepeat");
                quakooUser.setUserInfo("");
                //清除这些存咋本地的
                $api.rmStorage("PhotoBrowser_flag");
                $api.rmStorage("listdetails");
                $api.rmStorage("Replycomments");
                $api.rmStorage("StgName");
                $api.rmStorage("topText");
                $api.rmStorage("activeFrame");
                $api.rmStorage("more");
                $api.setStorage("isLoginRepeat","");
                showOneDialog("温馨提示","您的账号存在异常情况，已被冻结，您被迫下线！","确定",function(){
                    $api.setStorage("isLoginRepeat","");
                    var obj = {
                        imei : api.deviceId,
                        plat : api.systemType,
                        platVersion : api.systemVersion
                    };
                    openNewOfIndex("login", "../../html/RegisterLogin/login.html", {}, {slidBackEnabled: false});
                });
                return;
            }
            if (!ret) {
                if (alertServerFail) {
                    api.toast({msg: "获取信息失败"});
                }
                callback({status: false, cached: false}, err);
                return;
            }
			
            var serverResult = ret;
            if (quakooUtils.isBlack(serverResult.data)) {
                serverResult.data = [];
            }

            //记录ext状态

            datalist.ext = ret.ext;
            //不保存到数据库，直接返回
            if (!saveToDb) {
                callback({status: true, cached: false, data: serverResult}, err);
                return;
            }
            getItem(datalist.cacheKey, function (ret, err) {
                if (!ret.status) {
                    callback({status: true, cached: false, data: serverResult}, err);
                    return;
                }
                var storageStr = "{}";
                if (quakooUtils.isNotBlack(ret.data)) {
                    storageStr = ret.data;
                }
                var value = JSON.parse(storageStr);
                if (value.data && quakooUtils.isNotBlack(getData.cursor) && getData.cursor != "0") {
                    for (var n = 0; n < serverResult.data.length; n++) {
                        value.data.push(serverResult.data[n]);
                    }
                } else {
                    value.data = serverResult.data;
                }
                value.hasnext = serverResult.hasnext;
                value.nextCursor = serverResult.nextCursor;
                //写入缓存
                setItem(datalist.cacheKey, JSON.stringify(value), function (ret, err) {

                    if (ret.status) {
                        callback({status: true, cached: true, data: serverResult}, err);
                    } else {
                        callback({status: true, cached: false, data: serverResult}, err);
                    }
                });

            });
        });
    }
}


function createCacheKey(url, getData) {
    var cacheKey = url;
    for (var key in getData) {
        if (key != "cursor" && key != "size") {
            cacheKey = cacheKey + key + getData[key];
        }
    }
    return hex_md5(cacheKey);
}



function hasEmoji(str) {
	str += "";
	var patt=/[\ud800-\udbff][\udc00-\udfff]/g; 
	str = str.replace(patt,function(char){
		if (char.length===2) { 
			return "*";
		} else { 
			return char; 
		} 
	});
	return str; 
}


function getServerInfoUseCache(callBackOnNullData, callBackOnCacheData,callBackOnNewServerData, callBackOnServerDataError,
url, getData,notAlertError,notHideProcess) {
    var cacheKey = createCacheKey(url, getData);
    getItem(cacheKey, function (ret, err) {
        var storageStr = "{}";
        if (quakooUtils.isNotBlack(ret.data)) {
            storageStr = ret.data;
        }
        var value = JSON.parse(storageStr);
        if (quakooUtils.isBlack(value)) {
            callBackOnNullData();
        } else {
            callBackOnCacheData(value);
        }
        if (quakooUtils.isBlack(getData)) {
            getData = {};
        }
        var user = quakooUser.getUserInfo();
        getData.token = user.token;
        api.ajax({
            url: url,
            method: 'post',
            timeout: 60,
            dataType: 'json',
            returnAll: false,
            headers: {
	        		"Accept-Encoding": "gzip",
	        		"version" : version,
	        		"type" :   1
	        	},
            data: {
                values: getData
            }
        }, function (ret, err) {
            var isLoginRepeat = $api.getStorage("isLoginRepeat");
            if (ret) {
                var data = ret;
                if(data.success == false){
                    if(data&&data.code == 400&&quakooUtils.isBlack(isLoginRepeat)){
                        $api.setStorage("isLoginRepeat","isLoginRepeat");
                        quakooUser.setUserInfo("");
                        //清除这些存咋本地的
                        $api.rmStorage("PhotoBrowser_flag");
                        $api.rmStorage("listdetails");
                        $api.rmStorage("Replycomments");
                        $api.rmStorage("StgName");
                        $api.rmStorage("topText");
                        $api.rmStorage("activeFrame");
                        $api.rmStorage("more");
                        showOneDialog("温馨提示","您的账号在其他手机上登录，您被迫下线！","确定",function(){
                            $api.setStorage("isLoginRepeat","");
                            var obj = {
                                imei : api.deviceId,
                                plat : api.systemType,
                                platVersion : api.systemVersion
                            };
                            openNewOfIndex("login", "../../html/RegisterLogin/login.html", {}, {slidBackEnabled: false});
                        });
                        return;
                    }else if(data&&data.code == 401&&quakooUtils.isBlack(isLoginRepeat)){
                        $api.setStorage("isLoginRepeat","isLoginRepeat");
                        quakooUser.setUserInfo("");
                        //清除这些存咋本地的
                        $api.rmStorage("PhotoBrowser_flag");
                        $api.rmStorage("listdetails");
                        $api.rmStorage("Replycomments");
                        $api.rmStorage("StgName");
                        $api.rmStorage("topText");
                        $api.rmStorage("activeFrame");
                        $api.rmStorage("more");
                        $api.setStorage("isLoginRepeat","");
                        showOneDialog("温馨提示","您的账号存在异常情况，已被冻结，您被迫下线！","确定",function(){
                            $api.setStorage("isLoginRepeat","");
                            var obj = {
                                imei : api.deviceId,
                                plat : api.systemType,
                                platVersion : api.systemVersion
                            };
                            openNewOfIndex("login", "../../html/RegisterLogin/login.html", {}, {slidBackEnabled: false});
                        });
                        return;
                    }else{
                        var errorMessage=data.errorMessage||'获取信息失败';
                        if(true!=notAlertError){
                            api.toast({
                                msg: errorMessage
                            });
                        }
                        callBackOnServerDataError();
                    }

                } else if (JSON.stringify(data) != storageStr) {
                    setItem(cacheKey, JSON.stringify(data));
                    callBackOnNewServerData(data, value);
                } 
//              else {
//              		callBackOnServerDataError(err);
//              }
            } else {
                if(true!=notAlertError){
                    api.toast({
                        msg: '获取信息失败'
                    });
                }
                callBackOnServerDataError(err);
            }
            if(true!=notHideProcess){
                api.refreshHeaderLoadDone();
            }
        });
    });
}

function getServerInfoUseCacheWithProgressNoDisplay(callBackOnNullData, callBackOnCacheData, callBackOnNewServerData,
                                           callBackOnServerDataError, url, getData,notAlertError,notHideProcess) {
    api.showProgress({});
    getServerInfoUseCache(
        callBackOnNullData,
        function(value){
            callBackOnCacheData(value);

        },
        function(data, value){
            callBackOnNewServerData(data, value);

        },function(){

            callBackOnServerDataError();
        },
        url, getData,notAlertError,notHideProcess);
}

function getServerInfoUseCacheWithProgress(callBackOnNullData, callBackOnCacheData, callBackOnNewServerData, 
	callBackOnServerDataError, url, getData,notAlertError,notHideProcess) {
    api.showProgress({});
    var isShowProgress = true;
	document.body.style.display = 'none';
	getServerInfoUseCache(
		callBackOnNullData,
		function(value){
			callBackOnCacheData(value);
			document.body.style.display = 'block';

			isShowProgress = false;
		},
		function(data, value){
			callBackOnNewServerData(data, value);
			if(isShowProgress == true){
				document.body.style.display = 'block';

			}
		}, function(){

            callBackOnServerDataError();
        },
		url, getData,notAlertError,notHideProcess);
}

function ajaxGetUser(url, getData, callBack) {
    quakooData
    api.ajax({
        url: url,
        method: 'post',
        timeout: 60,
        dataType: 'json',
        returnAll: false,
        headers: {
        		"Accept-Encoding": "gzip",
        		"version" : version,
	        	"type" :   1
        	},
        data: {
            values: getData
        }
    }, function (ret, err) {
    	if(err){

    		var msg = err.msg || "您的连接出错，请稍后再试！";
       		quakooMsg.toast(msg);
       		return;
    	}
        callBack(ret, err);
    });
}
