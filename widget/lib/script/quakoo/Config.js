/**
 *  雀科科技- http://www.quakoo.com
 *
 *  业务配置类（继承父类：QuakooConfig）
 *
 *  放本业务相关的配置
 *
 */

var Config = (function(_super){
    function Config(){
        Config.__super.call(this);

        this.isTest = false;
        /**
         * js部分使用的版本号，项目如果持续发布版本，记得更换版本号
         * @type {string}
         */
        this.version = "1.0.0";
        this.hotVersion = "201901020001"
        this.rootWindowName = "root";
        //头部高度
        this.headHeight = 44;
        //底部高度
        this.bottomHeight = 48;

        //win窗口中打开的FRAME距离顶部的高度（win窗口头部高度）
        this.winHeadHeight = 45;
        //win窗口中打开的FRAME距离底部的高度（win窗口底部高度）
        this.winBottomHeight = 0;


        //是否初始化
        this.isInit = "isInit";
        this.lastTime = 'lastTime';
        //是否播放引导视频
        this.isShowGuide = false;
        //是否需要游客登录
        this.isNeedCustomerUser = true;
        //短信验证码发送时间
        this.Storage_Sms_Time = "smsTime";
        //聊天未读消息数
        this.Storage_chat_num = "chat_num";
        //当前地址
        this.curAddress = 'curAddress';
        //当前经度
        this.curLon = 'curLon';
        //当前纬度
        this.curLat = 'curLat';
        //购物车
        this.cartsKey = 'carts';


        /**api服务地址*/
        this.serverUrl = "http://web.meneotime.com";
        // this.serverUrl = "http://39.107.247.82:19996";//测试
        // this.serverUrl = "http://192.168.1.13:50001";//本地
        /**聊天服务地址*/
        this.chatNativeUrl = "";
        /**图片服务器地址*/
        this.uploadImageUrl = "http://web.meneotime.com/storage/handle";

        /**聊天地址*/
        this.chatServerUrl = 'chat.meneotime.com';
        /**聊天端口*/
        this.chatPort = '33333';
        /**推送地址*/
        this.pushServerUrl = 'chat.meneotime.com';
        /**推送端口*/
        this.pushPort  = '33333';



    }
    var _proto = Config.prototype;

    Quakoo.class(Config,'Config',_super);
    _super.prototype.goodsShareUrl = function () {return this.serverUrl + '/view/share/html/goodsShare.html'};
    _super.prototype.storeShareUrl = function () {return this.serverUrl + '/view/share/html/storeShare.html'};
    _super.prototype.fashionShareUrl = function () {return this.serverUrl + '/view/share/html/fashionInfoShare.html'};

    return Config;
})(QuakooConfig);



var Data = (function(_super){
    function Data(){
        Data.__super.call(this);
    }

    Quakoo.class(Data,'Data',_super);

    var _proto = Data.prototype;

    /**
     *
     * 获取数据的ajax请求,showProgress为false,没有加载圈
     * @param url 请求url
     * @param reqData 请求的数据
     * @param callBackOnData(ret) 有缓存的数据回回调这个方法，当请求的时候发现新数据跟缓存不一致也会调用这个方法。有可能调用两次。
     */
    _super.prototype.ajaxGetDataNoProgress = function (url, reqData, callBackOnData) {
        this._ajaxGetData(url,reqData,callBackOnData,true,true,false);
    }
    /**
     *
     * 获取数据的ajax请求,有错误回调
     * @param url 请求url
     * @param reqData 请求的数据
     * @param callBackOnData(ret) 没有缓存,success=true时会执行该回调
     * @param callBackOnDataErr(ret) ,success=false时会执行该回调,该种情况用于 改变 点赞或者购物袋数量加减所设置的flag，防止flag无法复位。    设置flag是为了防止快速重复点击。
     */
    _super.prototype.ajaxSubmitDataHasError = function (url, reqData, callBackOnData,callBackOnDataErr) {
        this._ajaxSubmitData(url,reqData,callBackOnData,true,true,true,callBackOnDataErr);
    }

    /**
     * 提交ajax请求
     * 不需要缓存
     * @param url 请求url
     * @param reqData 请求的数据
     * @param callBackOnServerData(ret) 服务器传输回数据，回调方法
     */
    _super.prototype.ajaxSubmitDataNoProgress = function (url, reqData, callBackOnServerData) {
        this._ajaxSubmitData(url, reqData, callBackOnServerData,true,true,false);
    }

    return Data;
})(QuakooData);

