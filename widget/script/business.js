//点赞
/**
 * @param tid 业务ID
 * @param self 当前对象
 * @param btype 业务类型 1.评论 2.timeline 3.通知 4.宝宝评语 5.文档
 *
 * 1.切换本地数据状态，防止加载过程中多次点击导致数据不正确
 * 2.如果失败切回本地数据状态
 *
 */
function support(tid,self,btype){
    stopEventBubble();
    var type = $api.attr(self,"type");

    if(type == 1){
        var supportval = $api.html(self);
        $api.html(self,(Number(supportval) +1));
        $api.css(self,"background-image:url(../../image/dianzan02.png)");
        $api.attr(self,"type","2");
        quakooData.ajaxGetData(supportadd,{type:btype,typeId:tid},function(ret,err){
            if(ret&&ret.success){
                quakooMsg.toast("点赞成功！");
            }else{
                $api.html(self,(supportval));
                $api.css(self,"background-image:url(../../image/dianzan01.png)");
                $api.attr(self,"type","1");
                quakooMsg.toast("网络连接失败，请重试！")
            }
        })
    }else if(type == 2){
        var supportval =  $api.html(self);
        $api.html(self,(Number(supportval) -1));
        $api.css(self,"background-image:url(../../image/dianzan01.png)");
        $api.attr(self,"type","1");
        quakooData.ajaxGetData(supportdelete,{type:btype,typeId:tid},function(ret,err){
            if(ret&&ret.success){
                quakooMsg.toast("取消点赞成功！");
            }else{
                $api.html(self,(supportval));
                $api.css(self,"background-image:url(../../image/dianzan02.png)");
                $api.attr(self,"type","2");
                quakooMsg.toast("网络连接失败，请重试！")
            }
        })
    }
}

//收藏
/**
 * @param tid 业务ID
 * @param self 当前对象
 * @param btype 业务类型 1.评论 2.timeline 3.通知 4.宝宝评语 5.文档
 *
 *
 *
 */
function favorite(tid,self,btype){
    stopEventBubble();
    var type = $api.attr(self,"type");
    if(type == 1){
        var favoriteVal = $api.html(self);
        $api.html(self,(Number(favoriteVal) +1));
        $api.css(self,"background-image:url(../../image/mystudy04.png)");
        $api.attr(self,"type","2");
        quakooData.ajaxGetData(favoriteadd,{type:5,typeId:tid},function(ret,err){
            if(ret&&ret.success){
                quakooMsg.toast("收藏成功！");
            }else{
                $api.html(self,(supportval));
                $api.css(self,"background-image:url(../../image/mystudy05.png)");
                $api.attr(self,"type","1");
                quakooMsg.toast("网络连接失败，请重试！")
            }
        })
    }
    else{
        var favoriteVal = $api.html(self);
        $api.html(self,(Number(favoriteVal) -1));
        $api.css(self,"background-image:url(../../image/mystudy05.png)");
        $api.attr(self,"type","1");
        quakooData.ajaxGetData(favoritedelete,{type:5,typeId:tid},function(ret,err){
            if(ret&&ret.success){
                quakooMsg.toast("取消收藏成功！");
            }else{
                $api.html(self,(supportval));
                $api.css(self,"background-image:url(../../image/mystudy04.png)");
                $api.attr(self,"type","2");
                quakooMsg.toast("网络连接失败，请重试！")
            }
        })
    }
}


