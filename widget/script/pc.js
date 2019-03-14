/**
 * Created by 47822 on 2017/6/12.
 */
/**
 * Created by 47822 on 2017/6/12.
 */
function quakooUtils.isBlack(data) {
    return (data == "" || typeof(data)  == "undefined" || data == null || isNullJson(data)) ? true : false;
}

function quakooUtils.isNotBlack(data) {
    return (data == "" || typeof(data)  == "undefined"|| data == null || isNullJson(data)) ? false : true;
}

//存用户登录信息
function quakooUser.setUserInfo(user){
    $api.setStorage("userInfo", user);
    console.log(user);
}
//取
function quakooUser.getUserInfo() {
    return $api.getStorage("userInfo");
}
//ajax
function quakooData.ajaxGetData(url, getData, callBack) {
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
        callBack(ret, err);
    });
}

function ajaxGetWithProgress(url, getData, callBack) {
    api.showProgress({});
    quakooData.ajaxGetData(url, getData, function(ret,err){
        callBack(ret, err);

    });
}
//======================================================================= 登 录 =====================================================================
//验证手机号码
function checkMobileNum(mobileNum){
    if(!(/^1[3|4|5|7|8][0-9]\d{8}$/.test(mobileNum))){
        return false;
    }
    return true;
}
var login = function(){
    return {

    }
}
var login = (function(Signin){
    var getCodeFlag = true;
    //登录单击事件
    Signin.clickLoginBtn = function(data,url,callback){
        quakooData.ajaxGetData(url,data,function(ret,err) {
            if (ret && ret.id) {
                var user = ret;
                cleanDb(function (ret, err) {
                    quakooUser.setUserInfo(user);
                    bindPush();
                    quakooApp.closeWin();
                });
                callback();
            } else {
                var msg = "出错了，请稍后。";
                if (ret && ret.msg) {
                    msg = ret.msg;
                }
                api.toast({
                    msg: msg
                });
            }
        })
    }
    //获取验证码
    Signin.getCode = function (data,url) {
        if(!getCodeFlag){
            return;
        }
        getCodeFlag = false;
        if(!checkMobileNum(phone)){
            quakooMsg.toast("手机号码不正确");
            return;
        }
        ajaxGetWithProgress(url,data,function(ret){
            if(ret){
                quakooMsg.toast('获取成功');
                setTime();
                $api.setStorage(Storage_Sms_Time,new Date().getTime());
            } else {
                getCodeFlag = false;
                var msg="出错了，请稍后。";
                if(ret&&ret.msg){
                    msg=ret.msg;
                }
                api.toast({
                    msg :msg
                });
            }
        });
    }
    //倒计时
    Signin.setTime = function(btnId,color){
        var time;
        var sms = document.getElementById( btnId );
        sms.style.backgroundColor = color;
        time=time||60;
        sms.innerHTML = time+"s";
        var codeInterval =  setInterval(function(){
            if(time > 0){
                time--;
                sms.innerHTML =time+"s";
            }else{
                sms.style.backgroundColor = "#fff";
                sms.innerHTML = "获取";
                clearInterval(codeInterval);
                getCodeFlag = true;
            }
        },1000)
    }
    Signin.aa = function(){
    }
    return Signin;
})(login)
//=-=====================================================================上传图片============================================
var uploadPic = function(){
    return {

    }
}

var uploadPic = (function (pic) {
    //压缩图片
    pic.coverToSuffix = function () {
        var header = src.substring(0,src.lastIndexOf("."));
        var suffix = src.substring(src.lastIndexOf("."));
        return header+suffix.toLocaleLowerCase();
    }

    pic.compressImageList = function (imgList,callBack) {
        var compactPicture = api.require('compactPicture');
        compactPicture.HittingPic({
            picpatharray: imgList,//压缩 图片数组
            size: 5 //图片压缩的质量 ,参数范围 1 － 10 , 例如5，图片压缩至原质量的百分之 50，尺寸不变，个人建议为 4 或者 5
        }, function(ret) { //返回一个ret 图片地址数组
            if(quakooUtils.isNotBlack(ret)  && quakooUtils.isNotBlack(ret.states)){
                //转换成小写
                var resultList = new Array;
                var states = ret.states;
                for(var i = 0;i < states.length;i++){
                    resultList.push(uploadPic.coverToSuffix(states[i]));
                }
                callBack(resultList);
            }
        });
    }
    pic.uploadImg = function (reta,url) {
        api.showProgress({title: '努力加载中...',text: '先喝杯茶...'});
        api.ajax({
            url: url,
            method: 'post',
            timeout: 120,
            report: true,
            dataType: 'json',
            returnAll: false,
            data: {
                files: {file:reta}
            }
        }, function (ret, err) {
            if(ret.status == 1){
                //异步调用
                document.getElementById("icon").src = ret.body.ok;
                var user = quakooUser.getUserInfo();
                user.icon = ret.body.ok;
                quakooUser.setUserInfo(user)

            }

        });

    }
    //选择图片 传icon？
    pic.checkPic = function(type){
        typea = type;
        imgType = type;
        api.actionSheet({
            title: '选择图片',
            cancelTitle: '取消',
            buttons: ['拍照','从手机相册选择']
        },function(ret,err) {
            var index = ret.buttonIndex;
            var sourceType;
            switch (index) {
                case 1 :
                    sourceType = 'camera';
                    break;
                case 2 :
                    sourceType = 'album';
                    break;
                default :
                    return;
            }
            api.showProgress({title: '努力加载中...',text: '先喝杯茶...'});
            api.getPicture({
                sourceType: sourceType, //library 图片库/camera 相机/album 相册 打开方式
                mediaValue: 'pic', //媒体类型 pic 图片/video 视频/all 视频和图片 安卓不支持
                destinationType: 'url', //返回的数据类型 地址或者base64编码后的str； base64和url
                allowEdit: false,//是否选择图片后进行编辑
                quality: 100,//图片质量 0-100整数
                saveToPhotoAlbum: true //拍照或者录完视频后是否存到本地
            }, function(ret, err){
                if(quakooUtils.isNotBlack(ret)&&quakooUtils.isNotBlack(ret.data)){
                    var imgList = [];
                    imgList.push(ret.data)
                    compressImageList(imgList,function(ret){
                        uploadPic.uploadImg(ret,uploadImageUrl);
                    });
                    // quakooApp.openNewWindow("imgClip",imgClipUrl,pageParam,{bounces:false});

                }else{

                }
            });
        })
    }

    return pic;
})(uploadPic)
//=======================================================================微信分享================================
//所有的调用之前都需要在apiready里声明全局变量作为第一个参数传到方法里
var shareFn = function () {
    return {

    }
}

