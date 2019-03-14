var sendFlag = true;
var Storage_Sms_Time = "smsTime";
//初始化页面的时候，从本地内存获取验证码时间
function initSmsTime(){
    var lastSmsTime = quakooDb.getItem(Storage_Sms_Time);
    if(quakooUtils.isNotBlack(lastSmsTime)){
        var now = new Date().getTime();
        if((now - lastSmsTime) < 120000){
            sendFlag=false;
            setTimeToCode(Math.ceil(120 - ((now - lastSmsTime) / 1000)));
        }
    }
}


//发送验证码
function sms(type){
    if(!sendFlag){
        return;
    }
    sendFlag = false;
    var tel = $api.byId('tel').value;
    if(!quakooUtils.isMobileNum(tel)){
        sendFlag = true;
        quakooMsg.toast("手机号码不正确");
        return;
    }
    var url = config.getUrl_web_user_createAuthCodeOnUpdatePassword();
    if(type=='register'){
        url = getCode;
    }
    quakooData.ajaxSubmitDataNoToken(url,{
        phone : tel
    },function(ret){
        if(ret && ret.success){
            setTimeToCode();
            quakooDb.setItem(Storage_Sms_Time,new Date().getTime());
        } else {
            sendFlag = true;
            var errorMsg="出错了，请稍后。";
            if(ret&&ret.msg){
                errorMsg=ret.msg;
            }
            api.toast({msg : errorMsg});
        }
    });
}



/***************验证码倒计时***************************/

function setTimeToCode(time){
    var code = document.getElementById('sms')||document.getElementById('yzm');
    time=time||120;
    code.innerHTML ="剩余"+ time+"s";
    var codeInterval =  setInterval(function(){
        if(time > 0){
            time--;
            code.innerHTML ="剩余"+time+"s";
        }else{
            code.innerHTML = "获取验证码";
            sendFlag = true;
            clearInterval(codeInterval);
        }
    },1000)

}