var shareFn = (function(share){
//	var weiXin = api.require('weiXin');  使用前需要一个全局变量声明模块 然后传入到方法的参数里
    //注册App
    share.registerWxApp = function(weiXin){
        weiXin.registerApp(
            function(ret, err) {
                if (ret.status) {

                } else {
                    api.alert({ msg: err.msg });
                }
            }
        );
    };
    share.registerSinaApp = function(){
        sinaWeiBo.auth(function(ret, err) {
            if (ret.status) {
                quakooMsg.toast("授权微博成功")
            } else {
                api.alert({ msg: '授权失败' + err.msg });
            }
        });
    }
    //微博视频分享
    share.sendRequestSinaVideo = function (sinaWeiBo,text,imgUrl,title,desc,thumbUrl,videoUrl,callback) {
        sinaWeiBo.sendRequest({
            contentType: 'video',
            text:text,
            imageUrl: imgUrl,
            media: {
                title:title,
                description:desc,
                thumbUrl: thumbUrl,
                videoUrl: videoUrl
            }
        }, function(ret, err) {
            if (ret.status) {
                if(callback){
                    callback()
                }
            } else {
                api.alert({
                    title: '发表失败',
                    msg: err.msg,
                    buttons: ['确定']
                });
            }
        });
    }
    //微博文字分享
    share.sendRequestSinaText = function (sinaWeiBo,text,imgUrl,callback) {
        sinaWeiBo.sendRequest({
            contentType: 'text',
            text: text,
            imageUrl:imgUrl
        }, function(ret, err) {
            if (ret.status) {
                if(callback){
                    callback()
                }
            } else {
                api.alert({
                    title: '发表微博',
                    msg: '发表失败',
                    buttons: ['确定']
                });
            }
        });
    }
    //微信分享			                  分享途径 / 类型 /  标题   /  内容  / 图标路径 /  内容的URL 只有type是text的时候可以是空的
    share.sendRequest = function (weiXin,scene,contentType,title,description,thumbUrl,contentUrl,callback) {
        //scene 分享的途径 session 会话 timeline 朋友圈 favorite 收藏
        //contentType 内容类型 text 文本// image 图片 //music 音乐 //video 视频 //web_page 网页
        weiXin.sendRequest({
            scene: scene,
            contentType: contentType,
            title: title,
            description: description  || "",
            thumbUrl: thumbUrl,
            contentUrl: contentUrl
        }, function(ret, err) {
            if (ret.status) {
                callback();
            } else {
                api.alert({ title: '发表失败', msg: err.msg, buttons: ['确定'] });
            }
        });

    }
    share.installed = function (qq) {
        qq.installed(function(ret, err) {
            if (ret.status) {
                api.alert({ msg: "安装" });
            } else {
                api.alert({ msg: "没有安装" });
            }
        });
    }
    share.qqLogin = function(qq){
    	qq.login(function(ret, err) {
    		if(ret){
    			api.alert({
			        title: 'id和token',
			        msg: ret.openId + ret.accessToken
			    });
    		}else{

    		}

		});
    }
    // var qq = api.require('qq'); 调用 写在apiready里
    //shareFn.shareNews(qq,'http://www.baidu.com','百度一下吧','描述是什么','./img/a.png','QFriend')

    //qq分享                                         分享的地址/标题/描述/图片地址/分享途径 QZone、QFriend
    share.shareNews = function(qq,url,title,desc,imgUrl,type){
    	qq.shareNews({
		    url:url,
		    title: title,
		    description: desc,
		    imgUrl: imgUrl,
		    type:type
		});
    }
    share.shareImage = function(qq,title,desc,imgUrl,type){
    	qq.shareNews({
		    title: title,
		    description: desc,
		    imgUrl: imgUrl,
		     type:type
		});
    }
    share.shareMusic = function(qq,url,title,desc,imgUrl,type){
    	qq.shareNews({
		    url:url,
		    title: title,
		    description: desc,
		    imgUrl: imgUrl,
		     type:type
		});
    }
    share.shareVideo = function(qq,url,title,desc,imgUrl,type){
    	qq.shareNews({
		    url:url,
		    title: title,
		    description: desc,
		    imgUrl: imgUrl,
		     type:type
		});
    }
    return share;
})(shareFn)

var sms = function (){
    return {

    }
}
var sms = (function(a){
    //调用前需要传数组 content为发送的内容
    a.sendSms = function (num,content,callback){
        api.sms({
            numbers: num,
            text: content
        }, function(ret, err) {
            if (ret && ret.status) {
                callback(ret);

            } else {
                //发送失败
            }
        });
    }
    return a;
})(sms)
